// src/lib/services/storage.ts

import { APP_STORAGE_KEY } from '../state.ts';
import { AppState } from '../types.ts';

/**
 * บันทึก State Object ลง localStorage
 * [Based on z()]
 * @param {object} state
 */
export const saveState = (state: AppState): void => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(APP_STORAGE_KEY, serializedState);
    } catch (err) {
        console.error("Failed to save data to localStorage:", err);
    }
}; //

/**
 * โหลด State Object จาก localStorage
 * [Based on io()]
 * @returns {object | null}
 */
export const loadState = (): AppState | null => {
    try {
        const serializedState = localStorage.getItem(APP_STORAGE_KEY);
        if (serializedState === null || serializedState === "{}") {
            return null;
        }
        const state: AppState = JSON.parse(serializedState);
        
        // Basic validation
        if (state && Array.isArray(state.rooms)) {
            return state;
        }
        return null;
    } catch (err) {
        console.error("Failed to load or parse data from localStorage:", err);
        localStorage.removeItem(APP_STORAGE_KEY);
        return null;
    }
}; //