// SPDX-License-Identifier: GPL-2.0-or-later

const PREFIXO = '[lembrete-duolingo]';

/** Implementa a porta Logger no journal do gnome-shell. */
export const loggerConsole = Object.freeze({
    warn: msg => console.warn(`${PREFIXO} ${msg}`),
    error: msg => console.error(`${PREFIXO} ${msg}`),
});
