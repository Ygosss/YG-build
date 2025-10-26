// src/features/Modals/ItemTypeModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { ITEM_TYPES } from '../../lib/state.ts';
// import { ActionTypes } from '../../lib/actions.ts'; // ไม่ได้ใช้
import { AppState } from '../../lib/types.ts';

// --- ย้ายตัวแปรทั้งหมดมาไว้ที่นี่ แต่ยังไม่กำหนดค่า --
let modalEl: HTMLElement | null = null;
let titleEl: HTMLElement | null = null;
let buttonContainer: HTMLElement | null = null;
let buttonsInitialized = false; // Flag ป้องกันการสร้างปุ่มซ้ำ

type ResolveFn = (value: string | null) => void;
let currentResolve: ResolveFn | null = null;

/**
 * ฟังก์ชันสำหรับค้นหา DOM และสร้างปุ่ม (จะถูกเรียกแค่ครั้งแรก)
 */
const initializeModal = (): void => {
    if (buttonsInitialized) return; // ทำงานแค่ครั้งเดียว

    modalEl = document.querySelector<HTMLElement>(m.itemTypeModal);
    if (!modalEl) {
        console.error("CRITICAL: ItemTypeModal not found in DOM.");
        return;
    }

    titleEl = modalEl.querySelector<HTMLElement>(m.itemTypeModalTitle);
    buttonContainer = modalEl.querySelector<HTMLElement>(".item-type-buttons");

    if (!buttonContainer) {
        // นี่คือจุดที่เกิด Error: buttonContainer เป็น null
        console.error("CRITICAL: .item-type-buttons not found in ItemTypeModal.");
        return;
    }

    // --- ย้ายโค้ดบรรทัดที่ 40 (สร้างปุ่ม) มาไว้ที่นี่ ---
    buttonContainer.innerHTML = ''; // Clear existing
    Object.entries(ITEM_TYPES).forEach(([key, config]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-secondary";
        button.dataset.itemType = key;
        button.textContent = config.name;
        buttonContainer.appendChild(button);
    });
    
    buttonsInitialized = true; // ตั้ง Flag ว่าสร้างปุ่มแล้ว
};

/**
 * Event Handler (Delegated)
 * @param {Event} e
 */
const onClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    const itemType = target.closest<HTMLButtonElement>("[data-item-type]")?.dataset.itemType;
    
    if (itemType) {
        if (currentResolve) {
            currentResolve(itemType); // ส่งค่า itemType กลับไป
            currentResolve = null;
        }
        (modalEl as any).closeModal(itemType); // ปิด Modal และส่งค่า
    }
};

/**
 * แสดงและจัดการ Modal เลือกประเภทสินค้า
 * [Replaces it()]
 * @param {string} roomId
 * @param {string} itemId
 * @returns {Promise<string | null>}
 */
export const showItemTypeModal = (roomId: string, itemId: string): Promise<string | null> => {
    
    // 1. เรียก initialize() เพื่อค้นหา DOM และสร้างปุ่ม (ถ้ายังไม่ได้ทำ)
    initializeModal();

    // 2. ตรวจสอบว่า initialize สำเร็จหรือไม่
    if (!buttonsInitialized || !modalEl || !titleEl || !buttonContainer) {
        ui.showToast("Error: ไม่สามารถโหลด Modal เลือกประเภทได้", "error");
        return Promise.resolve(null); // คืนค่า null เพื่อไม่ให้แครช
    }

    return new Promise((resolve) => {
        currentResolve = resolve; // เก็บ resolve function
        
        // 3. Set title
        const roomName = (store.getState() as AppState).rooms.find(r => r.id === roomId)?.room_name || "";
        titleEl.textContent = `เพิ่มรายการใน "${roomName}"`;
        
        // 4. Add event listener
        buttonContainer.addEventListener("click", onClick);

        // 5. Show modal
        ui.showModal(m.itemTypeModal).then((result: string | { cancelled: boolean }) => {
            // `result` จะเป็น itemType หรือ { cancelled: true }
            if (typeof result !== 'string' && result?.cancelled) {
                resolve(null); // User pressed Esc or clicked backdrop
            }
            // (ถ้า resolve ถูกเรียกโดย onClick แล้ว, การเรียก resolve(null) ซ้ำซ้อนจะไม่เป็นปัญหา)
            
            // 6. Cleanup
            buttonContainer.removeEventListener("click", onClick);
            currentResolve = null;
        });
    });
}; //