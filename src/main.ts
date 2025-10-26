// src/main.ts 

// 1. IMPORT STYLES
import './style.css'; 

// 2. Import Modules
import { m } from './lib/selectors.ts';
import * as store from './lib/store.ts';
import * as ui from './lib/ui.ts';
import * as handlers from './lib/handlers.ts';
import * as dataManager from './features/Data/ImportExport.ts';
import { PRICING_CONFIG } from './lib/state.ts';
import { AppState, Room } from './lib/types.ts'; // Import types

// Import View Components
import { renderCustomerCard } from './features/CustomerCard/CustomerCard.ts';
import { createRoomElement } from './features/Room/RoomCard.ts';
import { renderSummary } from './features/Totals/SummaryFooter.ts';
import { updateQuickNav } from './features/Reporting/VisualSummary.ts';
import { applyFilterToState, isFiltering } from './features/Filtering/Filtering.ts';


/**
 * =================================================================
 * MAIN RENDER LOOP
 * =================================================================
 */

const roomsContainer = document.querySelector<HTMLElement>(m.roomsContainer);

/**
 * Render App (Subscriber Function)
 * [Replaces he()]
 * @param {object} state - The full application state
 */
const renderApp = (state: AppState): void => {
    if (!roomsContainer) {
        console.error("Rooms container not found. Cannot render.");
        return;
    }
    
    // 1. Apply Filtering (if active)
    const stateToRender = isFiltering() ? applyFilterToState(state) : state;

    // 2. Render Customer Card
    renderCustomerCard(stateToRender);

    // 3. Render Rooms & Items
    // (Diffing logic: remove/update/add rooms)
    
    // 3a. Get current DOM room IDs
    const domRoomIds = new Set(Array.from(roomsContainer.querySelectorAll<HTMLElement>(".room-card")).map(el => el.id));
    // 3b. Get state room IDs
    const stateRoomIds = new Set(stateToRender.rooms.map(room => room.id));

    // 3c. Remove rooms not in state
    domRoomIds.forEach(id => {
        if (!stateRoomIds.has(id)) {
            document.getElementById(id)?.remove();
        }
    });
    
    // 3d. Update/Add rooms
    let lastElement: HTMLElement | null = null;
    stateToRender.rooms.forEach((room: Room, index: number) => {
        const existingEl = document.getElementById(room.id);
        if (existingEl) {
            // TODO: Add diffing logic here? 
            // For now, full re-render of room is safer
            const newEl = createRoomElement(room, store.dispatch);
            if (newEl) {
                existingEl.replaceWith(newEl);
                lastElement = newEl;
            }
        } else {
            // Add new room
            const newEl = createRoomElement(room, store.dispatch);
            if (newEl) {
                // Insert in correct order
                if (!lastElement) {
                    roomsContainer.prepend(newEl);
                } else {
                    lastElement.after(newEl);
                }
                lastElement = newEl;
            }
        }
    });
    
    if (stateToRender.rooms.length === 0) {
        // roomsContainer.innerHTML = `<p class="text-center muted">ยังไม่มีห้อง (คลิก 'เพิ่มห้อง' เพื่อเริ่มต้น)</p>`;
    }

    // 4. Render Footer Summary
    renderSummary(stateToRender);
    
    // 5. Update UI elements
    updateQuickNav(stateToRender);
    ui.updateSuspendedUI(isFiltering()); // (อัปเดตปุ่ม)
    ui.updateToggleAllButtonUI();
}; //


/**
 * เติมราคา Dropdowns
 * [Replaces pe()]
 */
const populatePriceDropdowns = (): void => {
    const template = document.querySelector<HTMLTemplateElement>(m.setTpl);
    if (!template) return; // Fails silently if template isn't ready

    const priceSelect = template.content.querySelector<HTMLSelectElement>(m.setPricePerMSelect);
    const sheerPriceSelect = template.content.querySelector<HTMLSelectElement>(m.setSheerPricePerMSelect);
    const louisPriceSelect = template.content.querySelector<HTMLSelectElement>(m.setLouisPricePerMSelect);

    const createOptions = (priceArray: number[]): string => {
        let html = '<option value="" hidden>เลือกราคา</option>';
        if (Array.isArray(priceArray)) {
            priceArray.forEach(price => {
                html += `<option value="${price}">${price.toLocaleString("th-TH")}</option>`;
            });
        }
        return html;
    };

    if (priceSelect) priceSelect.innerHTML = createOptions(PRICING_CONFIG.fabric);
    if (sheerPriceSelect) sheerPriceSelect.innerHTML = createOptions(PRICING_CONFIG.sheer);
    if (louisPriceSelect) louisPriceSelect.innerHTML = createOptions(PRICING_CONFIG.louis);
};


/**
 * ฟังก์ชันเริ่มต้นแอปพลิเคชัน
 */
const initApp = (): void => {
    // 1. ตั้งค่า Theme
    ui.applyTheme();
    
    // 2. ลงทะเบียน Global Handlers
    handlers.initGlobalHandlers();

    // 3. ลงทะเบียน Data Handlers
    dataManager.initDataHandlers();
    
    // 4. เติม Dropdown ผ้าม่าน
    populatePriceDropdowns();
    
    // 5. เชื่อมต่อ Render Loop เข้ากับ Store
    store.subscribe(renderApp);
    
    // 6. โหลด State (นี่จะเป็นตัว Trigger การ Render ครั้งแรก)
    store.loadInitialState();
};

// --- RUN APP ---
initApp();