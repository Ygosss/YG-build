// src/features/Items/Placeholder/PlaceholderItem.ts

import { m } from '../../../lib/selectors.ts';
import { toNumStr } from '../../../lib/utils.ts';
// import { ActionTypes } from '../../../lib/actions.ts'; // ไม่ได้ใช้โดยตรง
import { BaseItem, Dispatch } from '../../../lib/types.ts';

/**
 * สร้าง DOM Element สำหรับ Item ที่ยังไม่ถูกเลือกประเภท (Placeholder)
 * [Replaces part of Se() and #itemPlaceholderTpl logic]
 * @param {object} itemData - ข้อมูล Item (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createPlaceholderElement = (itemData: BaseItem, dispatch: Dispatch): HTMLElement | null => {
    // (dispatch ถูกส่งมาเผื่ออนาคต แต่ไม่ได้ใช้ในฟังก์ชันนี้)
    
    const template = document.querySelector<HTMLTemplateElement>("#itemPlaceholderTpl");
    if (!template) {
        console.error("itemPlaceholderTpl not found");
        return null;
    }
    const element = template.content.cloneNode(true).firstElementChild as HTMLElement;
    if (!element) return null;

    element.dataset.type = "placeholder";
    element.id = itemData.id;
    element.dataset.roomId = itemData.roomId;

    // --- Populate ---
    const widthEl = element.querySelector<HTMLElement>("[data-placeholder-width]");
    const heightEl = element.querySelector<HTMLElement>("[data-placeholder-height]");

    if (widthEl) {
        widthEl.textContent = toNumStr(itemData.width_m) || "0.00";
    }
    if (heightEl) {
        heightEl.textContent = toNumStr(itemData.height_m) || "0.00";
    }

    if (itemData.is_suspended) {
        element.classList.add("is-suspended");
    }
    
    // --- Event Listener ---
    // (Event 'data-act="select-item-type"' จะถูกดักจับโดย global handler)
    
    return element;
};