// src/features/Items/Set/SetItem.ts

import { m } from '../../../lib/selectors.ts';
import { toNum, toNumStr, formatThaiNumber, debounce, formatDecimal } from '../../../lib/utils.ts';
import { ActionTypes } from '../../../lib/actions.ts';
import { calculateSetPrice, calculateFabricYardage, calculateGrommets } from './set.calculator.ts';
import { SetItem, Dispatch } from '../../../lib/types.ts';

/**
 * สร้าง DOM Element สำหรับ Set Item (ผ้าม่าน)
 * [Replaces Ce()]
 * @param {object} itemData - ข้อมูล Item (จาก State)
 * @param {function} dispatch - ฟังก์ชัน dispatch ของ store
 * @returns {HTMLElement | null}
 */
export const createSetItemElement = (itemData: SetItem, dispatch: Dispatch): HTMLElement | null => {
    const template = document.querySelector<HTMLTemplateElement>(m.setTpl);
    if (!template) {
        console.error("Set template not found");
        return null;
    }
    const element = template.content.cloneNode(true).firstElementChild as HTMLElement;
    if (!element) return null;
    
    element.dataset.type = "set";

    // --- Query Selectors (Typed) ---
    const widthInput = element.querySelector<HTMLInputElement>(m.setWidthInput);
    const heightInput = element.querySelector<HTMLInputElement>(m.setHeightInput);
    const styleSelect = element.querySelector<HTMLSelectElement>(m.setStyleSelect);
    const variantSelect = element.querySelector<HTMLSelectElement>(m.setFabricVariantSelect);
    const priceSelect = element.querySelector<HTMLSelectElement>(m.setPricePerMSelect);
    const sheerPriceSelect = element.querySelector<HTMLSelectElement>(m.setSheerPricePerMSelect);
    const louisPriceSelect = element.querySelector<HTMLSelectElement>(m.setLouisPricePerMSelect);
    const fabricCodeInput = element.querySelector<HTMLInputElement>(m.setFabricCodeInput);
    const sheerCodeInput = element.querySelector<HTMLInputElement>(m.setSheerFabricCodeInput);
    const notesInput = element.querySelector<HTMLTextAreaElement>(m.setNotesInput);
    const summaryEl = element.querySelector<HTMLElement>("[data-item-summary]");
    
    // Groups for visibility
    const sheerGroup = element.querySelector<HTMLElement>(m.setSheerGroup);
    const louisGroup = element.querySelector<HTMLElement>(m.setLouisGroup);
    const grommetGroup = element.querySelector<HTMLElement>(m.grommetColorGroup);

    if (!widthInput || !heightInput || !styleSelect || !variantSelect || !priceSelect || 
        !sheerPriceSelect || !louisPriceSelect || !fabricCodeInput || !sheerCodeInput || 
        !notesInput || !summaryEl || !sheerGroup || !louisGroup || !grommetGroup) {
        console.error("SetItem essential elements not found.");
        return null;
    }

    // --- Update Summary (Internal) ---
    const updateSummary = () => {
        const { total, opaque, sheer, louis } = calculateSetPrice(itemData);
        const yardage = calculateFabricYardage(itemData.style, itemData.width_m);
        const grommets = calculateGrommets(itemData);
        
        if (total > 0) {
            let details = `<i class="ph ph-ruler"></i> ${formatDecimal(yardage, 1)} หลา`;
            if (grommets > 0) details += ` (${grommets} ตาไก่)`;
            if (louis > 0) details += ` | หลุยส์ ${formatThaiNumber(louis)} บ.`;
            
            summaryEl.innerHTML = `
                ${details}
                <i class="ph ph-tag"></i> <strong>${formatThaiNumber(total)}</strong> บาท
            `;
        } else {
             summaryEl.innerHTML = `<i class="ph ph-warning-circle"></i> <span>กรอกข้อมูล (กว้าง, สูง, ราคา)</span>`;
        }
    };

    // --- Update UI Visibility (Internal) ---
    const updateVisibility = () => {
        const style = itemData.style || "ลอน";
        const variant = itemData.fabric_variant || "ทึบ";
        
        sheerGroup.classList.toggle("hidden", !variant.includes("โปร่ง"));
        louisGroup.classList.toggle("hidden", style !== "หลุยส์");
        grommetGroup.classList.toggle("hidden", style !== "ตาไก่");
        
        // Hide irrelevant price inputs
        priceSelect.closest(".form-group")?.classList.toggle("hidden", !variant.includes("ทึบ"));
        sheerPriceSelect.closest(".form-group")?.classList.toggle("hidden", !variant.includes("โปร่ง"));
    };

    // --- Event Listeners (Dimension) ---
    const onDimBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const value = toNum(target.value);
        target.value = toNumStr(value);
        
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            field: target.name,
            value: value
        });
    };
    widthInput.addEventListener("blur", onDimBlur);
    heightInput.addEventListener("blur", onDimBlur);

    // --- Event Listeners (Selects & Text) ---
    const onChange = (e: Event) => {
        const target = e.target as HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement;
        const value = (target.type === 'select-one' && (target as HTMLSelectElement).value.includes("เลือก")) ? "" : target.value;
        
        dispatch(ActionTypes.ITEM_UPDATE_FIELD, {
            roomId: itemData.roomId,
            itemId: itemData.id,
            field: target.name,
            // ส่งเป็นตัวเลขถ้าเป็น field ราคา
            value: (target.name.includes("price")) ? toNum(value) : value
        });
    };
    
    [styleSelect, variantSelect, priceSelect, sheerPriceSelect, louisPriceSelect, 
     fabricCodeInput, sheerCodeInput, notesInput].forEach(el => {
        el.addEventListener("change", onChange); // 'change' for selects
        if (el.tagName !== 'SELECT') el.addEventListener("blur", onChange); // 'blur' for inputs
    });
    
    // Hardware inputs
    element.querySelectorAll('input[data-hardware="true"]').forEach(el => {
        el.addEventListener("blur", onChange);
    });
    
    // Selects (Opening/Adjustment)
    element.querySelectorAll(m.setOpeningStyleSelect + ',' + m.setAdjustmentSideSelect).forEach(el => {
        el.addEventListener("change", onChange);
    });


    // --- Populate Initial Data ---
    widthInput.value = toNumStr(itemData.width_m);
    heightInput.value = toNumStr(itemData.height_m);
    styleSelect.value = itemData.style || "ลอน";
    variantSelect.value = itemData.fabric_variant || "ทึบ";
    priceSelect.value = itemData.price_per_m_raw ? String(itemData.price_per_m_raw) : "";
    sheerPriceSelect.value = itemData.sheer_price_per_m ? String(itemData.sheer_price_per_m) : "";
    louisPriceSelect.value = itemData.louis_price_per_m ? String(itemData.louis_price_per_m) : "";
    fabricCodeInput.value = itemData.fabric_code || "";
    sheerCodeInput.value = itemData.sheer_fabric_code || "";
    (element.querySelector(m.setOpeningStyleSelect) as HTMLSelectElement).value = itemData.opening_style || "แยกกลาง";
    (element.querySelector(m.setAdjustmentSideSelect) as HTMLSelectElement).value = itemData.adjustment_side || "ปรับขวา";
    notesInput.value = itemData.notes || "";
    
    // Hardware
    (element.querySelector('input[name="track_color"]') as HTMLInputElement).value = itemData.track_color || "ขาว";
    (element.querySelector('input[name="bracket_color"]') as HTMLInputElement).value = itemData.bracket_color || "ขาว";
    (element.querySelector('input[name="finial_color"]') as HTMLInputElement).value = itemData.finial_color || "ขาว";
    (element.querySelector('input[name="grommet_color"]') as HTMLInputElement).value = itemData.grommet_color || "เงิน";
    (element.querySelector('input[name="louis_valance"]') as HTMLInputElement).value = itemData.louis_valance || "กล่องหลุยส์";
    (element.querySelector('input[name="louis_tassels"]') as HTMLInputElement).value = itemData.louis_tassels || "พู่หลุยส์";

    if (itemData.is_suspended) {
        element.classList.add("is-suspended");
    }

    updateVisibility();
    updateSummary();
    
    return element;
};