// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {Username} from './src/domain/username.js';

export default class LembreteDuolingoPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window._settings = settings;

        const page = new Adw.PreferencesPage({
            title: 'Geral',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // --- Conta ---
        const conta = new Adw.PreferencesGroup({
            title: 'Conta do Duolingo',
            description: 'Só o nome de usuário público do perfil — nunca coloque senha. ' +
                'Aceita letras, números, ponto, hífen e sublinhado (até 64). ' +
                'Deixe vazio para usar apenas o modo manual ("Marcar como feito hoje").',
        });
        page.add(conta);

        const usuario = new Adw.EntryRow({title: 'Usuário'});
        settings.bind('username', usuario, 'text', Gio.SettingsBindFlags.DEFAULT);
        const validar = () => {
            const texto = usuario.text.trim();
            if (texto && !Username.ehValido(texto))
                usuario.add_css_class('error');
            else
                usuario.remove_css_class('error');
        };
        usuario.connect('changed', validar);
        validar();
        conta.add(usuario);

        // --- Lembrete ---
        const lembrete = new Adw.PreferencesGroup({title: 'Lembrete'});
        page.add(lembrete);

        const hora = new Adw.SpinRow({
            title: 'Hora do alerta',
            subtitle: 'A partir desta hora a coruja fica vermelha se a lição não foi feita',
            adjustment: new Gtk.Adjustment({lower: 0, upper: 23, step_increment: 1}),
        });
        settings.bind('hora-alerta', hora, 'value', Gio.SettingsBindFlags.DEFAULT);
        lembrete.add(hora);

        const intervalo = new Adw.SpinRow({
            title: 'Verificar a cada (minutos)',
            adjustment: new Gtk.Adjustment({lower: 5, upper: 240, step_increment: 5}),
        });
        settings.bind('intervalo-min', intervalo, 'value', Gio.SettingsBindFlags.DEFAULT);
        lembrete.add(intervalo);
    }
}
