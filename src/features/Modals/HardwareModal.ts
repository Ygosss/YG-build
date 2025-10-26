// src/features/Modals/HardwareModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { HardwareSettings } from '../../lib/types.ts'; // Import Type

const modalEl = document.querySelector<HTMLElement>(m.hardwareModal);

let currentRoomId: string | null = null;

/**
 * แสดงและจัดการ Modal อุปกรณ์
 * [Replaces Ve()]
 * @param {string} roomId
 */
export const showHardwareModal = (roomId: string): void => {
    if (!modalEl) {
        console.error("HardwareModal element not found.");
        return;
    }
    currentRoomId = roomId;
    
    // 1. Reset form
    const form = modalEl.querySelector('form');
    form?.reset();
    
    // 2. Show modal
    ui.showModal(m.hardwareModal).then((result: boolean | { cancelled: boolean }) => {
        if (result === true) {
            // User clicked Confirm
            const hardwareData: HardwareSettings = {
                track_color: (modalEl.querySelector<HTMLInputElement>(m.modalTrackColor))?.value,
                bracket_color: (modalEl.querySelector<HTMLInputElement>(m.modalBracketColor))?.value,
                finial_color: (modalEl.querySelector<HTMLInputElement>(m.modalFinialColor))?.value,
                grommet_color: (modalEl.querySelector<HTMLInputElement>(m.modalGrommetColor))?.value,
                louis_valance: (modalEl.querySelector<HTMLInputElement>(m.modalLouisValance))?.value,
                louis_tassels: (modalEl.querySelector<HTMLInputElement>(m.modalLouisTassels))?.value,
            };
            
            // Filter out empty values
            const cleanData = Object.entries(hardwareData).reduce((acc, [key, value]) => {
                if (value) {
                    (acc as any)[key] = value;
                }
                return acc;
            }, {} as Partial<HardwareSettings>);

            if (Object.keys(cleanData).length > 0) {
                store.dispatch(ActionTypes.ROOM_APPLY_HARDWARE, {
                    roomId: currentRoomId,
                    hardwareData: cleanData
                });
                ui.showToast("ใช้การตั้งค่าอุปกรณ์กับทุกรายการแล้ว", "success");
            }
        }
        // 3. Cleanup
        currentRoomId = null;
    });
}; //