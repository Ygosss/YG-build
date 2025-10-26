// src/features/Totals/SummaryFooter.ts

import { m } from '../../lib/selectors.ts';
import { formatThaiNumber } from '../../lib/utils.ts';
import { calculateAppTotal } from './totals.calculator.ts';
import { AppState, Discount } from '../../lib/types.ts';

/**
 * Render (แสดงผล) ยอดรวม และ ส่วนลด
 * [Replaces J() and discount logic from Rt()]
 * @param {object} state - Full application state
 */
export const renderSummary = (state: AppState): void => {
    const originalTotalEl = document.querySelector<HTMLElement>(m.originalTotal);
    const grandTotalEl = document.querySelector<HTMLElement>(m.grandTotal);
    const discountBtn = document.querySelector<HTMLButtonElement>('[data-act="show-discount-modal"]');
    
    if (!originalTotalEl || !grandTotalEl || !discountBtn) return;

    // 1. Calculate Original Total
    const originalTotal = calculateAppTotal(state);
    originalTotalEl.textContent = formatThaiNumber(originalTotal);
    
    // 2. Calculate Discount
    const discount: Discount = state.discount || { type: 'amount', value: 0 };
    let discountAmount = 0;
    let discountText = "ส่วนลด";
    
    if (discount.type === 'percent' && discount.value > 0) {
        discountAmount = (originalTotal * discount.value) / 100;
        discountText = `ส่วนลด (${discount.value}%)`;
    } else if (discount.type === 'amount' && discount.value > 0) {
        discountAmount = discount.value;
        discountText = `ส่วนลด (${formatThaiNumber(discount.value)} บ.)`;
    }

    // 3. Calculate Grand Total
    const grandTotal = originalTotal - discountAmount;
    grandTotalEl.textContent = formatThaiNumber(grandTotal);

    // 4. Update Discount Button UI
    const span = discountBtn.querySelector("span");
    if (span) {
        span.textContent = discountText;
    }
    discountBtn.classList.toggle("is-active", discountAmount > 0);
};