// src/features/Items/Wallpaper/wallpaper.calculator.ts

import { toNum } from '../../../lib/utils.ts';
import { WALLPAPER_CONFIG } from '../../../lib/state.ts';
import { WallpaperItem, PriceResult } from '../../../lib/types.ts';

// [Original: A.wallpaperRolls]
export const calculateWallpaperRolls = (width: number, height: number): number => {
    if (width <= 0 || height <= 0) return 0;
    
    const { ROLL_WIDTH_M, STRIPS_PER_ROLL_UNDER_2_5M } = WALLPAPER_CONFIG;
    const stripsNeeded = Math.ceil(width / ROLL_WIDTH_M);
    
    let stripsPerRoll;
    if (height <= 2.5) {
        stripsPerRoll = STRIPS_PER_ROLL_UNDER_2_5M;
    } else if (height <= 3.3) {
        stripsPerRoll = 2;
    } else {
        stripsPerRoll = 1;
    }
    
    return Math.ceil(stripsNeeded / stripsPerRoll);
}; //

// [Original: A.calculateWallpaperPrice]
export const calculateWallpaperPrice = (item: WallpaperItem): PriceResult => {
    if (!item || item.is_suspended) {
        return { total: 0, material: 0, install: 0, rolls: 0, sqm: 0 };
    }

    const totalWidth = item.widths?.reduce((acc, w) => acc + toNum(w), 0) || 0;
    if (totalWidth <= 0) {
        return { total: 0, material: 0, install: 0, rolls: 0, sqm: 0 };
    }
    
    const height = toNum(item.height_m);
    const rolls = calculateWallpaperRolls(totalWidth, height);
    const pricePerRoll = toNum(item.price_per_roll);
    const materialCost = rolls * pricePerRoll;

    // Handle install cost logic
    let installCostPerRoll = 300; // default
    const installCostRaw = item.install_cost_per_roll;
    
    if (installCostRaw === 0) { // 0 means 0
        installCostPerRoll = 0;
    } else if (typeof installCostRaw === "number" && installCostRaw > 0) {
        installCostPerRoll = installCostRaw;
    } else if (toNum(installCostRaw) > 0) {
        installCostPerRoll = toNum(installCostRaw);
    }
    
    const installCost = rolls * installCostPerRoll;
    const total = materialCost + installCost;

    return {
        total: Math.round(total),
        material: Math.round(materialCost),
        install: Math.round(installCost),
        rolls: rolls,
        sqm: totalWidth * height
    };
}; //