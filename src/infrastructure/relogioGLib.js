// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';

import {DataLocal} from '../domain/dataLocal.js';

/** Implementa a porta Relogio no fuso horário local. */
export class RelogioGLib {
    hoje() {
        return new DataLocal(GLib.DateTime.new_now_local().format('%Y-%m-%d'));
    }

    horaAtual() {
        return GLib.DateTime.new_now_local().get_hour();
    }
}
