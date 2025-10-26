// src/lib/services/favorites.ts

import { FAVORITES_STORAGE_KEY, INITIAL_FAVORITES } from '../state.ts';
import { toNum } from '../utils.ts';

// --- [NEW] Type Definitions ---
export interface FavoriteItem {
    code: string;
    price: number;
}

export interface Favorite {
    fabric: FavoriteItem[];
    sheer: FavoriteItem[];
    wallpaper: FavoriteItem[];
    wooden_blind: FavoriteItem[];
    roller_blind: FavoriteItem[];
    vertical_blind: FavoriteItem[];
    partition: FavoriteItem[];
    pleated_screen: FavoriteItem[];
    aluminum_blind: FavoriteItem[];
    [key: string]: FavoriteItem[]; // Index signature
}

/**
 * โหลด Favorites จาก localStorage
 * [Original: de]
 * @returns {Favorite}
 */
export const loadFavorites = (): Favorite => {
    try {
        const favs = localStorage.getItem(FAVORITES_STORAGE_KEY);
        // Merge with initial state to ensure all keys exist
        return favs ? { ...INITIAL_FAVORITES, ...JSON.parse(favs) } : { ...INITIAL_FAVORITES };
    } catch (e) {
        console.error("Failed to parse favorites from localStorage", e);
        return { ...INITIAL_FAVORITES };
    }
}; //

/**
 * บันทึก Favorites ลง localStorage
 * [Original: Ie]
 * @param {Favorite} favoritesState
 */
export const saveFavorites = (favoritesState: Favorite): void => {
    try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesState));
    } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
    }
}; //

/**
 * ตรวจสอบว่า object เป็น Favorite structure ที่ถูกต้องหรือไม่
 * [Original: Ze]
 * @param {any} data
 * @returns {boolean}
 */
export const isValidFavorites = (data: any): boolean => {
    if (!data || typeof data !== "object") return false;
    // Check if at least one key matches the INITIAL_FAVORITES structure
    return Object.keys(INITIAL_FAVORITES).some(key => 
        Object.hasOwnProperty.call(data, key) && Array.isArray(data[key])
    );
}; //

/**
 * นำเข้าและเขียนทับ Favorites (Import/Overwrite)
 * [Original: Ue]
 * @param {Favorite} data
 * @returns {boolean}
 */
export const importFavorites = (data: Favorite): boolean => {
    if (!isValidFavorites(data)) {
        console.error("Invalid favorites data for import.");
        return false;
    }
    // Ensure all keys from INITIAL_FAVORITES are present
    const newState = { ...INITIAL_FAVORITES };
    for (const key of Object.keys(INITIAL_FAVORITES)) {
        if (data[key]) {
            newState[key] = data[key];
        }
    }
    saveFavorites(newState);
    return true;
}; //

/**
 * รวม Favorites (Merge)
 * [Original: Je]
 * @param {Favorite} newData
 * @returns {number} Count of merged/updated items
 */
export const mergeFavorites = (newData: Favorite): number => {
    if (!isValidFavorites(newData)) return 0;
    
    const currentFavorites = loadFavorites();
    let count = 0;
    
    Object.keys(newData).forEach(key => {
        if (Object.hasOwnProperty.call(currentFavorites, key) && Array.isArray(newData[key])) {
            newData[key].forEach((newItem: FavoriteItem) => {
                if (newItem.code && typeof newItem.price === 'number') {
                    const existingIndex = currentFavorites[key].findIndex(i => i.code === newItem.code);
                    if (existingIndex > -1) {
                        // Update existing
                        currentFavorites[key][existingIndex] = newItem;
                    } else {
                        // Add new
                        currentFavorites[key].push(newItem);
                    }
                    count++;
                }
            });
            // Sort list after merging
            currentFavorites[key].sort((a, b) => a.code.localeCompare(b.code));
        }
    });
    
    saveFavorites(currentFavorites);
    return count;
}; //

/**
 * เพิ่ม/อัปเดต Favorite
 * [Original: qe]
 * @param {string} type
 * @param {string} code
 * @param {number} price
 * @returns {boolean}
 */
export const addFavorite = (type: string, code: string, price: number): boolean => {
    const favorites = loadFavorites();
    const cleanCode = code?.trim();
    
    if (!cleanCode || !type || isNaN(price) || price < 0) {
        console.error(`Attempted to add favorite with invalid data: ${type}, ${cleanCode}, ${price}`);
        return false;
    }
    if (!Object.hasOwnProperty.call(INITIAL_FAVORITES, type)) {
        console.error(`Attempted to add favorite to an invalid type: ${type}`);
        return false;
    }
    if (!favorites[type]) {
        favorites[type] = [];
    }
    const existing = favorites[type].find(i => i.code === cleanCode);
    if (existing) {
        existing.price = price;
    } else {
        favorites[type].push({ code: cleanCode, price: price });
    }
    favorites[type].sort((a, b) => a.code.localeCompare(b.code));
    saveFavorites(favorites);
    return true;
}; //

/**
 * ลบ Favorite
 * [Original: Ye]
 * @param {string} type
 * @param {string} code
 * @returns {boolean}
 */
export const deleteFavorite = (type: string, code: string): boolean => {
    const favorites = loadFavorites();
    const cleanCode = code?.trim();
    if (!favorites[type] || !cleanCode) {
        return false;
    }
    const index = favorites[type].findIndex(item => item.code === cleanCode);
    if (index > -1) {
        favorites[type].splice(index, 1);
        saveFavorites(favorites);
        return true;
    }
    return false;
}; //