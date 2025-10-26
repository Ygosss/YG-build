// src/features/Reporting/VisualSummary.ts

import { m } from '../../lib/selectors.ts';
import * as store from '../../lib/store.ts';
import * as ui from '../../lib/ui.ts';
import { ITEM_NAMES } from '../../lib/state.ts';
// import { calculateAppTotal } from '../Totals/totals.calculator.ts'; // ไม่ได้ใช้
import { calculateSetPrice, calculateFabricYardage } from '../Items/Set/set.calculator.ts';
import { toNum, formatThaiNumber, formatDecimal } from '../../lib/utils.ts';
import { AppState, Room, Item, SetItem } from '../../lib/types.ts';

const overviewModal = document.querySelector<HTMLElement>(m.overviewModal);
const overviewHeader = overviewModal?.querySelector<HTMLElement>(m.overviewModalHeader);
const overviewBody = overviewModal?.querySelector<HTMLElement>(m.overviewModalBody);
const quickNavList = document.querySelector<HTMLElement>(m.quickNavRoomList);
const quickNavBtnText = document.querySelector<HTMLElement>(m.quickNavBtnText);

/**
 * อัปเดต Quick Nav Dropdown
 * [Replaces Lt()]
 * @param {object} state
 */
export const updateQuickNav = (state: AppState): void => {
    if (!quickNavList || !quickNavBtnText) return;
    
    quickNavList.innerHTML = ""; // Clear old list
    let totalRooms = 0;
    
    state.rooms.forEach((room: Room) => {
        if (!room.is_suspended) {
            totalRooms++;
            const li = document.createElement("li");
            li.innerHTML = `<a href="#${room.id}" data-room-id="${room.id}">${room.room_name || "ห้องใหม่"}</a>`;
            quickNavList.appendChild(li);
        }
    });
    
    quickNavBtnText.textContent = `(${totalRooms}) ห้อง`;
    quickNavList.closest(m.quickNavDropdown)?.classList.toggle("hidden", totalRooms === 0);
}; //

/**
 * สร้างและแสดง Modal สรุปภาพรวม
 * [Replaces $t()]
 */
export const showVisualSummary = (): void => {
    if (!overviewModal || !overviewHeader || !overviewBody) {
        console.error("Overview modal elements not found.");
        return;
    }

    const state: AppState = store.getState();
    overviewHeader.textContent = "สรุปภาพรวม";
    let html = "";

    interface TypeSummary {
        count: number;
        total: number;
    }
    const typeSummary: { [key: string]: TypeSummary } = {};
    let totalFabric = 0;

    // 1. Process data
    state.rooms.forEach((room: Room) => {
        if (room.is_suspended) return;
        room.items.forEach((item: Item) => {
            if (item.is_suspended || !item.type) return;
            
            if (!typeSummary[item.type]) {
                typeSummary[item.type] = { count: 0, total: 0 };
            }
            typeSummary[item.type].count++;
            
            if (item.type === 'set') {
                const setItem = item as SetItem;
                const price = calculateSetPrice(setItem);
                typeSummary[item.type].total += price.total;
                totalFabric += calculateFabricYardage(setItem.style, setItem.width_m);
            }
            // (เพิ่มการคำนวณ total สำหรับ type อื่นๆ ถ้าต้องการ)
        });
    });

    // 2. Build HTML
    html += "<h4>สรุปตามประเภท</h4>";
    html += "<div class='summary-tags-container'>";
    for (const [type, data] of Object.entries(typeSummary)) {
        html += `<span class="summary-tag" data-filter-type="${type}">
                    ${ITEM_NAMES[type] || type} 
                    (${data.count} รายการ)
                 </span>`;
    }
    html += "</div>";
    
    html += "<hr>";
    html += "<h4>สรุปการใช้ผ้า (โดยประมาณ)</h4>";
    html += `<p>ใช้ผ้าทั้งหมดประมาณ ${formatDecimal(totalFabric, 1)} หลา</p>`;
    
    overviewBody.innerHTML = html;

    // 3. Show modal
    ui.showModal(m.overviewModal);
}; //