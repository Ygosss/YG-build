// src/features/Items/Set/set.calculator.ts

import { toNum } from '../../../lib/utils.ts';
import { PRICING_CONFIG } from '../../../lib/state.ts';
import { SetItem, PriceResult } from '../../../lib/types.ts';

// Interface สำหรับ options ภายใน
interface ComponentPriceOptions {
    width: number;
    height: number;
    price_per_m: number;
    style: string;
}

// [Original: A.stylePlus]
const getStyleSurcharge = (style: string): number => PRICING_CONFIG.style_surcharge[style] ?? 0; //

// [Original: A.heightPlus]
const getHeightSurcharge = (height: number): number => {
    const sortedThresholds = [...PRICING_CONFIG.height].sort((a, b) => b.threshold - a.threshold);
    for (const rule of sortedThresholds) {
        if (height > rule.threshold) {
            return rule.add_per_m;
        }
    }
    return 0;
}; //

// [Original: A.fabricYardage]
export const calculateFabricYardage = (style: string | undefined, width: number | undefined): number => {
    const widthNum = toNum(width);
    if (widthNum <= 0) return 0;

    let multiplier = 0;
    switch (style) {
        case "ลอน":
        case "ตาไก่":
        case "จีบ":
        case "หลุยส์":
            multiplier = 2.5;
            break;
        case "ม่านพับ":
            multiplier = 1.2;
            break;
        case "ม่านแป๊บ":
            multiplier = 0; // ม่านแป๊บอาจมีวิธีคิดที่ต่างออกไป (ตามโค้ดเดิม)
            break;
    }
    return multiplier > 0 ? widthNum * multiplier * 1.09361 : 0; // 1.09361 = m to yard
}; //

// [Original: A.calculateGrommets]
export const calculateGrommets = (item: SetItem): number => {
    const width = toNum(item.width_m);
    if (width <= 0 || item.style !== "ตาไก่") return 0;
    
    const fabricWidth = width * 2.5;
    let grommets = Math.ceil(fabricWidth * 100 / 12);
    if (grommets % 2 !== 0) grommets++;
    grommets = Math.max(grommets, Math.ceil(width * 4) * 2);
    return grommets;
}; //

// [Original: A._calculateComponentPrice]
const calculateComponentPrice = (options: ComponentPriceOptions): number => {
    const width = toNum(options.width);
    const height = toNum(options.height);
    const pricePerM = toNum(options.price_per_m);

    if (width <= 0 || height <= 0 || pricePerM <= 0) return 0;

    if (options.style === "ม่านแป๊บ") {
        const price = width * pricePerM;
        return Math.round(price / 10) * 10;
    }

    const stylePlus = getStyleSurcharge(options.style);
    const heightPlus = getHeightSurcharge(height);
    
    let multiplier = 0;
    switch (options.style) {
        case "ลอน":
        case "ตาไก่":
        case "จีบ":
        case "หลุยส์":
            multiplier = 2.5;
            break;
        case "ม่านพับ":
            multiplier = 1.2;
            break;
    }

    if (multiplier === 0) return 0;
    
    const basePrice = pricePerM;
    const surcharge = stylePlus + heightPlus;
    const total = (basePrice + surcharge) * width * multiplier;
    
    return Math.round(total / 10) * 10;
}; //

// [Original: A.calculateSetPrice]
export const calculateSetPrice = (item: SetItem): PriceResult => {
    if (!item || item.is_suspended) return { total: 0, opaque: 0, sheer: 0, louis: 0 };

    const variant = item.fabric_variant || "ทึบ";
    const style = item.style || "ลอน";
    const width = toNum(item.width_m);
    const height = toNum(item.height_m);
    
    let opaquePrice = 0;
    let sheerPrice = 0;
    let louisPrice = 0;

    if (style === "หลุยส์") {
        const louisPricePerM = toNum(item.louis_price_per_m);
        if (width > 0 && louisPricePerM > 0) {
            louisPrice = louisPricePerM * width;
            louisPrice = Math.round(louisPrice / 10) * 10;
        }
        if (variant.includes("ทึบ")) {
            opaquePrice = calculateComponentPrice({ style, width, height, price_per_m: toNum(item.price_per_m_raw) });
        }
        if (variant.includes("โปร่ง")) {
            sheerPrice = calculateComponentPrice({ style, width, height, price_per_m: toNum(item.sheer_price_per_m) });
        }
    } else {
        if (variant.includes("ทึบ")) {
            opaquePrice = calculateComponentPrice({ style, width, height, price_per_m: toNum(item.price_per_m_raw) });
        }
        if (variant.includes("โปร่ง")) {
            sheerPrice = calculateComponentPrice({ style, width, height, price_per_m: toNum(item.sheer_price_per_m) });
        }
    }

    const subTotal = opaquePrice + sheerPrice + louisPrice;
    // Apply minimum price logic
    let total = (subTotal > 0 && subTotal < 1000) ? 1000 : subTotal;

    return { total, opaque: opaquePrice, sheer: sheerPrice, louis: louisPrice };
}; //