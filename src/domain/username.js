// SPDX-License-Identifier: GPL-2.0-or-later

// Value object: nome de usuário público do Duolingo.
// A validação restringe o que sai da máquina para o formato esperado de um usuário.
const FORMATO = /^[A-Za-z0-9._-]{1,64}$/;

export class UsernameInvalidoError extends Error {
    constructor() {
        super('nome de usuário inválido');
        this.name = 'UsernameInvalidoError';
    }
}

export class Username {
    #valor;

    constructor(valor) {
        if (typeof valor !== 'string' || !FORMATO.test(valor))
            throw new UsernameInvalidoError();
        this.#valor = valor;
        Object.freeze(this);
    }

    static ehValido(valor) {
        return typeof valor === 'string' && FORMATO.test(valor.trim());
    }

    get valor() {
        return this.#valor;
    }

    toString() {
        return this.#valor;
    }
}
