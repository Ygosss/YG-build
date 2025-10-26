// src/features/Room/RoomCard.ts

import { m } from '../../lib/selectors.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { createItemElement } from '../Items/ItemRegistry.ts';
import { Room, Item, Dispatch } from '../../lib/types.ts';

/**
 * สร้าง DOM Element สำหรับ "ห้อง" (Room Card)
 * [Replaces me() and he() logic]
 * @param {object} roomData - ข้อมูลห้อง (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createRoomElement = (roomData: Room, dispatch: Dispatch): HTMLElement | null => {
    const template = document.querySelector<HTMLTemplateElement>(m.roomTpl);
    if (!template) {
        console.error("Room template not found");
        return null;
    }
    const element = template.content.cloneNode(true).firstElementChild as HTMLDetailsElement;
    if (!element) return null;

    element.id = roomData.id;
    element.dataset.roomId = roomData.id;

    // --- Query Selectors ---
    const nameInput = element.querySelector<HTMLInputElement>(m.roomNameInput);
    const nameDisplay = element.querySelector<HTMLElement>(m.roomNameDisplay);
    const itemsContainer = element.querySelector<HTMLElement>(m.allItemsContainer);
    // const roomBrief = element.querySelector<HTMLElement>(m.roomBrief); // ไม่ได้ใช้

    if (!nameInput || !nameDisplay || !itemsContainer) {
        console.error("RoomCard essential elements not found.");
        return null;
    }

    // --- Populate Room Data ---
    nameInput.value = roomData.room_name || "";
    nameDisplay.textContent = roomData.room_name || "ห้องใหม่";
    
    // ตั้งค่าการเปิด/ปิด และการระงับ
    if (roomData.is_open === false) {
        element.open = false;
    }
    if (roomData.is_suspended) {
        element.classList.add("is-suspended");
    }

    // --- Render Items (CRITICAL STEP) ---
    // ล้าง item เก่า (ถ้ามี)
    itemsContainer.innerHTML = '';
    // สร้าง Item ใหม่จาก State
    if (roomData.items && roomData.items.length > 0) {
        roomData.items.forEach((itemData: Item) => {
            // ใช้ ItemRegistry (Factory) เพื่อสร้าง Item DOM
            const itemEl = createItemElement(itemData, dispatch);
            if (itemEl) {
                itemsContainer.appendChild(itemEl);
            }
        });
    } else {
        // (อาจเพิ่ม placeholder ว่าง)
    }

    // --- Room-specific Event Listeners (Internal) ---
    // (Action หลักๆ เช่น 'del-room', 'add-item' จะถูกดักจับโดย global handler)

    // อัปเดตชื่อห้อง
    nameInput.addEventListener("input", (e: Event) => {
        const newName = (e.target as HTMLInputElement).value;
        nameDisplay.textContent = newName || "ห้องใหม่";
        // (Global handler จะ debounce และ dispatch action)
    });
    
    // อัปเดตสถานะเปิด/ปิด
    element.addEventListener("toggle", () => {
        dispatch(ActionTypes.ROOM_TOGGLE_OPEN, {
            roomId: roomData.id
        }, { skipUndo: true, skipSave: true }); // ไม่ต้อง undo/save แค่การเปิดปิด
    });
    
    // TODO: Update room brief (สรุปย่อ)
    // roomBrief.textContent = ...

    return element;
};