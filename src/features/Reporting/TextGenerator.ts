// src/features/Reporting/TextGenerator.ts

import { toNum, formatThaiNumber, formatDecimal } from '../../lib/utils.ts';
import { ITEM_NAMES } from '../../lib/state.ts';
// import * as Calcs from '../Totals/totals.calculator.ts'; // ไม่ได้ใช้ Calcs
import { calculateSetPrice } from '../Items/Set/set.calculator.ts';
import { calculateWallpaperPrice } from '../Items/Wallpaper/wallpaper.calculator.ts';
import { calculateAreaBasedPrice } from '../Items/AreaBased/areabased.calculator.ts';
import { AppState, Item, Room, SetItem, WallpaperItem, AreaBasedItem, Discount } from '../../lib/types.ts';

/**
 * สร้างสรุปข้อความ (สำหรับ LINE)
 * [Replaces Bt() and Ct()]
 * @param {object} state - Full application state
 * @returns {string}
 */
export const generateTextSummary = (state: AppState): string => {
    let output = "สรุปรายการ:\n";
    let originalTotal = 0;

    state.rooms.forEach((room: Room) => {
        if (room.is_suspended) return;
        
        output += `\n*${room.room_name}*:\n`;
        let roomTotal = 0;

        room.items.forEach((item: Item) => {
            if (item.is_suspended) return;
            if (!item.type) return; // Skip placeholders
            
            const itemName = ITEM_NAMES[item.type] || item.type;
            let price = 0;
            let details = "";

            switch (item.type) {
                case "set": {
                    const setItem = item as SetItem;
                    const setPrice = calculateSetPrice(setItem);
                    price = setPrice.total;
                    details = `${formatDecimal(toNum(setItem.width_m))}x${formatDecimal(toNum(setItem.height_m))} ม. (${setItem.style}, ${setItem.fabric_variant})`;
                    break;
                }
                case "wallpaper": {
                    const wallItem = item as WallpaperItem;
                    const wallPrice = calculateWallpaperPrice(wallItem);
                    price = wallPrice.total;
                    const totalWidth = wallItem.widths?.reduce((acc, w) => acc + toNum(w), 0) || 0;
                    details = `สูง ${formatDecimal(toNum(wallItem.height_m))} ม., กว้าง ${formatDecimal(totalWidth)} ม. (${wallPrice.rolls} ม้วน)`;
                    break;
                }
                default: {
                    if (ITEM_NAMES[item.type]) { // AreaBased
                        const areaItem = item as AreaBasedItem;
                        const areaPrice = calculateAreaBasedPrice(areaItem);
                        price = areaPrice.total;
                        details = `${formatDecimal(toNum(areaItem.width_m))}x${formatDecimal(toNum(areaItem.height_m))} ม. (${areaPrice.sqyd} หลา)`;
                    }
                    break;
                }
            }
            
            output += `  - ${itemName}: ${details} = ${formatThaiNumber(price)} บ.\n`;
            roomTotal += price;
        });
        output += `  _ยอดรวม ${room.room_name}: ${formatThaiNumber(roomTotal)} บ._\n`;
        originalTotal += roomTotal;
    });

    output += "\n--------------------\n";
    output += `*ยอดรวม (ก่อนส่วนลด): ${formatThaiNumber(originalTotal)} บ.*\n`;

    const discount: Discount = state.discount || { type: 'amount', value: 0 };
    let discountAmount = 0;
    
    if (discount.type === 'percent' && discount.value > 0) {
        discountAmount = (originalTotal * discount.value) / 100;
        output += `*ส่วนลด ${discount.value}%: -${formatThaiNumber(discountAmount)} บ.*\n`;
    } else if (discount.type === 'amount' && discount.value > 0) {
        discountAmount = discount.value;
        output += `*ส่วนลด: -${formatThaiNumber(discountAmount)} บ.*\n`;
    }

    const grandTotal = originalTotal - discountAmount;
    output += `*ยอดสุทธิ: ${formatThaiNumber(grandTotal)} บ.*\n`;

    return output;
}; //