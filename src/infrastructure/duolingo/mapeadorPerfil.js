// SPDX-License-Identifier: GPL-2.0-or-later

// Camada anticorrupção: traduz o JSON não oficial do Duolingo para o domínio.
// Tudo que vem da rede é tratado como não confiável e validado campo a campo.

import {DataLocal} from '../../domain/dataLocal.js';
import {ResumoPerfil} from '../../domain/perfil.js';
import {PerfilNaoEncontradoError} from '../../application/portas.js';

export function paraResumoPerfil(texto) {
    let dados;
    try {
        dados = JSON.parse(texto);
    } catch {
        throw new Error('resposta não é JSON válido');
    }

    const usuarios = dados?.users;
    const usuario = Array.isArray(usuarios) ? usuarios[0] : undefined;
    if (!usuario || typeof usuario !== 'object')
        throw new PerfilNaoEncontradoError();

    return new ResumoPerfil({
        streak: usuario.streak,
        ultimoDia: DataLocal.tentar(usuario.streakData?.currentStreak?.endDate),
    });
}
