// src/features/Data/ImportExport.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import * as favService from '../../lib/services/favorites.ts';
import { APP_VERSION, APP_STORAGE_KEY } from '../../lib/state.ts';
import { sanitizeFileName } from '../../lib/utils.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { AppState } from '../../lib/types.ts';
import { Favorite } from '../../lib/services/favorites.ts';

const fileImporter = document.querySelector<HTMLInputElement>(m.fileImporter);
const favImporter = document.querySelector<HTMLInputElement>(m.favImporter);

/**
 * สร้างและดาวน์โหลดไฟล์
 * [Replaces De()]
 * @param {string} content
 * @param {string} fileName
 * @param {string} mimeType
 */
export const downloadFile = (content: string, fileName: string, mimeType = "application/json;charset=utf-8"): void => {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ui.showToast("ส่งออกข้อมูลสำเร็จ", "success");
    } catch (err) {
        console.error("Export failed", err);
        ui.showToast("ส่งออกข้อมูลล้มเหลว", "error");
    }
}; //

/**
 * ส่งออก State ปัจจุบัน
 * [Replaces Me()]
 */
export const exportData = (): void => {
    const state = store.getState();
    const fileName = sanitizeFileName(`marnthara_data_${state.customer_name || 'backup'}_${new Date().toISOString().split('T')[0]}.json`);
    
    // อัปเดตเวอร์ชันก่อนส่งออก
    const dataToExport = { ...state, app_version: APP_VERSION };
    
    downloadFile(JSON.stringify(dataToExport), fileName);
}; //

/**
 * อ่านไฟล์ JSON
 * [Internal helper]
 * @param {File} file
 * @returns {Promise<any>}
 */
const readJsonFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = JSON.parse(e.target?.result as string);
                resolve(result);
            } catch (err) {
                reject(new Error("ไฟล์ไม่ใช่ JSON"));
            }
        };
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
        reader.readAsText(file);
    });
};

/**
 * จัดการการนำเข้า State
 * [Replaces Ge()]
 * @param {Event} e
 */
export const handleImportData = async (e: Event): Promise<void> => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
        const data = await readJsonFile(file) as AppState;
        
        // Basic validation
        if (!data || !Array.isArray(data.rooms) || !data.app_version) {
            throw new Error("ไฟล์ข้อมูลไม่ถูกต้อง");
        }
        
        // TODO: Add version migration logic if data.app_version !== APP_VERSION
        
        // Dispatch APP_LOAD_STATE action
        store.dispatch(ActionTypes.APP_LOAD_STATE, data);
        
        ui.showToast("นำเข้าข้อมูลสำเร็จ", "success");
        
    } catch (err: any) {
        console.error("Import failed", err);
        ui.showToast(`นำเข้าล้มเหลว: ${err.message}`, "error");
    } finally {
        target.value = ''; // Reset input
    }
}; //

/**
 * ส่งออก Favorites
 * [Replaces Xe()]
 */
export const exportFavorites = (): void => {
    const favorites = favService.loadFavorites();
    const fileName = `marnthara_favorites_${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(JSON.stringify(favorites), fileName);
}; //

/**
 * นำเข้า Favorites
 * [Replaces Ke()]
 * @param {Event} e
 */
export const handleImportFavorites = async (e: Event): Promise<void> => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    const modalEl = document.querySelector<any>(m.favoritesConflictModal); // <any> for .closeModal
    if (!modalEl) return;

    try {
        const data = await readJsonFile(file) as Favorite;
        
        // Validation
        if (!favService.isValidFavorites(data)) {
            throw new Error("ไฟล์ Favorites ไม่ถูกต้อง");
        }
        
        // Ask user to merge or overwrite
        let merge = false;
        let overwrite = false;
        
        await new Promise<void>(resolve => {
            const confirmBtn = modalEl.querySelector<HTMLButtonElement>("#favoritesMergeConfirm");
            const overwriteBtn = modalEl.querySelector<HTMLButtonElement>("#favoritesOverwriteConfirm");
            if(!confirmBtn || !overwriteBtn) return resolve();
            
            confirmBtn.onclick = () => { merge = true; modalEl.closeModal({ cancelled: false }); };
            overwriteBtn.onclick = () => { overwrite = true; modalEl.closeModal({ cancelled: false }); };
            
            ui.showModal(m.favoritesConflictModal).then(() => {
                // Cleanup
                confirmBtn.onclick = null;
                overwriteBtn.onclick = null;
                resolve();
            });
        });

        if (merge) {
            const count = favService.mergeFavorites(data);
            ui.showToast(`รวมข้อมูล Favorites สำเร็จ (เพิ่ม/อัปเดต ${count} รายการ)`, "success");
        } else if (overwrite) {
            favService.importFavorites(data);
            ui.showToast("เขียนทับ Favorites สำเร็จ", "success");
        }
        
    } catch (err: any) {
        console.error("Favorites import failed", err);
        ui.showToast(`นำเข้าล้มเหลว: ${err.message}`, "error");
    } finally {
        target.value = ''; // Reset input
    }
}; //

/**
 * ลงทะเบียน Event Listeners สำหรับ File Inputs
 */
export const initDataHandlers = (): void => {
    if (fileImporter) {
        fileImporter.addEventListener("change", handleImportData);
    }
    if (favImporter) {
        favImporter.addEventListener("change", handleImportFavorites);
    }
}; //