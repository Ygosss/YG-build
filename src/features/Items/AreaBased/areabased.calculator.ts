// src/features/Items/AreaBased/areabased.calculator.ts

import { toNum } from '../../../lib/utils.ts';
import { SQYD_CONVERSION_RATE } from '../../../lib/state.ts';
import { AreaBasedItem, PriceResult } from '../../../lib/types.ts';

// [Original: A.calculateAreaBasedPrice]
export const calculateAreaBasedPrice = (item: AreaBasedItem): PriceResult => {
    if (!item || item.is_suspended) {
        return { total: 0, sqm: 0, sqyd: 0 };
    }

    const width = toNum(item.width_m);
    const height = toNum(item.height_m);
    const priceSqyd = toNum(item.price_sqyd);

    if (width <= 0 || height <= 0 || priceSqyd <= 0) {
        return { total: 0, sqm: 0, sqyd: 0 };
    }

    const sqm = width * height;
    let sqyd = sqm * SQYD_CONVERSION_RATE;

    // Minimum 1 sqyd, round up to nearest 0.5
    if (sqyd < 1) {
        sqyd = 1;
    } else {
        sqyd = Math.ceil(sqyd * 2) / 2;
    }
    
    const total = sqyd * priceSqyd;

    return {
        total: Math.round(total),
        sqm: sqm,
        sqyd: sqyd
    };
}; //
// (Removed extra '}' from original file)