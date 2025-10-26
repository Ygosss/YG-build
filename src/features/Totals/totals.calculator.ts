// src/features/Totals/totals.calculator.ts

import { ITEM_TYPES } from '../../lib/state.ts';
import { calculateSetPrice } from '../Items/Set/set.calculator.ts';
import { calculateWallpaperPrice } from '../Items/Wallpaper/wallpaper.calculator.ts';
import { calculateAreaBasedPrice } from '../Items/AreaBased/areabased.calculator.ts';
import { AppState, Item, SetItem, WallpaperItem, AreaBasedItem } from '../../lib/types.ts';

/**
 * คำนวณยอดรวมของทุกรายการใน State
 * [Replaces at()]
 * @param {object} state - The full application state
 * @returns {number} The original total (before discount)
 */
export const calculateAppTotal = (state: AppState): number => {
    if (!state || !state.rooms) return 0;

    return state.rooms.reduce((roomTotal, room) => {
        if (room.is_suspended) {
            return roomTotal;
        }

        const itemsTotal = room.items?.reduce((itemTotal, item: Item) => {
            if (item.is_suspended) {
                return itemTotal;
            }
            
            switch (item.type) {
                case "set":
                    return itemTotal + calculateSetPrice(item as SetItem).total;
                case "wallpaper":
                    return itemTotal + calculateWallpaperPrice(item as WallpaperItem).total;
                default:
                    // Check if it's any other area-based type
                    if (item.type && ITEM_TYPES[item.type]?.templateId === "#areaBasedTpl") {
                        return itemTotal + calculateAreaBasedPrice(item as AreaBasedItem).total;
                    }
                    return itemTotal;
            }
        }, 0) || 0;

        return roomTotal + itemsTotal;
    }, 0);
}; //