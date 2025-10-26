// src/features/Modals/DimensionEntryModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { toNum, toNumStr } from '../../lib/utils.ts';

const modalEl = document.querySelector<HTMLElement>("#dimensionEntryModal");
const widthInput = modalEl?.querySelector<HTMLInputElement>('input[name="modal_width_m"]');
const heightInput = modalEl?.querySelector<HTMLInputElement>('input[name="modal_height_m"]');
const confirmBtn = modalEl?.querySelector<HTMLButtonElement>("#dimensionEntryConfirm");

/**
 * แสดงและจัดการ Modal กรอกขนาด
 * [Replaces part of Se()]
 * @param {string} roomId
 */
export const showDimensionModal = (roomId: string): void => {
    if (!modalEl || !widthInput || !heightInput || !confirmBtn) {
        console.error("DimensionEntryModal elements not found.");
        return;
    }

    // 1. Reset fields
    widthInput.value = "";
    heightInput.value = "";
    confirmBtn.disabled = true;

    // 2. Add event listeners
    const validate = () => {
        const width = toNum(widthInput.value);
        const height = toNum(heightInput.value);
        confirmBtn.disabled = !(width > 0 && height > 0);
    };
    widthInput.addEventListener("input", validate);
    heightInput.addEventListener("input", validate);

    const onBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        target.value = toNumStr(target.value);
    };
    widthInput.addEventListener("blur", onBlur);
    heightInput.addEventListener("blur", onBlur);

    // 3. Show modal
    ui.showModal("#dimensionEntryModal").then((result: boolean | { cancelled: boolean }) => {
        if (result === true) {
            // User clicked Confirm
            store.dispatch(ActionTypes.ITEM_ADD, {
                roomId: roomId,
                // ส่ง dimensions ไปพร้อมกัน (Reducer ต้องรองรับ)
                width_m: toNum(widthInput.value),
                height_m: toNum(heightInput.value)
            });
            ui.showToast("เพิ่มรายการใหม่แล้ว", "success");
        }
        
        // 4. Cleanup
        widthInput.removeEventListener("input", validate);
        heightInput.removeEventListener("input", validate);
        widthInput.removeEventListener("blur", onBlur);
        heightInput.removeEventListener("blur", onBlur);
    });
}; //