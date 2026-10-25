// SPDX-License-Identifier: GPL-2.0-or-later

// Value object: data de calendário no formato AAAA-MM-DD.
const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

export class DataLocal {
    #iso;

    constructor(iso) {
        if (!DataLocal.ehValida(iso))
            throw new TypeError('data inválida');
        this.#iso = iso;
        Object.freeze(this);
    }

    static ehValida(iso) {
        return typeof iso === 'string' && FORMATO.test(iso);
    }

    /** Devolve uma DataLocal ou null se o texto não for uma data válida. */
    static tentar(iso) {
        return DataLocal.ehValida(iso) ? new DataLocal(iso) : null;
    }

    get iso() {
        return this.#iso;
    }

    igual(outra) {
        return outra instanceof DataLocal && outra.iso === this.#iso;
    }

    toString() {
        return this.#iso;
    }
}
