// SPDX-License-Identifier: GPL-2.0-or-later

// Composition root: monta as camadas e controla o ciclo de vida (timers, sinais).

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {VerificarLicaoDoDia} from './src/application/verificarLicaoDoDia.js';
import {MarcarComoFeito} from './src/application/marcarComoFeito.js';
import {DuolingoPerfilGateway} from './src/infrastructure/duolingo/duolingoPerfilGateway.js';
import {ArquivoRegistroManual} from './src/infrastructure/arquivoRegistroManual.js';
import {RelogioGLib} from './src/infrastructure/relogioGLib.js';
import {ConfiguracoesGSettings} from './src/infrastructure/configuracoesGSettings.js';
import {loggerConsole} from './src/infrastructure/loggerConsole.js';
import {Indicador} from './src/presentation/indicador.js';

const URL_DUOLINGO = 'https://www.duolingo.com/learn';
// O campo de usuário grava a cada tecla; espera parar de digitar antes de consultar.
const ESPERA_DIGITACAO_MS = 1500;

export default class LembreteDuolingo extends Extension {
    enable() {
        this._settings = this.getSettings();
        const configuracoes = new ConfiguracoesGSettings(this._settings);
        const registroManual = new ArquivoRegistroManual();
        const relogio = new RelogioGLib();
        this._gateway = new DuolingoPerfilGateway();

        this._verificarLicao = new VerificarLicaoDoDia({
            perfis: this._gateway,
            registroManual,
            relogio,
            configuracoes,
            logger: loggerConsole,
        });
        const marcarComoFeito = new MarcarComoFeito({registroManual, relogio, logger: loggerConsole});

        this._indicador = new Indicador({
            caminhoIcone: GLib.build_filenamev([this.path, 'icons', 'coruja-symbolic.svg']),
            aoAbrir: () => Gio.AppInfo.launch_default_for_uri(URL_DUOLINGO, null),
            aoMarcarFeito: () => {
                marcarComoFeito.executar();
                this._indicador.renderizar(this._verificarLicao.estadoAtual());
            },
            aoVerificar: () => this._verificar(),
            aoConfigurar: () => this.openPreferences(),
        });
        Main.panel.addToStatusArea(this.uuid, this._indicador);

        this._settingsIds = [
            this._settings.connect('changed::username', () => this._agendarVerificacao()),
            this._settings.connect('changed::hora-alerta',
                () => this._indicador.renderizar(this._verificarLicao.estadoAtual())),
            this._settings.connect('changed::intervalo-min',
                () => this._iniciarTimer(configuracoes.intervaloMinutos())),
        ];

        this._indicador.renderizar(this._verificarLicao.estadoAtual());
        this._verificar();
        this._iniciarTimer(configuracoes.intervaloMinutos());
    }

    async _verificar() {
        // Uma consulta por vez: a nova cancela a anterior, evitando respostas fora de ordem.
        this._cancellable?.cancel();
        const cancellable = new Gio.Cancellable();
        this._cancellable = cancellable;

        try {
            const estado = await this._verificarLicao.consultar(cancellable);
            if (estado && this._cancellable === cancellable)
                this._indicador?.renderizar(estado);
        } catch (e) {
            loggerConsole.error(`erro inesperado: ${e?.message ?? e}`);
        }
    }

    _agendarVerificacao() {
        this._cancelarAgendamento();
        this._agendamento = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ESPERA_DIGITACAO_MS, () => {
            this._agendamento = null;
            this._verificar();
            return GLib.SOURCE_REMOVE;
        });
    }

    _cancelarAgendamento() {
        if (this._agendamento) {
            GLib.source_remove(this._agendamento);
            this._agendamento = null;
        }
    }

    _iniciarTimer(minutos) {
        this._pararTimer();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, minutos * 60, () => {
            this._verificar();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _pararTimer() {
        if (this._timer) {
            GLib.source_remove(this._timer);
            this._timer = null;
        }
    }

    disable() {
        this._pararTimer();
        this._cancelarAgendamento();
        this._cancellable?.cancel();
        this._cancellable = null;
        this._settingsIds?.forEach(id => this._settings.disconnect(id));
        this._settingsIds = null;
        this._gateway?.destruir();
        this._gateway = null;
        this._indicador?.destroy();
        this._indicador = null;
        this._verificarLicao = null;
        this._settings = null;
    }
}
