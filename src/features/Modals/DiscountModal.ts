// src/features/Modals/DiscountModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { toNum, formatThaiNumber } from '../../lib/utils.ts';
import { calculateAppTotal } from '../Totals/totals.calculator.ts';
import { AppState, Discount } from '../../lib/types.ts';

const modalEl = document.querySelector<HTMLElement>(m.discountModal);
const subtotalEl = modalEl?.querySelector<HTMLElement>(m.discountSubtotal);
const finalTotalEl = modalEl?.querySelector<HTMLElement>(m.discountFinalTotal);
const typeInput = modalEl?.querySelector<HTMLSelectElement>(m.discountTypeInput);
const valueInput = modalEl?.querySelector<HTMLInputElement>(m.discountValueInput);
const percentDisplay = modalEl?.querySelector<HTMLInputElement>(m.discountPercent);
const amountDisplay = modalEl?.querySelector<HTMLInputElement>(m.discountAmount);

let currentSubtotal = 0;

/**
 * อัปเดตการคำนวณใน Modal ส่วนลด
 * [Internal logic from Rt()]
 */
const updateDiscountModalTotals = (): void => {
    if (!typeInput || !valueInput || !percentDisplay || !amountDisplay || !finalTotalEl) return;

    const type = typeInput.value as Discount['type'];
    const value = toNum(valueInput.value);
    let finalTotal = currentSubtotal;
    // let discountAmount = 0; // ไม่ได้ใช้

    if (type === 'percent') {
        const discountAmount = (currentSubtotal * value) / 100;
        finalTotal = currentSubtotal - discountAmount;
        percentDisplay.value = value > 0 ? value.toFixed(2) : "";
        amountDisplay.value = "";
    } else { // 'amount'
        // const discountAmount = value; // ไม่ได้ใช้
        finalTotal = currentSubtotal - value;
        amountDisplay.value = value > 0 ? formatThaiNumber(value) : "";
        percentDisplay.value = "";
    }
    
    finalTotalEl.textContent = formatThaiNumber(finalTotal);
}; //

/**
 * แสดงและจัดการ Discount Modal
 * [Replaces Rt()]
 */
export const showDiscountModal = (): void => {
    if (!modalEl || !subtotalEl || !typeInput || !valueInput) {
         console.error("DiscountModal elements not found.");
         return;
    }

    const state: AppState = store.getState();
    currentSubtotal = calculateAppTotal(state);
    
    // 1. Populate current state
    subtotalEl.textContent = formatThaiNumber(currentSubtotal);
    typeInput.value = state.discount.type || 'amount';
    valueInput.value = toNum(state.discount.value) > 0 ? String(toNum(state.discount.value)) : "";
    
    // 2. Add event listeners
    typeInput.addEventListener("change", updateDiscountModalTotals);
    valueInput.addEventListener("input", updateDiscountModalTotals);

    // 3. Initial calculation
    updateDiscountModalTotals();

    // 4. Show modal
    ui.showModal(m.discountModal).then((result: boolean | { cancelled: boolean }) => {
        if (result === true) {
            // User clicked Confirm
            store.dispatch(ActionTypes.DISCOUNT_SET, {
                type: typeInput.value,
                value: toNum(valueInput.value)
            });
            ui.showToast("บันทึกส่วนลดแล้ว", "success");
        }
        
        // 5. Cleanup
        typeInput.removeEventListener("change", updateDiscountModalTotals);
        valueInput.removeEventListener("input", updateDiscountModalTotals);
    });
}; //