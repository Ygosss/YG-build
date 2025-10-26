// src/lib/state.ts

import { AppState } from './types.ts';

/**
 * =================================================================
 * CONFIGURATION CONSTANTS
 * =================================================================
 */

export const APP_VERSION = "vite-refactor/6.1.0";
export const APP_STORAGE_KEY = "marnthara.input.v6.1";
export const FAVORITES_STORAGE_KEY = "marnthara.favorites.v4";
export const WEBHOOK_URL = "https://your-make-webhook-url.com/your-unique-path";

export const SQYD_CONVERSION_RATE = 1.19599;

export const SHOP_CONFIG = {
    name: "ร้านผ้าม่าน ขวัญฤดี",
    address: "เลขที่ 257 ม.6 ต.หนองโพรง อ.ศรีมหาโพธิ จ.ปราจีนบุรี 25140",
    phone: "โทร 087-985-3832 (ศิริขวัญ นาคะเสถียร)",
    taxId: "1250100194164",
    baseVatRate: 0.07,
    pdf: {
        paymentTerms: "ชำระมัดจำ 50%",
        priceValidity: "30 วัน",
        notes: [
            "ราคานี้รวมค่าติดตั้งแล้ว",
            "ชำระมัดจำ 50% เพื่อยืนยืนการสั่งผลิตสินค้า",
            "ใบเสนอราคานี้มีอายุ 30 วัน นับจากวันที่เสนอราคา"
        ]
    }
};

export const PRICING_CONFIG = {
    fabric: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000],
    sheer: [1000, 1100, 1200, 1300, 1400, 1500],
    louis: [2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500],
    style_surcharge: { "ลอน": 200, "ตาไก่": 0, "จีบ": 0, "ม่านพับ": 0, "ม่านแป๊บ": 0, "หลุยส์": 0 } as { [key: string]: number },
    height: [
        { threshold: 3.2, add_per_m: 300 },
        { threshold: 2.8, add_per_m: 200 },
        { threshold: 2.5, add_per_m: 100 }
    ]
};

export const WALLPAPER_CONFIG = {
    ROLL_WIDTH_M: 0.53,
    STRIPS_PER_ROLL_UNDER_2_5M: 3
};

interface ItemTypeConfig {
    templateId: string;
    name: string;
}

export const ITEM_TYPES: { [key: string]: ItemTypeConfig } = {
    set: { templateId: "#setTpl", name: "ผ้าม่าน" },
    wallpaper: { templateId: "#wallpaperTpl", name: "วอลล์เปเปอร์" },
    wooden_blind: { templateId: "#areaBasedTpl", name: "มู่ลี่ไม้" },
    roller_blind: { templateId: "#areaBasedTpl", name: "ม่านม้วน" },
    vertical_blind: { templateId: "#areaBasedTpl", name: "ม่านปรับแสง" },
    partition: { templateId: "#areaBasedTpl", name: "ฉากกั้นห้อง" },
    pleated_screen: { templateId: "#areaBasedTpl", name: "มุ้งจีบ" },
    aluminum_blind: { templateId: "#areaBasedTpl", name: "มู่ลี่อลูมิเนียม" }
};

export const ITEM_NAMES: { [key: string]: string } = {
    ...Object.entries(ITEM_TYPES).reduce((acc, [key, val]) => {
        acc[key] = val.name;
        return acc;
    }, {} as { [key: string]: string }),
    set_louis: "ม่านหลุยส์"
};

export const INITIAL_FAVORITES: { [key: string]: { code: string; price: number }[] } = {
    fabric: [],
    sheer: [],
    wallpaper: [],
    wooden_blind: [],
    roller_blind: [],
    vertical_blind: [],
    partition: [],
    pleated_screen: [],
    aluminum_blind: []
};

/**
 * =================================================================
 * INITIAL APPLICATION STATE
 * =================================================================
 */
export const initialState: AppState = {
    app_version: APP_VERSION,
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_card_open: true,
    is_locked: false,
    discount: {
        type: "amount", // 'amount' or 'percent'
        value: 0
    },
    rooms: [
        // Example Room Structure
        // {
        //     id: "room-123",
        //     room_name: "ห้องนอน",
        //     is_suspended: false,
        //     is_open: true,
        //     room_defaults: {},
        //     items: []
        // }
    ]
};