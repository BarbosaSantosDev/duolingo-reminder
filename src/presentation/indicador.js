// SPDX-License-Identifier: GPL-2.0-or-later

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {StatusLicao} from '../domain/lembrete.js';

const APARENCIA = {
    [StatusLicao.FEITO]: {classe: 'duo-feito', texto: 'Lição de hoje feita ✔'},
    [StatusLicao.ATRASADO]: {classe: 'duo-atrasado', texto: 'Ainda não fez a lição de hoje!'},
    [StatusLicao.PENDENTE]: {classe: 'duo-pendente', texto: 'Lição de hoje pendente'},
};

/**
 * Ícone da coruja no painel. Só exibe um EstadoLembrete e repassa as ações
 * do menu para os callbacks recebidos; não conhece rede, arquivos nem regras.
 */
export const Indicador = GObject.registerClass(
class Indicador extends PanelMenu.Button {
    _init({caminhoIcone, aoAbrir, aoMarcarFeito, aoVerificar, aoConfigurar}) {
        super._init(0.5, 'Lembrete Duolingo');

        const box = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        box.add_child(new St.Icon({
            gicon: Gio.icon_new_for_string(caminhoIcone),
            style_class: 'system-status-icon',
        }));
        this._label = new St.Label({
            text: '',
            style_class: 'duo-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(this._label);
        this.add_child(box);

        this._itemStatus = new PopupMenu.PopupMenuItem('', {reactive: false});
        this.menu.addMenuItem(this._itemStatus);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._adicionarItem('Abrir o Duolingo', aoAbrir);
        this._adicionarItem('Marcar como feito hoje', aoMarcarFeito);
        this._adicionarItem('Verificar agora', aoVerificar);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._adicionarItem('Configurações', aoConfigurar);
    }

    _adicionarItem(texto, acao) {
        const item = new PopupMenu.PopupMenuItem(texto);
        item.connect('activate', () => acao());
        this.menu.addMenuItem(item);
    }

    /** @param {import('../domain/lembrete.js').EstadoLembrete} estado */
    renderizar(estado) {
        const aparencia = APARENCIA[estado.status] ?? APARENCIA[StatusLicao.PENDENTE];

        Object.values(APARENCIA).forEach(a => this.remove_style_class_name(a.classe));
        this.add_style_class_name(aparencia.classe);

        // St.Label não interpreta markup, então o texto é exibido literalmente.
        if (estado.streak !== null)
            this._label.text = ` ${estado.streak}`;
        else
            this._label.text = estado.status === StatusLicao.FEITO ? '' : ' !';

        this._itemStatus.label.text = estado.erro
            ? `${aparencia.texto}\n${estado.erro}`
            : aparencia.texto;
    }
});
