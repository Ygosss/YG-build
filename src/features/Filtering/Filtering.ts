// src/features/Filtering/Filtering.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import { AppState, Room } from '../../lib/types.ts'; // Import types

type FilterType = 'suspended' | 'type' | null;

interface CurrentFilter {
    type: FilterType;
    keyword: string | null;
}

let currentFilter: CurrentFilter = {
    type: null, // 'suspended', 'type'
    keyword: null
};

/**
 * ตั้งค่า Filter
 * [Replaces part of rt()]
 * @param {'suspended' | 'type' | null} type
 * @param {string | null} keyword
 */
export const setFilter = (type: FilterType, keyword: string | null = null): void => {
    currentFilter.type = type;
    currentFilter.keyword = keyword;
    
    // อัปเดต Filter Status Bar UI
    const statusBar = document.querySelector<HTMLElement>(m.filterStatusBar);
    if (!statusBar) return;
    
    if (type === 'suspended') {
        statusBar.innerHTML = 'กำลังแสดงเฉพาะรายการที่ถูกระงับ <button type="button" class="btn-link" data-act="clear-filter">ล้าง</button>';
        statusBar.classList.add("is-visible");
    } else if (type === 'type' && keyword) {
         statusBar.innerHTML = `กำลังแสดงเฉพาะ "${keyword}" <button type="button" class="btn-link" data-act="clear-filter">ล้าง</button>`;
         statusBar.classList.add("is-visible");
    } else {
        statusBar.innerHTML = "";
        statusBar.classList.remove("is-visible");
    }
    
    // อัปเดต UI อื่นๆ ที่เกี่ยวข้อง
    ui.updateSuspendedUI(type === 'suspended');
    ui.updateToggleAllButtonUI();
}; //

/**
 * ล้าง Filter
 */
export const clearFilter = (): void => {
    setFilter(null, null);
};

/**
 * กรอง State (สำหรับ Render)
 * [Replaces part of rt()]
 * @param {object} state - Full application state
 * @returns {object} Filtered state (copy)
 */
export const applyFilterToState = (state: AppState): AppState => {
    const { type, keyword } = currentFilter;
    if (!type) {
        return state; // ไม่มีการกรอง, คืน State เดิม
    }

    // สร้าง State ใหม่ (copy) สำหรับการแสดงผล
    // หมายเหตุ: JSON.parse(JSON.stringify()) เป็น Deep Copy ที่ง่ายที่สุด
    const filteredState: AppState = JSON.parse(JSON.stringify(state)); 
    
    filteredState.rooms = filteredState.rooms.map((room: Room) => {
        if (type === 'suspended') {
            // กรองเฉพาะ Item ที่ระงับ (ในห้องที่ไม่ได้ระงับ)
            room.items = room.items.filter(item => item.is_suspended);
        } else if (type === 'type') {
            // กรองตามประเภท Item
            room.items = room.items.filter(item => item.type === keyword);
        }
        return room;
    }).filter((room: Room) => {
        // ซ่อนห้องที่ไม่มี Item ตรงตามเงื่อนไข (ยกเว้นกรณีดูกห้องที่ระงับ)
        if (type === 'suspended') {
            return room.is_suspended || room.items.length > 0;
        }
        return room.items.length > 0;
    });

    return filteredState;
};

/**
 * @returns {boolean}
 */
export const isFiltering = (): boolean => !!currentFilter.type;