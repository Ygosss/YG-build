// src/features/Reporting/WebhookSubmit.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { WEBHOOK_URL } from '../../lib/state.ts';
import { generateTextSummary } from './TextGenerator.ts';
import { AppState } from '../../lib/types.ts';

/**
 * รวบรวมและส่งข้อมูลไปยัง Webhook
 * [Replaces le()]
 */
export const submitToWebhook = async (): Promise<void> => {
    const state: AppState = store.getState();
    if (!state.customer_name) {
        ui.showToast("โปรดใส่ชื่อลูกค้าก่อนส่งข้อมูล", "warning");
        document.querySelector<HTMLInputElement>(m.customerNameInput)?.focus();
        return;
    }
    
    if (state.rooms.length === 0 || state.rooms.every(r => r.items.length === 0)) {
        ui.showToast("ไม่มีรายการสินค้า โปรดเพิ่มอย่างน้อย 1 รายการ", "warning");
        return;
    }
    
    if (!WEBHOOK_URL || WEBHOOK_URL.includes("your-make-webhook-url.com")) {
         ui.showToast("ระบบส่งข้อมูล (Webhook) ยังไม่ได้ตั้งค่า", "error");
         console.error("WEBHOOK_URL is not configured in state.ts");
         return;
    }
    
    const submitBtn = document.querySelector<HTMLButtonElement>(m.submitBtn);
    if (!submitBtn) return;
    
    const span = submitBtn.querySelector("span");
    
    try {
        submitBtn.disabled = true;
        if (span) span.textContent = "กำลังส่ง...";
        ui.showToast("กำลังส่งข้อมูล...", "default");

        // 1. สร้าง Payload
        const textSummary = generateTextSummary(state);
        const payload = {
            ...state,
            text_summary: textSummary 
            // (Webhook จะรับ JSON ของ state ทั้งหมด และ text_summary)
        };

        // 2. ส่งข้อมูล
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        
        ui.showToast("ส่งข้อมูลสำเร็จ!", "success");
        if (span) span.textContent = "ส่งข้อมูล (Make)";
        
    } catch (err: any) {
        console.error("Webhook submission failed:", err);
        ui.showToast("ส่งข้อมูลล้มเหลว", "error");
        if (span) span.textContent = "ลองอีกครั้ง";
    } finally {
        submitBtn.disabled = false;
    }
}; //