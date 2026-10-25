// SPDX-License-Identifier: GPL-2.0-or-later

const INTERVALO_MIN = 5;
const INTERVALO_MAX = 240;

/** Implementa a porta Configuracoes lendo do GSettings da extensão. */
export class ConfiguracoesGSettings {
    #settings;

    constructor(settings) {
        this.#settings = settings;
    }

    username() {
        return this.#settings.get_string('username');
    }

    horaAlerta() {
        return this.#settings.get_int('hora-alerta');
    }

    intervaloMinutos() {
        const min = this.#settings.get_int('intervalo-min');
        return Math.min(INTERVALO_MAX, Math.max(INTERVALO_MIN, min));
    }
}
