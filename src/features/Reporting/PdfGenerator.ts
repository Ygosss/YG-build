// src/features/Reporting/PdfGenerator.ts

import { m } from '../../lib/selectors.ts';
import { toNum, formatThaiNumber, formatDecimal, escapeHTML, bahtText } from '../../lib/utils.ts';
import { SHOP_CONFIG, ITEM_NAMES, SQYD_CONVERSION_RATE } from '../../lib/state.ts';
import { calculateSetPrice } from '../Items/Set/set.calculator.ts';
import { calculateWallpaperPrice } from '../Items/Wallpaper/wallpaper.calculator.ts';
import { calculateAreaBasedPrice } from '../Items/AreaBased/areabased.calculator.ts';
import { calculateAppTotal } from '../Totals/totals.calculator.ts';
import { AppState, Room, Item, SetItem, WallpaperItem, AreaBasedItem, Discount } from '../../lib/types.ts'; // Import types

let itemCounter = 1;

/**
 * สร้างตาราง Item (ผ้าม่าน)
 * [Replaces Tt()]
 * @param {object} item
 * @param {boolean} withDetails
 * @returns {string} HTML string
 */
const createSetTableRow = (item: SetItem, withDetails: boolean): string => {
    const price = calculateSetPrice(item);
    if (price.total === 0) return "";
    
    const w = formatDecimal(toNum(item.width_m), 2);
    const h = formatDecimal(toNum(item.height_m), 2);
    const itemName = (item.style === "หลุยส์") ? ITEM_NAMES.set_louis : ITEM_NAMES.set;
    
    let html = `<tr>
        <td class="text-center">${itemCounter++}</td>
        <td>${escapeHTML(itemName)}`;
    
    if (withDetails) {
        html += `<div class="pdf-item-details">
            - ${escapeHTML(item.style || "")}, ${escapeHTML(item.fabric_variant || "")}<br>
            - ${escapeHTML(item.fabric_code ? `รหัสผ้า: ${item.fabric_code}` : "")}
            - ${escapeHTML(item.sheer_fabric_code ? `รหัสผ้าโปร่ง: ${item.sheer_fabric_code}` : "")}<br>
            - ${escapeHTML(item.notes || "")}
        </div>`;
    }
    
    html += `</td>
        <td class="text-center">${w} x ${h}</td>
        <td class="text-center">1</td>
        <td class="text-right">${formatThaiNumber(price.total)}</td>
    </tr>`;
    return html;
}; //

/**
 * สร้างตาราง Item (วอลเปเปอร์)
 * [Replaces xt() (partial)]
 * @param {object} item
 * @param {boolean} withDetails
 * @returns {string} HTML string
 */
const createWallpaperTableRow = (item: WallpaperItem, withDetails: boolean): string => {
    const price = calculateWallpaperPrice(item);
    if (price.total === 0) return "";
    
    const totalWidth = item.widths?.reduce((acc, w) => acc + toNum(w), 0) || 0;
    const h = formatDecimal(toNum(item.height_m), 2);
    const w = formatDecimal(totalWidth, 2);
    
    let html = `<tr>
        <td class="text-center">${itemCounter++}</td>
        <td>${escapeHTML(ITEM_NAMES.wallpaper)}`;
    
    if (withDetails) {
        html += `<div class="pdf-item-details">
            - รหัส: ${escapeHTML(item.code || "N/A")}<br>
            - ผนัง: ${(item.widths || []).map(width => formatDecimal(toNum(width), 2)).join(' + ')} ม.<br>
            - ${escapeHTML(item.notes || "")}
        </div>`;
    }
    
    html += `</td>
        <td class="text-center">${w} x ${h}</td>
        <td class="text-center">${price.rolls} ม้วน</td>
        <td class="text-right">${formatThaiNumber(price.total)}</td>
    </tr>`;
    return html;
}; //

/**
 * สร้างตาราง Item (ตามพื้นที่)
 * [Replaces xt() (partial)]
 * @param {object} item
 * @param {boolean} withDetails
 * @returns {string} HTML string
 */
const createAreaBasedTableRow = (item: AreaBasedItem, withDetails: boolean): string => {
    const price = calculateAreaBasedPrice(item);
    if (price.total === 0) return "";

    const w = formatDecimal(toNum(item.width_m), 2);
    const h = formatDecimal(toNum(item.height_m), 2);

    let html = `<tr>
        <td class="text-center">${itemCounter++}</td>
        <td>${escapeHTML(ITEM_NAMES[item.type] || item.type)}`;
        
    if (withDetails) {
         html += `<div class="pdf-item-details">
            - รหัส: ${escapeHTML(item.code || "N/A")}<br>
            - ${escapeHTML(item.notes || "")}
        </div>`;
    }
    
    html += `</td>
        <td class="text-center">${w} x ${h}</td>
        <td class="text-center">${formatDecimal(price.sqyd, 1)} หลา</td>
        <td class="text-right">${formatThaiNumber(price.total)}</td>
    </tr>`;
    return html;
}; //


/**
 * สร้าง HTML สำหรับ PDF
 * [Replaces ft()]
 * @param {object} state
 * @param {boolean} withDetails
 * @returns {string} HTML string
 */
export const generatePdfHtml = (state: AppState, withDetails = true): string => {
    itemCounter = 1; // Reset counter
    let roomRowsHtml = "";
    
    state.rooms.forEach((room: Room) => {
        if (room.is_suspended) return;
        
        let itemsHtml = "";
        room.items.forEach((item: Item) => {
            if (item.is_suspended || !item.type) return;
            
            switch (item.type) {
                case "set":
                    itemsHtml += createSetTableRow(item as SetItem, withDetails);
                    break;
                case "wallpaper":
                    itemsHtml += createWallpaperTableRow(item as WallpaperItem, withDetails);
                    break;
                default:
                    if (ITEM_NAMES[item.type]) { // AreaBased
                         itemsHtml += createAreaBasedTableRow(item as AreaBasedItem, withDetails);
                    }
                    break;
            }
        });
        
        if (itemsHtml) {
            roomRowsHtml += `<tr class="room-header"><td colspan="5"><strong>${escapeHTML(room.room_name)}</strong></td></tr>`;
            roomRowsHtml += itemsHtml;
        }
    });

    const originalTotal = calculateAppTotal(state);
    const discount: Discount = state.discount || { type: 'amount', value: 0 };
    let discountAmount = 0;
    let discountRowHtml = "";
    
    if (discount.type === 'percent' && discount.value > 0) {
        discountAmount = (originalTotal * discount.value) / 100;
        discountRowHtml = `<tr>
            <td colspan="4" class="text-right">ส่วนลด ${discount.value}%</td>
            <td class="text-right">-${formatThaiNumber(discountAmount)}</td>
        </tr>`;
    } else if (discount.type === 'amount' && discount.value > 0) {
        discountAmount = discount.value;
         discountRowHtml = `<tr>
            <td colspan="4" class="text-right">ส่วนลด</td>
            <td class="text-right">-${formatThaiNumber(discountAmount)}</td>
        </tr>`;
    }
    
    const grandTotal = originalTotal - discountAmount;
    const vatAmount = grandTotal * SHOP_CONFIG.baseVatRate;
    const totalWithVat = grandTotal + vatAmount;

    // --- Main HTML Structure ---
    return `
    <html>
    <head>
        <title>ใบเสนอราคา - ${escapeHTML(state.customer_name)}</title>
        <meta charset="UTF-8">
        <style>
            /* (CSS from style.css pdf-styles.css) */
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            
            body { 
                font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; 
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            .pdf-container {
                width: 210mm;
                min-height: 297mm;
                margin: auto;
                padding: 25mm 20mm; /* A4 margins */
                box-sizing: border-box;
                border: 1px solid #eee;
                background: #fff;
            }
            @page {
                size: A4;
                margin: 0;
            }
            @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                }
                .pdf-container {
                    border: none;
                    margin: 0;
                    padding: 25mm 20mm;
                    box-shadow: none;
                }
            }
            
            /* --- PDF Styles --- */
            .pdf-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
                margin-bottom: 15px;
            }
            .pdf-header .shop-info {
                max-width: 60%;
            }
            .pdf-header .doc-title {
                text-align: right;
            }
            .shop-info h1 {
                font-size: 1.6rem;
                font-weight: 700;
                color: #000;
                margin: 0 0 5px 0;
            }
            .shop-info p {
                font-size: 0.9rem;
                margin: 2px 0;
                line-height: 1.4;
            }
            .doc-title h1 {
                font-size: 1.8rem;
                font-weight: 700;
                margin: 0 0 10px 0;
                color: #000;
            }
            .doc-title p {
                font-size: 0.9rem;
                margin: 2px 0;
            }
            
            .pdf-customer {
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 10px 15px;
                margin-bottom: 20px;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            th, td {
                border: 1px solid #888;
                padding: 8px 10px;
                text-align: left;
                vertical-align: top;
            }
            thead th {
                background-color: #f0f0f0;
                font-weight: 700;
            }
            tbody tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            tfoot tr {
                font-weight: 700;
            }
            tfoot .grand-total td {
                background-color: #f0f0f0;
                font-size: 1.1rem;
                border-top: 2px solid #333;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .baht-text { font-weight: normal; font-size: 0.9rem; }

            .room-header td {
                background-color: #f9f9f9;
                font-weight: 700;
            }
            .pdf-item-details {
                font-size: 0.8rem;
                color: #333;
                padding-top: 5px;
                line-height: 1.4;
            }

            .pdf-footer {
                margin-top: 25px;
                padding-top: 15px;
                border-top: 2px solid #333;
                font-size: 0.85rem;
            }
            .pdf-footer .payment-terms {
                margin-bottom: 10px;
            }
            .pdf-footer .notes ul {
                margin: 5px 0 15px 0;
                padding-left: 20px;
            }
            .signatures {
                display: flex;
                justify-content: space-around;
                margin-top: 60px;
            }
            .sig-box {
                text-align: center;
                width: 40%;
            }
        </style>
    </head>
    <body>
    <div class="pdf-container">
        <div class="pdf-header">
            <div class="shop-info">
                <h1>${escapeHTML(SHOP_CONFIG.name)}</h1>
                <p>${escapeHTML(SHOP_CONFIG.address)}</p>
                <p>${escapeHTML(SHOP_CONFIG.phone)} (เลขประจำตัวผู้เสียภาษี: ${escapeHTML(SHOP_CONFIG.taxId)})</p>
            </div>
            <div class="doc-title">
                <h1>ใบเสนอราคา</h1>
                <p>วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>ยืนราคา: ${escapeHTML(SHOP_CONFIG.pdf.priceValidity)}</p>
            </div>
        </div>
        
        <div class="pdf-customer">
            <strong>ลูกค้า:</strong> ${escapeHTML(state.customer_name) || "N/A"}<br>
            <strong>โทร:</strong> ${escapeHTML(state.customer_phone) || "N/A"}<br>
            <strong>ที่อยู่:</strong> ${escapeHTML(state.customer_address) || "N/A"}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 5%;">ลำดับ</th>
                    <th style="width: 45%;">รายการ</th>
                    <th class="text-center" style="width: 20%;">ขนาด (ม.) / รายละเอียด</th>
                    <th class="text-center" style="width: 10%;">จำนวน</th>
                    <th class="text-right" style="width: 20%;">ราคารวม (บาท)</th>
                </tr>
            </thead>
            <tbody>
                ${roomRowsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" class="text-right">ยอดรวม (ก่อนส่วนลด)</td>
                    <td class="text-right">${formatThaiNumber(originalTotal)}</td>
                </tr>
                ${discountRowHtml}
                <tr>
                    <td colspan="4" class="text-right">ยอดรวม (หลังส่วนลด)</td>
                    <td class="text-right">${formatThaiNumber(grandTotal)}</td>
                </tr>
                <tr>
                    <td colspan="4" class="text-right">ภาษีมูลค่าเพิ่ม ${SHOP_CONFIG.baseVatRate * 100}%</td>
                    <td class="text-right">${formatThaiNumber(vatAmount)}</td>
                </tr>
                <tr class="grand-total">
                    <td colspan="3" class="text-center baht-text">(${escapeHTML(bahtText(totalWithVat))})</td>
                    <td class="text-right">ยอดรวมทั้งสิ้น</td>
                    <td class="text-right">${formatThaiNumber(totalWithVat)}</td>
                </tr>
            </tfoot>
        </table>
        
        <div class="pdf-footer">
            <div class="payment-terms">
                <strong>เงื่อนไขการชำระเงิน:</strong> ${escapeHTML(SHOP_CONFIG.pdf.paymentTerms)}
            </div>
            <div class="notes">
                <strong>หมายเหตุ:</strong>
                <ul>
                    ${SHOP_CONFIG.pdf.notes.map(note => `<li>${escapeHTML(note)}</li>`).join("")}
                </ul>
            </div>
            <div class="signatures">
                <div class="sig-box">
                    ..............................<br>
                    (ลูกค้า)
                </div>
                <div class="sig-box">
                    ..............................<br>
                    (ผู้เสนอราคา)
                </div>
            </div>
        </div>
    </div>
    </body>
    </html>
    `;
}; //