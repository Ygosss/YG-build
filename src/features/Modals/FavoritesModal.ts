// src/features/Modals/FavoritesModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import * as favService from '../../lib/services/favorites.ts';
import { ITEM_NAMES } from '../../lib/state.ts';
import { toNum, formatThaiNumber, escapeHTML } from '../../lib/utils.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { Favorite, FavoriteItem } from '../../lib/services/favorites.ts'; // Import types

const modalEl = document.querySelector<HTMLElement>(m.favoritesModal);
const titleEl = modalEl?.querySelector<HTMLElement>(m.favoritesModalTitle);
const bodyEl = modalEl?.querySelector<HTMLElement>(m.favoritesModalBody);
const searchInput = modalEl?.querySelector<HTMLInputElement>(m.favSearchInput);
const itemTpl = document.querySelector<HTMLTemplateElement>(m.favSelectorItemTpl);

interface FavContext {
    roomId: string | null;
    itemId: string | null;
    targetInput: HTMLInputElement | null; // Input element (e.g., code)
    priceInput: HTMLInputElement | null; // Price input to update
    itemType: string | null;
}

let currentContext: FavContext = {
    roomId: null,
    itemId: null,
    targetInput: null,
    priceInput: null,
    itemType: null
};

/**
 * Render รายการ Favorites
 * [Replaces _e()]
 * @param {string} filterKeyword
 */
const renderFavList = (filterKeyword = ""): void => {
    if (!bodyEl || !itemTpl || !currentContext.itemType) return;

    const favorites: Favorite = favService.loadFavorites();
    const list: FavoriteItem[] = (favorites as any)[currentContext.itemType] || [];
    bodyEl.innerHTML = "";

    const fragment = document.createDocumentFragment();
    let count = 0;
    
    list.forEach(item => {
        if (filterKeyword && !item.code.toLowerCase().includes(filterKeyword)) {
            return;
        }
        
        const itemEl = itemTpl.content.cloneNode(true) as DocumentFragment;
        const button = itemEl.querySelector<HTMLButtonElement>("button");
        if (!button) return;

        button.dataset.code = item.code;
        button.dataset.price = String(item.price);
        button.querySelector(".fav-item-code")!.textContent = escapeHTML(item.code);
        button.querySelector(".fav-item-price")!.textContent = formatThaiNumber(item.price);
        
        fragment.appendChild(itemEl);
        count++;
    });

    if (count === 0) {
        bodyEl.innerHTML = `<p class="text-center muted">ไม่พบรายการ (ตรวจสอบคำค้นหา)</p>`;
    } else {
        bodyEl.appendChild(fragment);
    }
}; //

/**
 * Event Handler (Delegated)
 * [Replaces $e()]
 * @param {Event} e
 */
const onFavSelect = (e: Event): void => {
    const target = e.target as HTMLElement;
    const itemButton = target.closest<HTMLButtonElement>(".fav-selector-item");
    if (!itemButton) return;

    const { code, price } = itemButton.dataset;
    const { roomId, itemId, targetInput, priceInput, itemType } = currentContext;
    
    if (code && price && roomId && itemId && targetInput && priceInput && itemType) {
        // 1. Update target (code) input
        targetInput.value = code;
        store.dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId, itemId,
            field: targetInput.name,
            value: code
        }, { skipUndo: true }); // Skip undo, as we dispatch price next

        // 2. Update price input
        const priceNum = toNum(price);
        priceInput.value = formatThaiNumber(priceNum); // Format for UI
        store.dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId, itemId,
            field: priceInput.name,
            value: priceNum // Send number to state
        });
        
        ui.showToast(`ใช้ ${code} แล้ว`, "success");
    }
    
    (modalEl as any).closeModal({ cancelled: true });
}; //

/**
 * แสดงและจัดการ Modal เลือก Favorite
 * [Replaces qe() and Le()]
 * @param {HTMLInputElement} targetInput - The input element that triggered this
 * @param {string} roomId
 * @param {string} itemId
 */
export const showFavoritesModal = (targetInput: HTMLInputElement, roomId: string, itemId: string): void => {
    if (!targetInput || !modalEl || !titleEl || !searchInput || !bodyEl) {
         console.error("FavoritesModal elements not found.");
         return;
    }
    
    const itemType = targetInput.dataset.favoriteType;
    if (!itemType || !(ITEM_NAMES as any)[itemType]) {
        console.error("Invalid favorite type:", itemType);
        return;
    }

    const priceTargetName = targetInput.dataset.priceTarget;
    if (!priceTargetName) {
        console.error("No data-price-target found on favorite input.");
        return;
    }
    
    const priceInput = document.querySelector<HTMLInputElement>(`[name="${priceTargetName}"]`);
    if (!priceInput) {
        console.error(`Price input target "${priceTargetName}" not found.`);
        return;
    }

    // 1. Set Context
    currentContext = {
        roomId,
        itemId,
        targetInput,
        itemType,
        priceInput
    };

    // 2. Setup Modal UI
    titleEl.textContent = `เลือก Favorite (${(ITEM_NAMES as any)[itemType]})`;
    searchInput.value = "";
    
    // 3. Render initial list
    renderFavList();
    
    // 4. Add listeners
    const onSearch = () => renderFavList(searchInput.value.toLowerCase());
    searchInput.addEventListener("input", onSearch);
    bodyEl.addEventListener("click", onFavSelect);

    // 5. Show modal
    ui.showModal(m.favoritesModal).then(() => {
        // 6. Cleanup
        searchInput.removeEventListener("input", onSearch);
        bodyEl.removeEventListener("click", onFavSelect);
        currentContext = { roomId: null, itemId: null, targetInput: null, priceInput: null, itemType: null };
    });
}; //