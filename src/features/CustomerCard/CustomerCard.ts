// src/features/CustomerCard/CustomerCard.ts

import { m } from '../../lib/selectors.ts';
import { AppState } from '../../lib/types.ts';

/**
 * Render (แสดงผล) ข้อมูลลูกค้าจาก State ลงใน input fields
 * @param {object} customerState - ส่วนของ State ที่เกี่ยวกับลูกค้า (ในที่นี้คือ AppState ทั้งหมด)
 */
export const renderCustomerCard = (customerState: AppState): void => {
    const nameInput = document.querySelector<HTMLInputElement>(m.customerNameInput);
    const phoneInput = document.querySelector<HTMLInputElement>(m.customerPhoneInput);
    const addressInput = document.querySelector<HTMLTextAreaElement>(m.customerAddressInput);
    const cardDetails = document.querySelector<HTMLDetailsElement>(m.customerCard);

    if (nameInput && nameInput.value !== customerState.customer_name) {
        nameInput.value = customerState.customer_name || "";
    }
    if (phoneInput && phoneInput.value !== customerState.customer_phone) {
        phoneInput.value = customerState.customer_phone || "";
    }
    if (addressInput && addressInput.value !== customerState.customer_address) {
        addressInput.value = customerState.customer_address || "";
    }
    
    // จัดการการเปิด/ปิดการ์ด (ถ้ามีใน State)
    if (cardDetails) {
        if (customerState.customer_card_open === false && cardDetails.open) {
            cardDetails.open = false;
        } else if (customerState.customer_card_open === true && !cardDetails.open) {
            cardDetails.open = true;
        }
    }
};