// src/features/Items/ItemRegistry.ts

import { ITEM_TYPES } from '../../lib/state.ts';
import { createSetItemElement } from './Set/SetItem.ts';
import { createWallpaperElement } from './Wallpaper/WallpaperItem.ts';
import { createAreaBasedElement } from './AreaBased/AreaBasedItem.ts';
import { createPlaceholderElement } from './Placeholder/PlaceholderItem.ts';
import { Item, Dispatch, SetItem, WallpaperItem, AreaBasedItem, BaseItem } from '../../lib/types.ts';
import { m } from '../../lib/selectors.ts'; // Import selectors

/**
 * รับ Item Data จาก State และคืนค่า DOM Element ที่สร้างเสร็จแล้ว
 * @param {object} itemData - ข้อมูล Item (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createItemElement = (itemData: Item, dispatch: Dispatch): HTMLElement | null => {
    if (!itemData || !itemData.type) {
        // ถ้า Item ไม่มี type, แสดงเป็น Placeholder
        return createPlaceholderElement(itemData as BaseItem, dispatch);
    }
    
    const itemConfig = ITEM_TYPES[itemData.type];
    
    if (!itemConfig) {
        console.warn(`No config found for item type: ${itemData.type}. Rendering placeholder.`);
        return createPlaceholderElement(itemData as BaseItem, dispatch);
    }

    let element: HTMLElement | null;

    // เลือก View Function โดยอิงจาก templateId ใน Config
    switch (itemConfig.templateId) {
        case m.setTpl:
            element = createSetItemElement(itemData as SetItem, dispatch);
            break;
        case m.wallpaperTpl:
            element = createWallpaperElement(itemData as WallpaperItem, dispatch);
            break;
        case m.areaBasedTpl:
            element = createAreaBasedElement(itemData as AreaBasedItem, dispatch);
            break;
        default:
            console.error(`Unknown templateId: ${itemConfig.templateId} for type: ${itemData.type}`);
            return null;
    }
    
    // ตั้งค่า common attributes
    if (element) {
        element.id = itemData.id;
        element.dataset.roomId = itemData.roomId;
        const titleEl = element.querySelector<HTMLElement>(m.itemTitle);
        if (titleEl) {
            titleEl.textContent = itemConfig.name || itemData.type;
        }
    }
    
    return element;
};