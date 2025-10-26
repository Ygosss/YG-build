// src/lib/store.ts

import { initialState } from './state.ts';
import * as storage from './services/storage.ts';
import * as ui from './ui.ts';
import { ActionTypes, createId, createNewRoom, createNewItem } from './actions.ts';
import { toNum } from './utils.ts';
import { AppState, Room, Item, ActionPayload, DispatchOptions, SetItem, WallpaperItem } from './types.ts'; // Import types

// Global state variables
let state: AppState = { ...initialState };
let subscribers: ((state: AppState) => void)[] = [];
let undoStack: AppState[] = [];
const MAX_UNDO_STACK = 10;

// --- Private Functions ---
const notify = (): void => {
    // console.log("Notifying subscribers...", state);
    subscribers.forEach(callback => callback(state));
};

/**
 * =================================================================
 * THE REDUCER
 * (หัวใจหลักของ Logic การเปลี่ยนแปลง State ทั้งหมด)
 * =================================================================
 */
const reducer = (currentState: AppState, actionType: string, payload: ActionPayload): AppState => {
    // console.log(`Dispatching: ${actionType}`, payload);

    switch (actionType) {
        
        // --- App/Customer Actions ---
        
        case ActionTypes.APP_LOAD_STATE:
            // เมื่อโหลด State, ต้องมั่นใจว่าโครงสร้างตรงกับ initialState (เผื่อมีการเพิ่ม field ใหม่)
            return { ...initialState, ...payload }; 

        case ActionTypes.CUSTOMER_UPDATE_FIELD:
            return {
                ...currentState,
                [payload.field]: payload.value
            };

        case ActionTypes.DISCOUNT_SET:
            return {
                ...currentState,
                discount: {
                    type: payload.type,
                    value: toNum(payload.value)
                }
            };
            
        case ActionTypes.APP_SET_LOCK:
            return {
                ...currentState,
                is_locked: payload.locked
            };

        // --- Room Actions ---
        
        case ActionTypes.ROOM_ADD:
            return {
                ...currentState,
                rooms: [...currentState.rooms, createNewRoom()]
            };
            
        case ActionTypes.ROOM_DELETE:
            return {
                ...currentState,
                rooms: currentState.rooms.filter(room => room.id !== payload.roomId)
            };

        case ActionTypes.ROOM_UPDATE_NAME:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, [payload.field]: payload.value }
                        : room
                )
            };
            
        case ActionTypes.ROOM_TOGGLE_SUSPEND:
             return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, is_suspended: !room.is_suspended }
                        : room
                )
            };
            
        case ActionTypes.ROOM_TOGGLE_OPEN:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, is_open: !room.is_open }
                        : room
                )
            };

        case ActionTypes.ROOM_SET_DEFAULTS:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, room_defaults: payload.defaults }
                        : room
                )
            };
            
        case ActionTypes.ROOM_APPLY_HARDWARE:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? {
                            ...room,
                            items: room.items.map(item =>
                                (item.type === 'set' && !item.is_suspended)
                                    ? { ...item, ...payload.hardwareData }
                                    : item
                            )
                          }
                        : room
                )
            };

        // --- Item Actions ---

        case ActionTypes.ITEM_ADD:
            const newPlaceholder = createNewItem(payload.roomId);
            // ถ้าส่ง dimension มาด้วย (จาก Modal)
            if (payload.width_m && payload.height_m) {
                newPlaceholder.width_m = payload.width_m;
                newPlaceholder.height_m = payload.height_m;
            }
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: [...room.items, newPlaceholder] }
                        : room
                )
            };

        case ActionTypes.ITEM_DELETE:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.filter(item => item.id !== payload.itemId) }
                        : room
                )
            };
            
        case ActionTypes.ITEM_DUPLICATE:
            let itemToDuplicate: Item | undefined;
            const roomSource = currentState.rooms.find(r => r.id === payload.roomId);
            if (roomSource) {
                itemToDuplicate = roomSource.items.find(i => i.id === payload.itemId);
            }
            
            if (!itemToDuplicate) return currentState; // ไม่พบ Item
            
            const duplicatedItem = {
                ...itemToDuplicate,
                id: createId("item"),
                is_suspended: false // รายการที่คัดลอกมาให้ Active เสมอ
            };
            
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: [...room.items, duplicatedItem] }
                        : room
                )
            };
            
        case ActionTypes.ITEM_SET_TYPE:
            const roomTarget = currentState.rooms.find(r => r.id === payload.roomId);
            const placeholder = roomTarget?.items.find(i => i.id === payload.itemId);
            if (!roomTarget || !placeholder) return currentState;
            
            // ใช้ค่าเริ่มต้นจากห้อง (Room Defaults)
            const defaults = roomTarget.room_defaults || {};
            
            const newItem: Item = {
                ...placeholder,
                type: payload.itemType,
                // Apply defaults
                ...(payload.itemType === 'set' && {
                    style: defaults.style || "ลอน",
                    fabric_variant: defaults.fabric_variant || "ทึบ",
                    opening_style: defaults.opening_style || "แยกกลาง",
                    adjustment_side: defaults.adjustment_side || "ปรับขวา",
                    track_color: defaults.track_color || "ขาว",
                    bracket_color: defaults.bracket_color || "ขาว",
                    finial_color: defaults.finial_color || "ขาว",
                    grommet_color: defaults.grommet_color || "เงิน",
                    louis_valance: defaults.louis_valance || "กล่องหลุยส์",
                    louis_tassels: defaults.louis_tassels || "พู่หลุยส์",
                }),
                // (เพิ่ม default สำหรับ type อื่นๆ ถ้ามี)
            };

            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.map(i => (i.id === payload.itemId) ? newItem : i) }
                        : room
                )
            };

        case ActionTypes.ITEM_TOGGLE_SUSPEND:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.map(item =>
                                item.id === payload.itemId
                                    ? { ...item, is_suspended: !item.is_suspended }
                                    : item
                            )}
                        : room
                )
            };
            
        case ActionTypes.ITEM_UPDATE_FIELD:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.map(item =>
                                item.id === payload.itemId
                                    ? { ...item, [payload.field]: payload.value }
                                    : item
                            )}
                        : room
                )
            };
            
        // --- Wallpaper Actions ---
        
        case ActionTypes.ITEM_ADD_WALL:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.map(item => {
                                if (item.id === payload.itemId && item.type === 'wallpaper') {
                                    const wallItem = item as WallpaperItem;
                                    const widths = [...(wallItem.widths || []), 0]; // Add new wall width
                                    return { ...item, widths: widths };
                                }
                                return item;
                            })}
                        : room
                )
            };
            
        case ActionTypes.ITEM_DELETE_WALL:
            return {
                ...currentState,
                rooms: currentState.rooms.map(room =>
                    room.id === payload.roomId
                        ? { ...room, items: room.items.map(item => {
                                if (item.id === payload.itemId && item.type === 'wallpaper') {
                                    const wallItem = item as WallpaperItem;
                                    const widths = (wallItem.widths || []).filter((_, i) => i !== payload.index);
                                    return { ...item, widths: widths };
                                }
                                return item;
                            })}
                        : room
                )
            };

        default:
            console.warn(`Unknown action type: ${actionType}`);
            return currentState;
    }
};

/**
 * =================================================================
 * PUBLIC API (Store Interface)
 * =================================================================
 */

export const getState = (): AppState => state;

export const subscribe = (callback: (state: AppState) => void): (() => void) => {
    subscribers.push(callback);
    return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
    };
};

export const dispatch = (actionType: string, payload: ActionPayload = {}, options: DispatchOptions = {}): void => {
    if (!options.skipUndo) {
        pushUndo(state);
    }
    
    const newState = reducer(state, actionType, payload);
    
    if (newState !== state) {
        state = newState;
        notify();
        if (!options.skipSave) {
            storage.saveState(state); 
        }
    }
};

export const loadInitialState = (): void => {
    const loadedState = storage.loadState();
    if (loadedState) {
        // ใช้ dispatch เพื่อโหลด state เพื่อให้ subscribers ทำงาน
        dispatch(ActionTypes.APP_LOAD_STATE, loadedState, { skipUndo: true, skipSave: true });
    } else {
        state = { ...initialState };
        notify(); // Notify subscribers with initial state
    }
};

/**
 * บันทึก State ปัจจุบัน (สำหรับ beforeunload)
 */
export const saveCurrentState = (): void => {
    storage.saveState(state);
};

// --- Undo Manager ---

export const pushUndo = (stateToSave: AppState): void => {
    try {
        // Deep copy state for undo history
        const stateClone: AppState = JSON.parse(JSON.stringify(stateToSave));
        undoStack.push(stateClone);
        if (undoStack.length > MAX_UNDO_STACK) {
            undoStack.shift();
        }
        ui.updateUndoButton(true); // อัปเดต UI (true = hasUndo)
    } catch (err) {
        console.error("Failed to clone state for undo history:", err);
    }
};

export const popUndo = (): void => {
    if (undoStack.length === 0) return;
    
    const prevState = undoStack.pop();
    if (prevState) {
        // ไม่ต้อง pushUndo (skipUndo = true)
        // ต้อง save state ที่ย้อนกลับมา (skipSave = false)
        dispatch(ActionTypes.APP_LOAD_STATE, prevState, { skipUndo: true });
    }
    ui.updateUndoButton(undoStack.length > 0);
};

export const hasUndo = (): boolean => undoStack.length > 0;