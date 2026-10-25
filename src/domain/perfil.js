// SPDX-License-Identifier: GPL-2.0-or-later

import {DataLocal} from './dataLocal.js';

const STREAK_MAX = 100_000;

/** Value object: o que interessa do perfil público (ofensiva e último dia que contou). */
export class ResumoPerfil {
    constructor({streak, ultimoDia}) {
        this.streak = ResumoPerfil.#streakValido(streak) ? streak : null;
        this.ultimoDia = ultimoDia instanceof DataLocal ? ultimoDia : null;
        Object.freeze(this);
    }

    static #streakValido(n) {
        return Number.isSafeInteger(n) && n >= 0 && n <= STREAK_MAX;
    }

    licaoFeitaEm(dia) {
        return this.ultimoDia !== null && this.ultimoDia.igual(dia);
    }
}
