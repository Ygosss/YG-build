// src/features/Modals/FavoritesManagerModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as favService from '../../lib/services/favorites.ts';
import { ITEM_NAMES } from '../../lib/state.ts';
import { toNum, formatThaiNumber, escapeHTML } from '../../lib/utils.ts';
import { FavoriteItem } from '../../lib/services/favorites.ts'; // Import types

// Manager Modal
const managerModalEl = document.querySelector<HTMLElement>(m.favManagerModal);
const titleEl = managerModalEl?.querySelector<HTMLElement>(m.favManagerTitle);
const bodyEl = managerModalEl?.querySelector<HTMLElement>(m.favManagerBody);
const itemTpl = document.querySelector<HTMLTemplateElement>(m.favManagerItemTpl);
const editBtn = managerModalEl?.querySelector<HTMLButtonElement>(m.favManagerEditBtn);
const delBtn = managerModalEl?.querySelector<HTMLButtonElement>(m.favManagerDelBtn);

// Add Modal
const addModalEl = document.querySelector<HTMLElement>(m.favAddModal);
const addCodeInput = addModalEl?.querySelector<HTMLInputElement>(m.favAddCodeInput);
const addPriceInput = addModalEl?.querySelector<HTMLInputElement>(m.favAddPriceInput);

// Edit Modal
const editModalEl = document.querySelector<HTMLElement>(m.favEditModal);
const editCodeInput = editModalEl?.querySelector<HTMLInputElement>(m.favEditCodeInput);
const editPriceInput = editModalEl?.querySelector<HTMLInputElement>(m.favEditPriceInput);

let currentType: string | null = null;
let selectedCode: string | null = null;

/**
 * Render รายการใน Manager
 * [Replaces He()]
 */
const renderManagerList = (): void => {
    if (!bodyEl || !itemTpl || !currentType) return;
    
    const favorites = favService.loadFavorites();
    const list: FavoriteItem[] = (favorites as any)[currentType] || [];
    bodyEl.innerHTML = "";
    selectedCode = null;
    if (editBtn) editBtn.disabled = true;
    if (delBtn) delBtn.disabled = true;

    if (list.length === 0) {
        bodyEl.innerHTML = `<p class="text-center muted">ไม่มีรายการ</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    list.forEach(item => {
        const itemEl = itemTpl.content.cloneNode(true) as DocumentFragment;
        const div = itemEl.firstElementChild as HTMLElement;
        div.dataset.code = item.code;
        div.querySelector(".fav-item-code")!.textContent = escapeHTML(item.code);
        div.querySelector(".fav-item-price")!.textContent = formatThaiNumber(item.price);
        fragment.appendChild(itemEl);
    });
    bodyEl.appendChild(fragment);
}; //

/**
 * แสดง Add Modal
 * [Replaces Je()]
 */
const showAddModal = (): void => {
    if (!addModalEl || !addCodeInput || !addPriceInput || !currentType) return;
    
    addCodeInput.value = "";
    addPriceInput.value = "";
    
    ui.showModal(m.favAddModal).then(result => {
        if (result === true) {
            const code = addCodeInput.value;
            const price = toNum(addPriceInput.value);
            if (favService.addFavorite(currentType as string, code, price)) {
                ui.showToast(`เพิ่ม '${code}' แล้ว`, "success");
                renderManagerList(); // Refresh list
            } else {
                ui.showToast(`เพิ่มล้มเหลว (ข้อมูลไม่ถูกต้อง)`, "error");
            }
        }
    });
}; //

/**
 * แสดง Edit Modal
 * [Replaces We()]
 */
const showEditModal = (): void => {
    if (!editModalEl || !editCodeInput || !editPriceInput || !selectedCode || !currentType) return;
    
    const favorites = favService.loadFavorites();
    const item = (favorites as any)[currentType]?.find((i: FavoriteItem) => i.code === selectedCode);
    if (!item) return;

    editCodeInput.value = item.code;
    editPriceInput.value = String(item.price); // Show raw number
    
    ui.showModal(m.favEditModal).then(result => {
        if (result === true) {
            const newCode = editCodeInput.value;
            const newPrice = toNum(editPriceInput.value);
            
            // If code changed, we need to delete old and add new
            if (selectedCode !== newCode) {
                favService.deleteFavorite(currentType as string, selectedCode as string);
            }
            if (favService.addFavorite(currentType as string, newCode, newPrice)) {
                ui.showToast(`อัปเดต '${newCode}' แล้ว`, "success");
                renderManagerList(); // Refresh list
            } else {
                 ui.showToast(`อัปเดตล้มเหลว`, "error");
            }
        }
    });
}; //

/**
 * ลบรายการ
 * [Replaces ze()]
 */
const deleteSelectedFavorite = (): void => {
    if (!selectedCode || !currentType) return;
    
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ '${selectedCode}'?`)) {
        if (favService.deleteFavorite(currentType, selectedCode)) {
            ui.showToast(`ลบ '${selectedCode}' แล้ว`, "success");
            renderManagerList(); // Refresh list
        }
    }
}; //

/**
 * แสดงและจัดการ Favorites Manager
 * [Replaces Qe()]
 * @param {string} itemType
 */
export const showFavoritesManagerModal = (itemType: string): void => {
    if (!managerModalEl || !titleEl || !bodyEl || !editBtn || !delBtn) {
        console.error("FavoritesManagerModal elements not found.");
        return;
    }
    
    if (!itemType || !(ITEM_NAMES as any)[itemType]) {
        console.error("Invalid itemType for FavoritesManager:", itemType);
        return;
    }
    currentType = itemType;
    
    // 1. Setup UI
    titleEl.textContent = `จัดการ Favorite (${(ITEM_NAMES as any)[itemType]})`;
    
    // 2. Render initial list
    renderManagerList();

    // 3. Add Listeners
    const onClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const action = target.closest<HTMLElement>("[data-act]")?.dataset.act;
        
        if (action) {
            switch (action) {
                case "add-new-fav":
                    showAddModal();
                    break;
                case "edit-selected-fav":
                    showEditModal();
                    break;
                case "del-selected-fav":
                    deleteSelectedFavorite();
                    break;
            }
            return;
        }

        // Handle selection
        const itemEl = target.closest<HTMLElement>(".fav-manager-item");
        if (itemEl) {
            bodyEl.querySelectorAll<HTMLElement>(".fav-manager-item").forEach(el => el.classList.remove("selected"));
            itemEl.classList.add("selected");
            selectedCode = itemEl.dataset.code || null;
            editBtn.disabled = !selectedCode;
            delBtn.disabled = !selectedCode;
        }
    };
    managerModalEl.addEventListener("click", onClick);
    
    // 4. Show modal
    ui.showModal(m.favManagerModal).then(() => {
        // 5. Cleanup
        managerModalEl.removeEventListener("click", onClick);
        currentType = null;
        selectedCode = null;
    });
}; //