// src/features/Items/Wallpaper/WallpaperItem.ts

import { m } from '../../../lib/selectors.ts';
import { toNum, toNumStr, formatThaiNumber, debounce, formatDecimal } from '../../../lib/utils.ts';
import { ActionTypes } from '../../../lib/actions.ts';
import { calculateWallpaperPrice } from './wallpaper.calculator.ts';
import { WallpaperItem, Dispatch } from '../../../lib/types.ts';

/**
 * สร้าง DOM Element สำหรับ Wallpaper Item
 * [Replaces Be()]
 * @param {object} itemData - ข้อมูล Item (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createWallpaperElement = (itemData: WallpaperItem, dispatch: Dispatch): HTMLElement | null => {
    const template = document.querySelector<HTMLTemplateElement>(m.wallpaperTpl);
    if (!template) {
        console.error("Wallpaper template not found");
        return null;
    }
    const element = template.content.cloneNode(true).firstElementChild as HTMLElement;
    if (!element) return null;

    element.dataset.type = "wallpaper";

    // --- Query Selectors ---
    const heightInput = element.querySelector<HTMLInputElement>(m.wallHeightInput);
    const codeInput = element.querySelector<HTMLInputElement>(m.wallCodeInput);
    const priceInput = element.querySelector<HTMLInputElement>(m.wallPriceRollInput);
    const installInput = element.querySelector<HTMLInputElement>(m.wallInstallCostInput);
    const notesInput = element.querySelector<HTMLTextAreaElement>(m.wallNotesInput);
    const wallsContainer = element.querySelector<HTMLElement>("[data-walls-container]");
    const addWallBtn = element.querySelector<HTMLButtonElement>('[data-act="add-wall"]');
    const summaryEl = element.querySelector<HTMLElement>("[data-item-summary]");

    if (!heightInput || !codeInput || !priceInput || !installInput || !notesInput || !wallsContainer || !addWallBtn || !summaryEl) {
        console.error("WallpaperItem essential elements not found.");
        return null;
    }
    
    // --- Update Summary (Internal) ---
    const updateSummary = () => {
        const { total, rolls, sqm } = calculateWallpaperPrice(itemData);
        if (total > 0) {
            summaryEl.innerHTML = `
                <i class="ph ph-ruler"></i> ${formatDecimal(sqm)} ตร.ม. (${rolls} ม้วน)
                <i class="ph ph-tag"></i> <strong>${formatThaiNumber(total)}</strong> บาท
            `;
        } else {
            summaryEl.innerHTML = `<i class="ph ph-warning-circle"></i> <span>กรอกข้อมูล (สูง, ราคา/ม้วน, กว้าง)</span>`;
        }
    };

    // --- Create Wall Element (Internal Helper) ---
    const createWallElement = (width: number, index: number): HTMLElement => {
        const div = document.createElement("div");
        div.className = "wall-input-group";
        div.innerHTML = `
            <input type="text" class="form-control" name="wall_width_${index}" 
                   value="${toNumStr(width)}" 
                   placeholder="กว้าง (ม.)" 
                   data-wall-index="${index}"
                   inputmode="decimal">
            <button type"button" class="btn-icon danger" data-act="del-wall" data-wall-index="${index}" title="ลบผนัง" aria-label="ลบผนัง">
                <i class="ph ph-x"></i>
            </button>
        `;
        return div;
    };
    
    // --- Event Listeners (Wall Widths) ---
    wallsContainer.addEventListener("blur", (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        if (target.tagName === "INPUT" && target.dataset.wallIndex !== undefined) {
            const index = parseInt(target.dataset.wallIndex, 10);
            const value = toNum(target.value);
            target.value = toNumStr(value); // Format
            
            if (itemData.widths && itemData.widths[index] !== value) {
                dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
                    roomId: itemData.roomId,
                    itemId: itemData.id,
                    field: 'widths', // Reducer ต้อง handle 'widths'
                    value: [
                        ...itemData.widths.slice(0, index),
                        value,
                        ...itemData.widths.slice(index + 1)
                    ]
                });
            }
        }
    }, true); // Use capture phase

    // --- Event Listeners (Main fields) ---
    const onDimBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const value = toNum(target.value);
        target.value = toNumStr(value);
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId, itemId: itemData.id,
            field: target.name, value: value
        });
    };
    heightInput.addEventListener("blur", onDimBlur);

    const handleNumericFocus = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        // Allow "0" for install cost
        if (target.value === "0") return;
        if (toNum(target.value) > 0) {
            target.value = String(toNum(target.value));
        }
    };
    const handleNumericBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        // Allow "0" for install cost
        if (target.value === "0") {
             dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
                roomId: itemData.roomId, itemId: itemData.id,
                field: target.name, value: 0
            });
            return;
        }
        const num = toNum(target.value);
        target.value = (num > 0) ? formatThaiNumber(num) : "";
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId, itemId: itemData.id,
            field: target.name, value: num
        });
    };
    
    priceInput.addEventListener("focus", handleNumericFocus);
    priceInput.addEventListener("blur", handleNumericBlur);
    installInput.addEventListener("focus", handleNumericFocus);
    installInput.addEventListener("blur", handleNumericBlur);
    
    notesInput.addEventListener("blur", (e: FocusEvent) => {
         dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId, itemId: itemData.id,
            field: 'notes', value: (e.target as HTMLTextAreaElement).value
        });
    });
    codeInput.addEventListener("blur", (e: FocusEvent) => {
         dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId, itemId: itemData.id,
            field: 'code', value: (e.target as HTMLInputElement).value
        });
    });
    
    addWallBtn.addEventListener("click", () => {
        dispatch(ActionTypes.ITEM_ADD_WALL, {
            roomId: itemData.roomId,
            itemId: itemData.id
        });
    });

    // --- Populate Initial Data ---
    heightInput.value = toNumStr(itemData.height_m);
    priceInput.value = formatThaiNumber(itemData.price_per_roll);
    // Handle install cost (0 is valid, default is 300)
    installInput.value = (itemData.install_cost_per_roll === 0) ? "0" : formatThaiNumber(itemData.install_cost_per_roll || 300);
    codeInput.value = itemData.code || "";
    notesInput.value = itemData.notes || "";

    // Render walls
    wallsContainer.innerHTML = '';
    if (itemData.widths && itemData.widths.length > 0) {
        itemData.widths.forEach((width, index) => {
            wallsContainer.appendChild(createWallElement(width, index));
        });
    } else {
        // ถ้าไม่มี wall, สร้าง wall เริ่มต้น 1 อัน (State จะถูกอัปเดต)
         dispatch(ActionTypes.ITEM_ADD_WALL, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            skipUndo: true // ไม่ต้อง undo การสร้าง wall แรก
        });
    }

    if (itemData.is_suspended) {
        element.classList.add("is-suspended");
    }
    
    updateSummary();

    return element;
};