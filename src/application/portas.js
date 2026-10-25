// SPDX-License-Identifier: GPL-2.0-or-later

// Portas (contratos) que a camada de infraestrutura implementa.
// JavaScript não tem interfaces; os typedefs abaixo documentam o formato esperado.

/**
 * @typedef {object} PerfilGateway
 * @property {(username: import('../domain/username.js').Username, cancelamento: any)
 *   => Promise<import('../domain/perfil.js').ResumoPerfil>} buscar
 *   Rejeita com PerfilNaoEncontradoError, ConsultaCanceladaError ou outro Error.
 */

/**
 * @typedef {object} RegistroManualRepository
 * @property {() => import('../domain/dataLocal.js').DataLocal | null} ultimoDia
 * @property {(dia: import('../domain/dataLocal.js').DataLocal) => void} salvar
 */

/**
 * @typedef {object} Relogio
 * @property {() => import('../domain/dataLocal.js').DataLocal} hoje
 * @property {() => number} horaAtual
 */

/**
 * @typedef {object} Configuracoes
 * @property {() => string} username
 * @property {() => number} horaAlerta
 */

/**
 * @typedef {object} Logger
 * @property {(msg: string) => void} warn
 * @property {(msg: string) => void} error
 */

export class PerfilNaoEncontradoError extends Error {
    constructor() {
        super('usuário não encontrado');
        this.name = 'PerfilNaoEncontradoError';
    }
}

export class ConsultaCanceladaError extends Error {
    constructor() {
        super('consulta cancelada');
        this.name = 'ConsultaCanceladaError';
    }
}
