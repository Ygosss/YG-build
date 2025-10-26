// src/features/Modals/RoomDefaultsModal.ts

import { m } from '../../lib/selectors.ts';
import * as ui from '../../lib/ui.ts';
import * as store from '../../lib/store.ts';
import { ActionTypes } from '../../lib/actions.ts';
import { AppState, Room, HardwareSettings } from '../../lib/types.ts';

const modalEl = document.querySelector<HTMLElement>(m.roomDefaultsModal);
const formEl = modalEl?.querySelector<HTMLFormElement>(m.roomDefaultsForm);

let currentRoomId: string | null = null;

/**
 * แสดงและจัดการ Modal ตั้งค่าเริ่มต้นของห้อง
 * [Replaces ct() and lt()]
 * @param {string} roomId
 */
export const showRoomDefaultsModal = (roomId: string): void => {
    if (!formEl) {
        console.error("RoomDefaultsModal form not found.");
        return;
    }
    currentRoomId = roomId;
    const room: Room | undefined = (store.getState() as AppState).rooms.find(r => r.id === roomId);
    if (!room) return;

    // 1. Populate form with current defaults
    const defaults = room.room_defaults || {};
    const elements = formEl.elements as any; // Cast to any for easier access

    elements.set_style.value = defaults.style || "";
    elements.fabric_variant.value = defaults.fabric_variant || "";
    elements.opening_style.value = defaults.opening_style || "";
    elements.adjustment_side.value = defaults.adjustment_side || "";
    elements.track_color.value = defaults.track_color || "";
    elements.bracket_color.value = defaults.bracket_color || "";
    elements.finial_color.value = defaults.finial_color || "";
    elements.grommet_color.value = defaults.grommet_color || "";
    elements.louis_valance.value = defaults.louis_valance || "";
    elements.louis_tassels.value = defaults.louis_tassels || "";

    // 2. Show modal
    ui.showModal(m.roomDefaultsModal).then((result: boolean | { cancelled: boolean }) => {
        if (result === true) {
            // User clicked Confirm
            const formData = new FormData(formEl);
            const newDefaults: Partial<HardwareSettings & { style: string, fabric_variant: string, opening_style: string, adjustment_side: string }> = {};
            
            formData.forEach((value, key) => {
                if (value && typeof value === 'string') {
                    (newDefaults as any)[key.replace('default_', '')] = value;
                }
            });
            
            store.dispatch(ActionTypes.ROOM_SET_DEFAULTS, {
                roomId: currentRoomId,
                defaults: newDefaults
            });
            ui.showToast("บันทึกค่าเริ่มต้นของห้องแล้ว", "success");
        }
        // 3. Cleanup (formEl.reset() is handled by default HTML)
        currentRoomId = null;
    });
}; //