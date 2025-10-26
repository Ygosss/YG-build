// src/lib/handlers.ts

import { m } from './selectors.ts';
import * as store from './store.ts';
import * as ui from './ui.ts';
import { ActionTypes } from './actions.ts';
import { toNum, toNumStr, formatThaiNumber, debounce, escapeHTML, sanitizeFileName } from './utils.ts';
import { initialState } from './state.ts';
import { AppState } from './types.ts';

// Import Modals
import { showDiscountModal } from '../features/Modals/DiscountModal.ts';
import { showDimensionModal } from '../features/Modals/DimensionEntryModal.ts';
import { showItemTypeModal } from '../features/Modals/ItemTypeModal.ts';
import { showFavoritesModal } from '../features/Modals/FavoritesModal.ts';
import { showFavoritesManagerModal } from '../features/Modals/FavoritesManagerModal.ts';
import { showRoomDefaultsModal } from '../features/Modals/RoomDefaultsModal.ts';
import { showHardwareModal } from '../features/Modals/HardwareModal.ts';

// Import Data/Report Handlers
import * as dataManager from '../features/Data/ImportExport.ts';
import * as textGen from '../features/Reporting/TextGenerator.ts';
import * as pdfGen from '../features/Reporting/PdfGenerator.ts';
import * as visualSummary from '../features/Reporting/VisualSummary.ts';
import * as webhook from '../features/Reporting/WebhookSubmit.ts';
import * as filter from '../features/Filtering/Filtering.ts';

// --- State Variables ---
let isLocked = false;

// --- Debounced Handlers ---
// (Typed payload for clarity, though 'any' is flexible)
type DebouncedPayload = { roomId: string, field: string, value: string };
type DebouncedFunction<T> = (payload: T) => void;

const debouncedCustomerUpdate: DebouncedFunction<{ field: string, value: string }> = debounce((payload) => {
    store.dispatch(ActionTypes.CUSTOMER_UPDATE_FIELD, payload);
}, 300);

const debouncedRoomNameUpdate: DebouncedFunction<DebouncedPayload> = debounce((payload) => {
    store.dispatch(ActionTypes.ROOM_UPDATE_NAME, payload);
}, 300);

/**
 * Handler หลักสำหรับ "input" event (real-time)
 * [Replaces ge()]
 * @param {Event} e
 */
const onGlobalInput = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || target.readOnly || isLocked) return;

    const action = target.dataset.act;
    const name = target.name;

    if (action === "update-customer-field") {
        debouncedCustomerUpdate({ field: name, value: target.value });
    }
}; //

/**
 * Handler หลักสำหรับ "blur" event (focus loss)
 * [Replaces ye()]
 * @param {Event} e
 */
const onGlobalBlur = (e: FocusEvent): void => {
    const target = e.target as HTMLInputElement;
    if (!target || target.readOnly || isLocked) return;
    
    // 1. Room Name (uses dataset for roomId)
    const roomId = target.closest<HTMLElement>("[data-room-id]")?.dataset.roomId;
    if (target.matches(m.roomNameInput) && roomId) {
        debouncedRoomNameUpdate({
            roomId: roomId,
            field: 'room_name',
            value: target.value
        });
        return; // Handled
    }
    
    // (Other input blurs are handled by specific components like SetItem, AreaBasedItem, etc.)
}; //

/**
 * Handler หลักสำหรับ "focusin" event
 * [Replaces ve()]
 * @param {Event} e
 */
const onGlobalFocusIn = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    if (!target || target.readOnly || isLocked) return;
    
    // 1. Favorite Inputs
    if (target.matches(m.favInput)) {
        const itemEl = target.closest<HTMLElement>(".item-card");
        if (itemEl) {
            const { roomId, itemId } = (itemEl as any).dataset;
            showFavoritesModal(target, roomId, itemId);
        }
    }
    
    // 2. Numeric Inputs (select all text on focus)
    if (target.type === "text" && target.inputMode === "decimal") {
        target.select();
    }
}; //

/**
 * Handler หลักสำหรับ "click" event (Event Delegation)
 * [Replaces pe()]
 * @param {Event} e
 */
const onGlobalClick = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest<HTMLElement>("[data-act]");
    if (!actionEl) return; // Not an action
    
    const action = actionEl.dataset.act;
    const itemEl = actionEl.closest<HTMLElement>(".item-card");
    const roomEl = actionEl.closest<HTMLElement>(".room-card");
    const roomId = roomEl?.dataset.roomId;
    const itemId = itemEl?.dataset.itemId || itemEl?.id;

    const menuDropdown = document.querySelector<HTMLElement>(m.menuDropdown);

    // Lock check (ยกเว้นปุ่มปลดล็อค)
    if (isLocked && action !== "toggle-lock") {
        ui.showToast("แอปถูกล็อคอยู่", "warning");
        return;
    }
    
    switch (action) {
        // === App/Menu Actions ===
        case "toggle-menu":
            menuDropdown?.classList.toggle("show");
            break;
        case "toggle-lock":
            isLocked = !isLocked;
            store.dispatch(ActionTypes.APP_SET_LOCK, { locked: isLocked }, { skipUndo: true, skipSave: true });
            ui.updateLockUI(isLocked);
            ui.showToast(isLocked ? "ล็อคแอปแล้ว" : "ปลดล็อคแอปแล้ว", isLocked ? "warning" : "success");
            break;
        case "undo":
            store.popUndo();
            break;
        case "toggle-theme":
            ui.toggleTheme();
            break;
        case "show-overview":
            visualSummary.showVisualSummary();
            break;
        case "copy-text-summary":
            navigator.clipboard.writeText(textGen.generateTextSummary(store.getState() as AppState));
            ui.showToast("คัดลอกสรุปข้อความแล้ว", "success");
            break;
        case "submit-webhook":
            webhook.submitToWebhook();
            break;
        case "toggle-all-rooms":
            ui.toggleAllRooms();
            break;

        // === Data Actions ===
        case "trigger-import":
            document.querySelector<HTMLInputElement>(m.fileImporter)?.click();
            break;
        case "export-data":
            dataManager.exportData();
            break;
        case "trigger-import-favs":
            document.querySelector<HTMLInputElement>(m.favImporter)?.click();
            break;
        case "export-favs":
            dataManager.exportFavorites();
            break;
        case "manage-favs":
            const itemType = actionEl.dataset.itemType;
            if (itemType) showFavoritesManagerModal(itemType);
            break;
        case "clear-items":
            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ 'ทุกรายการ' (คงข้อมูลลูกค้าไว้)?")) {
                store.dispatch(ActionTypes.APP_LOAD_STATE, {
                    ...initialState,
                    customer_name: (store.getState() as AppState).customer_name,
                    customer_phone: (store.getState() as AppState).customer_phone,
                    customer_address: (store.getState() as AppState).customer_address,
                });
                ui.showToast("ล้างทุกรายการแล้ว", "success");
            }
            break;
        case "clear-all":
            if (confirm("!!! ยืนยันการล้างข้อมูลทั้งหมด !!!\nคุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้าและทุกรายการ?")) {
                store.dispatch(ActionTypes.APP_LOAD_STATE, initialState);
                ui.showToast("ล้างข้อมูลทั้งหมดแล้ว", "success");
            }
            break;
            
        // === Room Actions ===
        case "add-room":
            store.dispatch(ActionTypes.ROOM_ADD, {});
            break;
        case "del-room":
            if (roomId && confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${roomEl?.querySelector(m.roomNameInput)?.value}"?`)) {
                store.dispatch(ActionTypes.ROOM_DELETE, { roomId });
            }
            break;
        case "toggle-room-suspend":
            if (roomId) store.dispatch(ActionTypes.ROOM_TOGGLE_SUSPEND, { roomId });
            break;
        case "show-room-defaults":
            if (roomId) showRoomDefaultsModal(roomId);
            break;
        case "apply-hardware-all":
            if (roomId) showHardwareModal(roomId);
            break;

        // === Item Actions ===
        case "add-item-dim": // (ปุ่ม + กรอกขนาด)
            if (roomId) showDimensionModal(roomId);
            break;
        case "add-item-type": // (ปุ่ม + เลือกประเภท)
            // (ยังไม่ Implement)
            break;
        case "select-item-type": // (คลิกที่ Placeholder)
            if (roomId && itemId) {
                const newType = await showItemTypeModal(roomId, itemId);
                if (newType) {
                    store.dispatch(ActionTypes.ITEM_SET_TYPE, { roomId, itemId, itemType: newType });
                }
            }
            break;
        case "del-item":
            if (roomId && itemId && confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
                store.dispatch(ActionTypes.ITEM_DELETE, { roomId, itemId });
            }
            break;
        case "toggle-suspend": // (ใช้ชื่อนี้ใน Placeholder)
        case "toggle-item-suspend":
            if (roomId && itemId) store.dispatch(ActionTypes.ITEM_TOGGLE_SUSPEND, { roomId, itemId });
            break;
        case "duplicate-item":
            if (roomId && itemId) store.dispatch(ActionTypes.ITEM_DUPLICATE, { roomId, itemId });
            break;
        
        // === Wallpaper-specific Actions ===
        case "add-wall":
            // (handled in WallpaperItem.ts)
            break;
        case "del-wall":
            const wallIndex = (actionEl as HTMLElement).dataset.wallIndex;
            if (roomId && itemId && wallIndex !== undefined) {
                store.dispatch(ActionTypes.ITEM_DELETE_WALL, { roomId, itemId, index: parseInt(wallIndex, 10) });
            }
            break;

        // === Modal Actions ===
        case "show-discount-modal":
            showDiscountModal();
            break;
            
        // === PDF Actions ===
        case "export-pdf":
            const generate = (withDetails: boolean) => {
                const state = store.getState() as AppState;
                const html = pdfGen.generatePdfHtml(state, withDetails);
                const title = sanitizeFileName(`ใบเสนอราคา_${state.customer_name || 'ลูกค้า'}`);
                
                const win = window.open("", title, "width=800,height=600");
                win?.document.write(html);
                win?.document.close();
                // win?.print(); // (Disabled auto-print)
                (document.querySelector("#pdfOptionsModal") as any)?.closeModal({ cancelled: true });
            };
            
            const withDetailsBtn = document.querySelector("#pdfWithDetails");
            const withoutDetailsBtn = document.querySelector("#pdfWithoutDetails");

            if (withDetailsBtn) {
                (withDetailsBtn as HTMLButtonElement).onclick = () => generate(true);
            }
            if (withoutDetailsBtn) {
                (withoutDetailsBtn as HTMLButtonElement).onclick = () => generate(false);
            }
            
            ui.showModal(m.pdfOptionsModal);
            menuDropdown?.classList.remove("show");
            break;
            
        // === Filter Actions ===
        case "show-suspended-items":
            filter.setFilter('suspended');
            break;
        case "clear-filter":
            filter.clearFilter();
            break;
        case "filter-by-type":
            const typeToFilter = actionEl.dataset.filterType;
            if (typeToFilter) {
                filter.setFilter('type', typeToFilter);
                (document.querySelector(m.overviewModal) as any)?.closeModal({ cancelled: true });
            }
            break;

        default:
            // console.warn(`Unhandled action: ${action}`);
            break;
    }
    
    // Close menu if clicking an action (but not toggle itself)
    if (action !== "toggle-menu" && menuDropdown?.classList.contains("show")) {
        if (!menuDropdown.contains(actionEl)) {
             menuDropdown.classList.remove("show");
        }
    }
}; //

/**
 * ลงทะเบียน Event Listeners ทั้งหมด
 */
export const initGlobalHandlers = (): void => {
    const form = document.querySelector<HTMLFormElement>(m.orderForm);
    if (!form) {
        console.error("Order form not found. Handlers not attached.");
        return;
    }
    
    document.addEventListener("click", onGlobalClick);
    document.addEventListener("focusin", onGlobalFocusIn, true);
    
    form.addEventListener("input", onGlobalInput);
    form.addEventListener("blur", onGlobalBlur, true); 

    window.addEventListener("beforeunload", (e) => {
        if (!isLocked) {
            console.log("Saving state before unload...");
            // การบันทึกอัตโนมัติควรทำใน store.dispatch, 
            // แต่สำรองไว้เผื่อกรณี customer info ที่ debounce
            store.saveCurrentState(); 
        }
    });
}; //