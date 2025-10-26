// src/lib/utils.ts

/**
 * =================================================================
 * UTILITY FUNCTIONS
 * (แยกฟังก์ชัน Helper ทั่วไปออกมา)
 * =================================================================
 */

/**
 * แปลงค่าใดๆ เป็นตัวเลข (float)
 * [Original: _]
 * @param {*} val
 * @returns {number}
 */
export const toNum = (val: any): number => {
    if (typeof val === "string") {
        val = val.replace(/,/g, "");
    }
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : 0;
}; //

/**
 * แปลงตัวเลขเป็น String (ทศนิยม 2 ตำแหน่ง)
 * [Original: K]
 * @param {number | string} val
 * @returns {string}
 */
export const toNumStr = (val: number | string): string => {
    const num = toNum(val);
    return num > 0 ? num.toFixed(2) : "";
}; //

/**
 * Format ตัวเลขทศนิยม (en-US locale)
 * [Original: te]
 * @param {number} num
 * @param {number} minDigits
 * @param {boolean} forceTwoDigits
 * @returns {string}
 */
export const formatDecimal = (num: number, minDigits = 2, forceTwoDigits = false): string => {
    if (!Number.isFinite(num)) return "0";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: forceTwoDigits ? 2 : minDigits,
        maximumFractionDigits: forceTwoDigits ? 2 : minDigits,
    });
}; //

/**
 * Format ตัวเลข (th-TH locale)
 * [Original: B]
 * @param {number} num
 * @param {number} digits
 * @returns {string}
 */
export const formatThaiNumber = (num: number, digits = 0): string => {
    if (!Number.isFinite(num)) return "0";
    return num.toLocaleString("th-TH", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}; //

/**
 * [Original: we]
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait = 150): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    };
}; //

/**
 * [Original: yt]
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, limit = 200): ((...args: Parameters<T>) => void) => {
    let lastFunc: ReturnType<typeof setTimeout> | null = null;
    let lastRan: number | null = null;

    return (...args: Parameters<T>) => {
        if (!lastRan) {
            func(...args);
            lastRan = Date.now();
        } else {
            if (lastFunc) {
                clearTimeout(lastFunc);
            }
            lastFunc = setTimeout(() => {
                if (lastRan && (Date.now() - lastRan) >= limit) {
                    func(...args);
                    lastRan = Date.now();
                }
            }, limit - (lastRan ? (Date.now() - lastRan) : 0));
        }
    };
}; //


/**
 * [Original: M]
 * @param {string} str
 * @returns {string}
 */
export const escapeHTML = (str: string): string => {
    return str
        ? str.replace(/[<>"'&]/g, (match) => {
            switch (match) {
                case "<": return "&lt;";
                case ">": return "&gt;";
                case '"': return "&quot;";
                case "'": return "&#39;";
                case "&": return "&amp;";
                default: return match;
            }
        })
        : "";
}; //

/**
 * [Original: ot]
 * @param {string} str
 * @returns {string}
 */
export const sanitizeFileName = (str: string): string => {
    return str
        ? str.replace(/[<>:"/\\|?*]/g, "").replace(/[\s\n\t]+/g, "_").substring(0, 100)
        : "file";
}; //

/**
 * [Original: _t]
 * @param {number | string} number
 * @returns {string}
 */
export const bahtText = (number: number | string): string => {
    let num = toNum(number);
    if (num === 0) return "ศูนย์บาทถ้วน";
    if (num < 0 || num > 99999999999999e-2) return "N/A";

    const T = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const N = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];

    num = parseFloat(num.toFixed(2));
    let intPart = Math.floor(num);
    let satang = Math.round((num - intPart) * 100);

    const numToText = (n: number): string => {
        if (n === 0) return "";
        let s = "";
        const strNum = String(n);
        for (let i = 0; i < strNum.length; i++) {
            const digit = strNum[i];
            const pos = strNum.length - i - 1;
            if (digit !== "0") {
                if (pos === 1 && digit === "1") s += T[pos];
                else if (pos === 1 && digit === "2") s += "ยี่" + T[pos];
                else if (pos === 0 && digit === "1" && strNum.length > 1) s += "เอ็ด";
                else s += N[parseInt(digit)] + T[pos];
            }
        }
        return s;
    };

    let result = "";
    if (intPart > 0) {
        const million = Math.floor(intPart / 1e6);
        const remainder = intPart % 1e6;
        if (million > 0) {
            result += numToText(million) + "ล้าน";
        }
        result += numToText(remainder);
        result += "บาท";
    } else {
        result = "ศูนย์บาท";
    }

    if (satang === 0) {
        result += "ถ้วน";
    } else {
        result += numToText(satang) + "สตางค์";
    }
    return result;
}; //