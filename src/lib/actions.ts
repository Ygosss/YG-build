// src/lib/actions.ts

import { Room, Item, BaseItem } from './types.ts';

/**
 * =================================================================
 * ACTION TYPES
 * (นิยาม "สัญญา" การสื่อสารทั้งหมด)
 * =================================================================
 */
export const ActionTypes = {
    // App/Customer
    APP_LOAD_STATE: 'APP/LOAD_STATE',
    CUSTOMER_UPDATE_FIELD: 'CUSTOMER/UPDATE_FIELD',
    DISCOUNT_SET: 'DISCOUNT/SET',
    APP_SET_LOCK: 'APP/SET_LOCK',
    
    // Rooms
    ROOM_ADD: 'ROOM/ADD',
    ROOM_DELETE: 'ROOM/DELETE',
    ROOM_UPDATE_NAME: 'ROOM/UPDATE_NAME',
    ROOM_TOGGLE_SUSPEND: 'ROOM/TOGGLE_SUSPEND',
    ROOM_TOGGLE_OPEN: 'ROOM/TOGGLE_OPEN',
    ROOM_SET_DEFAULTS: 'ROOM/SET_DEFAULTS',
    ROOM_APPLY_HARDWARE: 'ROOM/APPLY_HARDWARE',
    
    // Items
    ITEM_ADD: 'ITEM/ADD',
    ITEM_DELETE: 'ITEM/DELETE',
    ITEM_DUPLICATE: 'ITEM/DUPLICATE',
    ITEM_UPDATE_FIELD: 'ITEM/UPDATE_FIELD',
    ITEM_TOGGLE_SUSPEND: 'ITEM/TOGGLE_SUSPEND',
    ITEM_SET_TYPE: 'ITEM/SET_TYPE',
    ITEM_ADD_WALL: 'ITEM/ADD_WALL', // For Wallpaper
    ITEM_DELETE_WALL: 'ITEM/DELETE_WALL' // For Wallpaper
};

/**
 * =================================================================
 * HELPER FUNCTIONS (สำหรับ Reducer)
 * =================================================================
 */

// [Original: Et]
export const createId = (prefix = "item"): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// [Original: me (logic)]
export const createNewRoom = (): Room => ({
    id: createId("room"),
    room_name: "ห้องใหม่",
    is_suspended: false,
    is_open: true,
    room_defaults: {},
    items: []
});

// [Original: Se (logic)]
// สร้าง Item ที่เป็น Placeholder
export const createNewItem = (roomId: string): BaseItem => ({
    id: createId("item"),
    roomId: roomId,
    type: null, // Placeholder type
    width_m: 0,
    height_m: 0,
    is_suspended: false
});