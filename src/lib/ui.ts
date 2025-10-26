// src/lib/ui.ts

import { m } from './selectors.ts';
import { escapeHTML } from './utils.ts';
// import { hasUndo } from './store.ts'; // (ย้ายการเรียก hasUndo ไปที่ store)

type ToastType = 'default' | 'success' | 'warning' | 'error';
type ModalResult = boolean | string | { cancelled: boolean };

const THEME_STORAGE_KEY = "marnthara.theme";
const modalStack: HTMLElement[] = []; // Stack for nested modals

/**
 * แสดง Toast notification
 * [Original: $]
 * @param {string} message
 * @param {ToastType} type
 */
export const showToast = (message: string, type: ToastType = "default"): void => {
    const container = document.querySelector<HTMLElement>(m.toastContainer);
    if (!container) return;

    const icons: { [key in ToastType]: string } = {
        success: "ph-bold ph-check-circle",
        warning: "ph-bold ph-warning",
        error: "ph-bold ph-x-circle",
        default: "ph-bold ph-info",
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="${icons[type] || icons.default}"></i> ${escapeHTML(message)}`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
}; //

/**
 * แสดง Modal (Core Function)
 * [Original: ye]
 * @param {string} selector
 * @returns {Promise<ModalResult>}
 */
export const showModal = (selector: string): Promise<ModalResult> => {
    const modalEl = document.querySelector<HTMLElement>(selector);
    if (!modalEl) {
        console.error(`Modal with selector "${selector}" not found.`);
        return Promise.reject("Modal not found");
    }
    
    // (ใช้ 'any' เพื่อเข้าถึง .closeModal และ .resolvePromise ที่เราจะเพิ่มเข้าไป)
    const modalInstance: any = modalEl;

    return new Promise((resolve) => {
        // ซ่อน Modal ก่อนหน้า (ถ้ามี)
        if (modalStack.length > 0) {
            modalStack[modalStack.length - 1].classList.add("modal-hidden");
        }
        modalStack.push(modalEl);
        
        // --- Attach promise controls to the element ---
        modalInstance.resolvePromise = resolve;
        
        modalInstance.closeModal = (result: ModalResult) => {
            modalInstance.classList.remove("show");
            // คืนค่า resolve (ถ้ายังไม่ถูก resolve)
            if (modalInstance.resolvePromise) {
                modalInstance.resolvePromise(result);
                modalInstance.resolvePromise = null; // ป้องกันการเรียกซ้ำ
            }
            
            // Cleanup
            modalStack.pop();
            // แสดง Modal ก่อนหน้า (ถ้ามี)
            if (modalStack.length > 0) {
                modalStack[modalStack.length - 1].classList.remove("modal-hidden");
            }
        };

        // --- Event Listeners ---
        const onConfirm = (e: Event) => {
            // หยุดการ propagate เพื่อไม่ให้ click-outside ทำงาน
            e.stopPropagation();
            modalInstance.closeModal(true); // Resolve as true
        };
        
        const onCancel = (e: Event) => {
            e.stopPropagation();
            modalInstance.closeModal({ cancelled: true });
        };
        
        const onClickOutside = (e: Event) => {
            if (e.target === modalInstance) {
                modalInstance.closeModal({ cancelled: true });
            }
        };
        
        // Find buttons
        const confirmBtn = modalEl.querySelector<HTMLButtonElement>(".modal-confirm");
        const cancelBtn = modalEl.querySelector<HTMLButtonElement>(".modal-cancel");
        const closeBtn = modalEl.querySelector<HTMLButtonElement>(m.modalCloseBtn);

        // Attach listeners
        if (confirmBtn) confirmBtn.onclick = onConfirm;
        if (cancelBtn) cancelBtn.onclick = onCancel;
        if (closeBtn) closeBtn.onclick = onCancel;
        modalEl.addEventListener("click", onClickOutside);
        
        // --- Show Modal ---
        modalEl.classList.add("show");
        
        // Auto-focus on the first input
        modalEl.querySelector<HTMLInputElement>("input, select, textarea")?.focus();
    });
}; //

/**
 * ตั้งค่า Theme (Light/Dark)
 * [Original: se]
 */
export const applyTheme = (): void => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-theme");
    } else {
        document.documentElement.classList.remove("dark-theme");
    }
}; //

/**
 * สลับ Theme
 * [Original: fe]
 */
export const toggleTheme = (): void => {
    const isDark = document.documentElement.classList.toggle("dark-theme");
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
}; //

/**
 * อัปเดตปุ่ม Undo
 * [Original: ee]
 * @param {boolean} canUndo
 */
export const updateUndoButton = (canUndo: boolean): void => {
    const btn = document.querySelector<HTMLButtonElement>(m.undoBtn);
    if (btn) {
        btn.disabled = !canUndo;
    }
}; //

/**
 * อัปเดต UI ปุ่ม Lock
 * [Original: Oe]
 * @param {boolean} isLocked
 */
export const updateLockUI = (isLocked: boolean): void => {
    const btn = document.querySelector<HTMLButtonElement>(m.lockBtn);
    const icon = btn?.querySelector("i");
    if (btn && icon) {
        btn.classList.toggle("active", isLocked);
        icon.className = isLocked ? "ph-fill ph-lock" : "ph ph-lock";
        document.body.classList.toggle("is-locked", isLocked);
    }
}; //

/**
 * ขยาย/ย่อ ห้องทั้งหมด
 * [Original: ce]
 */
export const toggleAllRooms = (): void => {
    // กรองเฉพาะห้องที่แสดงผลอยู่ (ไม่นับห้องที่ถูก filter ออก)
    const rooms = document.querySelectorAll<HTMLDetailsElement>(m.room + ":not([style*='display: none'])");
    if (rooms.length === 0) return;
    
    // ถ้ามีห้องใดยังเปิดอยู่ -> ปิดทั้งหมด
    // ถ้าทุกห้องปิดอยู่ -> เปิดทั้งหมด
    const anyOpen = Array.from(rooms).some(room => room.open);
    rooms.forEach(room => {
        room.open = !anyOpen;
    });
    updateToggleAllButtonUI();
}; //

/**
 * อัปเดต UI ของปุ่ม Suspended
 * [Original: re]
 * @param {boolean} isFiltered (เพื่อซ่อนปุ่มเมื่อกำลัง filter)
 */
export const updateSuspendedUI = (isFiltered: boolean): void => {
    const btn = document.querySelector<HTMLButtonElement>(m.suspendedItemsBtn);
    if (!btn) return;
    
    // ถ้ากำลัง filter อยู่ ให้ซ่อนปุ่มนี้
    if (isFiltered) {
        btn.classList.remove("is-visible");
        return;
    }
    
    const badge = document.querySelector<HTMLElement>(m.suspendedCountBadge);
    // นับ item ที่ suspended (ในห้องที่ active)
    const suspendedItems = document.querySelectorAll(".room-card:not(.is-suspended) .item-card.is-suspended").length;
    // นับห้องที่ suspended
    const suspendedRooms = document.querySelectorAll<HTMLElement>(".room-card.is-suspended");
    
    let itemsInSuspendedRooms = 0;
    suspendedRooms.forEach(room => {
        // นับ item ที่ active (ในห้องที่ suspended)
        itemsInSuspendedRooms += room.querySelectorAll(".item-card:not(.is-suspended)").length;
    });
    
    const totalSuspended = suspendedItems + itemsInSuspendedRooms;
    
    if (badge) badge.textContent = String(totalSuspended);
    btn.classList.toggle("is-visible", totalSuspended > 0);
}; //

/**
 * อัปเดต UI ของปุ่ม Collapse/Expand
 * [Original: ae]
 */
export const updateToggleAllButtonUI = (): void => {
    const rooms = document.querySelectorAll<HTMLDetailsElement>(m.room + ":not([style*='display: none'])");
    const btn = document.querySelector<HTMLButtonElement>(m.toggleAllRoomsBtn);
    if (!btn) return;
    
    const icon = btn.querySelector("i");
    const span = btn.querySelector("span");
    if (!icon || !span) return;

    if (rooms.length === 0) {
        icon.className = "ph ph-caret-down";
        span.textContent = "ขยายทั้งหมด";
        return;
    }
    
    const anyOpen = Array.from(rooms).some(room => room.open);
    icon.className = anyOpen ? "ph ph-caret-up" : "ph ph-caret-down";
    span.textContent = anyOpen ? "ย่อทั้งหมด" : "ขยายทั้งหมด";
}; //