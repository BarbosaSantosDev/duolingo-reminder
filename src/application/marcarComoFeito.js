// SPDX-License-Identifier: GPL-2.0-or-later

/** Caso de uso: registrar manualmente que a lição de hoje foi feita. */
export class MarcarComoFeito {
    #registroManual;
    #relogio;
    #logger;

    constructor({registroManual, relogio, logger}) {
        this.#registroManual = registroManual;
        this.#relogio = relogio;
        this.#logger = logger;
    }

    /** @returns {boolean} true se o registro foi salvo */
    executar() {
        try {
            this.#registroManual.salvar(this.#relogio.hoje());
            return true;
        } catch (e) {
            this.#logger.error(`não consegui salvar: ${e?.message ?? e}`);
            return false;
        }
    }
}
