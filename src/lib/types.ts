// src/lib/types.ts

/**
 * =================================================================
 * TYPE DEFINITIONS
 * (ศูนย์รวม Interface และ Type หลักของแอปพลิเคชัน)
 * =================================================================
 */

// --- State & Core Structures ---

export interface Discount {
    type: 'amount' | 'percent';
    value: number;
}

export interface AppState {
    app_version: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_card_open: boolean;
    is_locked: boolean;
    discount: Discount;
    rooms: Room[];
}

export interface Room {
    id: string;
    room_name: string;
    is_suspended: boolean;
    is_open: boolean;
    room_defaults: Partial<HardwareSettings>; // อ้างอิงจาก RoomDefaultsModal
    items: Item[];
}

// --- Item Types ---

// Base properties for all items (including placeholder)
export interface BaseItem {
    id: string;
    roomId: string;
    type: string | null; // 'set', 'wallpaper', 'wooden_blind', etc.
    is_suspended: boolean;
    width_m?: number;
    height_m?: number;
    notes?: string;
    code?: string;
}

// ผ้าม่าน
export interface SetItem extends BaseItem, HardwareSettings {
    type: 'set';
    width_m: number;
    height_m: number;
    style?: string; // "ลอน", "ตาไก่", "จีบ"
    fabric_variant?: string; // "ทึบ", "โปร่ง", "ทึบ+โปร่ง"
    price_per_m_raw?: number;
    sheer_price_per_m?: number;
    louis_price_per_m?: number;
    fabric_code?: string;
    sheer_fabric_code?: string;
    opening_style?: string;
    adjustment_side?: string;
}

// วอลเปเปอร์
export interface WallpaperItem extends BaseItem {
    type: 'wallpaper';
    height_m: number;
    price_per_roll?: number;
    install_cost_per_roll?: number | string; // '0' or 300
    widths?: number[];
}

// สินค้าคิดราคาตามพื้นที่ (มู่ลี่, ม่านม้วน ฯลฯ)
export interface AreaBasedItem extends BaseItem {
    type: 'wooden_blind' | 'roller_blind' | 'vertical_blind' | 'partition' | 'pleated_screen' | 'aluminum_blind';
    width_m: number;
    height_m: number;
    price_sqyd?: number;
}

// Union of all possible item types
export type Item = SetItem | WallpaperItem | AreaBasedItem | BaseItem;

// --- Other Interfaces ---

// อุปกรณ์ (จาก RoomDefaults และ SetItem)
export interface HardwareSettings {
    track_color?: string;
    bracket_color?: string;
    finial_color?: string;
    grommet_color?: string;
    louis_valance?: string;
    louis_tassels?: string;
}

// สำหรับ Store และ Dispatch
export type ActionPayload = { [key: string]: any };
export type DispatchOptions = { skipUndo?: boolean, skipSave?: boolean };
export type Dispatch = (type: string, payload?: ActionPayload, options?: DispatchOptions) => void;

// สำหรับ Calculate Functions
export interface PriceResult {
    total: number;
    [key: string]: number; // e.g., sqm, sqyd, material, install, etc.
}