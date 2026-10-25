// SPDX-License-Identifier: GPL-2.0-or-later

export const StatusLicao = Object.freeze({
    PENDENTE: 'pendente',
    ATRASADO: 'atrasado',
    FEITO: 'feito',
});

/** Hora inteira entre 0 e 23; fora disso volta para o padrão. */
export function horaValida(hora, padrao = 20) {
    return Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : padrao;
}

/** Regra de negócio: qual a cor da coruja agora. */
export function avaliarStatus({feito, horaAtual, horaAlerta}) {
    if (feito)
        return StatusLicao.FEITO;
    if (horaAtual >= horaValida(horaAlerta))
        return StatusLicao.ATRASADO;
    return StatusLicao.PENDENTE;
}

/** Estado completo exibido ao usuário. */
export class EstadoLembrete {
    constructor({status, streak = null, erro = null}) {
        this.status = status;
        this.streak = streak;
        this.erro = erro;
        Object.freeze(this);
    }
}
