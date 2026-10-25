// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup?version=3.0';

import {ConsultaCanceladaError} from '../../application/portas.js';
import {paraResumoPerfil} from './mapeadorPerfil.js';

// Endpoint público e NÃO oficial do Duolingo: pode mudar ou parar sem aviso.
const ENDPOINT = 'https://www.duolingo.com/2017-06-30/users';
// O filtro "fields" parte da raiz da resposta ({"users": [...]}), por isso é aninhado.
const FIELDS = 'users{streak,streakData{currentStreak}}';
const USER_AGENT = 'lembrete-duolingo (extensao GNOME Shell)';
// A resposta esperada tem poucas centenas de bytes; o limite protege o gnome-shell.
const LIMITE_BYTES = 64 * 1024;
const TAMANHO_BLOCO = 8192;

/** Converte uma chamada assíncrona estilo GIO (callback + *_finish) em Promise. */
function promessa(iniciar, finalizar) {
    return new Promise((resolve, reject) => {
        iniciar((obj, res) => {
            try {
                resolve(finalizar(obj, res));
            } catch (e) {
                reject(e);
            }
        });
    });
}

/** Implementa a porta PerfilGateway usando libsoup 3. */
export class DuolingoPerfilGateway {
    #session;

    constructor() {
        this.#session = new Soup.Session({timeout: 15, user_agent: USER_AGENT});
    }

    async buscar(username, cancelamento) {
        const url = `${ENDPOINT}?username=${encodeURIComponent(username.valor)}` +
            `&fields=${encodeURIComponent(FIELDS)}`;
        const msg = Soup.Message.new('GET', url);
        // Sem redirecionamentos: a requisição só vai para o host fixo acima, via HTTPS.
        msg.set_flags(Soup.MessageFlags.NO_REDIRECT);
        msg.request_headers.append('Accept', 'application/json');

        try {
            const stream = await promessa(
                cb => this.#session.send_async(msg, GLib.PRIORITY_DEFAULT, cancelamento, cb),
                (s, r) => s.send_finish(r));

            try {
                this.#validarCabecalhos(msg);
                const corpo = await this.#lerComLimite(stream, cancelamento);
                return paraResumoPerfil(new TextDecoder('utf-8', {fatal: true}).decode(corpo));
            } finally {
                stream.close_async(GLib.PRIORITY_DEFAULT, null, null);
            }
        } catch (e) {
            if (e instanceof GLib.Error && e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                throw new ConsultaCanceladaError();
            throw e;
        }
    }

    #validarCabecalhos(msg) {
        const status = msg.get_status();
        if (status !== Soup.Status.OK)
            throw new Error(`HTTP ${status}`);

        const [tipo] = msg.response_headers.get_content_type();
        if (tipo !== 'application/json')
            throw new Error(`tipo de conteúdo inesperado: ${tipo}`);

        if (msg.response_headers.get_content_length() > LIMITE_BYTES)
            throw new Error('resposta grande demais');
    }

    async #lerComLimite(stream, cancelamento) {
        const partes = [];
        let total = 0;
        for (;;) {
            const bytes = await promessa(
                cb => stream.read_bytes_async(TAMANHO_BLOCO, GLib.PRIORITY_DEFAULT, cancelamento, cb),
                (s, r) => s.read_bytes_finish(r));
            const tamanho = bytes.get_size();
            if (tamanho === 0)
                break;
            total += tamanho;
            if (total > LIMITE_BYTES)
                throw new Error('resposta grande demais');
            partes.push(bytes.toArray());
        }

        const corpo = new Uint8Array(total);
        let pos = 0;
        for (const parte of partes) {
            corpo.set(parte, pos);
            pos += parte.length;
        }
        return corpo;
    }

    destruir() {
        this.#session.abort();
    }
}
