// src/features/Items/AreaBased/AreaBasedItem.ts

import { m } from '../../../lib/selectors.ts';
import { toNum, toNumStr, formatThaiNumber, debounce, formatDecimal } from '../../../lib/utils.ts';
import { ActionTypes } from '../../../lib/actions.ts';
import { calculateAreaBasedPrice } from './areabased.calculator.ts';
import { AreaBasedItem, Dispatch } from '../../../lib/types.ts';

/**
 * สร้าง DOM Element สำหรับ AreaBased Item (มู่ลี่, ม่านม้วน ฯลฯ)
 * [Replaces Ee()]
 * @param {object} itemData - ข้อมูล Item (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createAreaBasedElement = (itemData: AreaBasedItem, dispatch: Dispatch): HTMLElement | null => {
    const template = document.querySelector<HTMLTemplateElement>(m.areaBasedTpl);
    if (!template) {
        console.error("AreaBased template not found");
        return null;
    }
    const element = template.content.cloneNode(true).firstElementChild as HTMLElement;
    if (!element) return null;
    
    element.dataset.type = itemData.type;

    // --- Query Selectors ---
    const widthInput = element.querySelector<HTMLInputElement>(m.areaWidthInput);
    const heightInput = element.querySelector<HTMLInputElement>(m.areaHeightInput);
    const priceInput = element.querySelector<HTMLInputElement>(m.areaPriceSqydInput);
    const codeInput = element.querySelector<HTMLInputElement>(m.areaCodeInput);
    const notesInput = element.querySelector<HTMLTextAreaElement>(m.areaNotesInput);
    const summaryEl = element.querySelector<HTMLElement>("[data-item-summary]");

    if (!widthInput || !heightInput || !priceInput || !codeInput || !notesInput || !summaryEl) {
        console.error("AreaBasedItem essential elements not found.");
        return null;
    }

    // --- Update Summary ---
    const updateSummary = () => {
        const { total, sqm, sqyd } = calculateAreaBasedPrice(itemData);
        if (total > 0) {
            summaryEl.innerHTML = `
                <i class="ph ph-ruler"></i> ${formatDecimal(sqm)} ตร.ม. (${formatDecimal(sqyd, 1)} หลา)
                <i class="ph ph-tag"></i> <strong>${formatThaiNumber(total)}</strong> บาท
            `;
        } else {
            summaryEl.innerHTML = `<i class="ph ph-warning-circle"></i> <span>กรอกข้อมูล (กว้าง, สูง, ราคา/หลา)</span>`;
        }
    };

    // --- Event Listeners (Dimension) ---
    const onDimBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const value = toNum(target.value);
        target.value = toNumStr(value); // Format to 2 decimals
        
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            field: target.name,
            value: value // ส่งเป็นตัวเลข
        });
    };
    widthInput.addEventListener("blur", onDimBlur);
    heightInput.addEventListener("blur", onDimBlur);

    // --- Event Listeners (Numeric Price/Code/Notes) ---
    const handleNumericFocus = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        if (toNum(target.value) > 0) {
            target.value = String(toNum(target.value)); // Convert "1,000" to "1000"
        }
    };
    const handleNumericBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const num = toNum(target.value);
        target.value = (num > 0) ? formatThaiNumber(num) : "";
        
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            field: target.name,
            value: num // ส่งเป็นตัวเลข
        });
    };
    
    priceInput.addEventListener("focus", handleNumericFocus);
    priceInput.addEventListener("blur", handleNumericBlur);
    
    // Handlers for text fields
    const onTextBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
         dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            field: target.name,
            value: target.value
        });
    };
    codeInput.addEventListener("blur", onTextBlur);
    notesInput.addEventListener("blur", onTextBlur);

    // --- Populate Initial Data ---
    widthInput.value = toNumStr(itemData.width_m);
    heightInput.value = toNumStr(itemData.height_m);
    priceInput.value = formatThaiNumber(toNum(itemData.price_sqyd));
    codeInput.value = itemData.code || "";
    notesInput.value = itemData.notes || "";

    if (itemData.is_suspended) {
        element.classList.add("is-suspended");
    }

    updateSummary(); // Initial summary
    
    return element;
};