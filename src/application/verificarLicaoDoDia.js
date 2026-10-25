// SPDX-License-Identifier: GPL-2.0-or-later

import {Username} from '../domain/username.js';
import {avaliarStatus, EstadoLembrete} from '../domain/lembrete.js';
import {ConsultaCanceladaError, PerfilNaoEncontradoError} from './portas.js';

const SEM_CONSULTA = Object.freeze({resumo: null, erro: null});

/**
 * Caso de uso: descobrir se a lição de hoje foi feita.
 * `consultar()` vai ao Duolingo; `estadoAtual()` recalcula com o último resultado
 * (usado depois de marcar manualmente ou quando o horário muda).
 */
export class VerificarLicaoDoDia {
    #perfis;
    #registroManual;
    #relogio;
    #configuracoes;
    #logger;
    #ultimaConsulta = SEM_CONSULTA;

    constructor({perfis, registroManual, relogio, configuracoes, logger}) {
        this.#perfis = perfis;
        this.#registroManual = registroManual;
        this.#relogio = relogio;
        this.#configuracoes = configuracoes;
        this.#logger = logger;
    }

    /**
     * @returns {Promise<EstadoLembrete | null>} null se a consulta foi cancelada
     */
    async consultar(cancelamento) {
        const bruto = this.#configuracoes.username().trim();
        if (!bruto) {
            this.#ultimaConsulta = SEM_CONSULTA;
            return this.estadoAtual();
        }
        if (!Username.ehValido(bruto)) {
            this.#ultimaConsulta = {resumo: null, erro: 'Nome de usuário inválido'};
            return this.estadoAtual();
        }

        try {
            const resumo = await this.#perfis.buscar(new Username(bruto), cancelamento);
            this.#ultimaConsulta = {resumo, erro: null};
        } catch (e) {
            if (e instanceof ConsultaCanceladaError)
                return null;
            if (e instanceof PerfilNaoEncontradoError) {
                this.#ultimaConsulta = {resumo: null, erro: 'Usuário não encontrado (o perfil é público?)'};
            } else {
                this.#logger.warn(`consulta falhou: ${e?.message ?? e}`);
                this.#ultimaConsulta = {resumo: null, erro: 'Não consegui consultar o Duolingo'};
            }
        }
        return this.estadoAtual();
    }

    estadoAtual() {
        const hoje = this.#relogio.hoje();
        const {resumo, erro} = this.#ultimaConsulta;
        const feitoManual = this.#registroManual.ultimoDia()?.igual(hoje) ?? false;
        const feitoApi = resumo?.licaoFeitaEm(hoje) ?? false;

        return new EstadoLembrete({
            status: avaliarStatus({
                feito: feitoManual || feitoApi,
                horaAtual: this.#relogio.horaAtual(),
                horaAlerta: this.#configuracoes.horaAlerta(),
            }),
            streak: resumo?.streak ?? null,
            erro,
        });
    }
}
