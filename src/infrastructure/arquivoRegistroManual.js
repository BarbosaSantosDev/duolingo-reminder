// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {DataLocal} from '../domain/dataLocal.js';

const CAMINHO = GLib.build_filenamev([
    GLib.get_user_state_dir(), 'lembrete-duolingo', 'feito-em',
]);
// O arquivo guarda só "AAAA-MM-DD"; qualquer coisa maior é descartada sem ler.
const TAMANHO_MAX = 64;

/** Implementa a porta RegistroManualRepository num arquivo privado do usuário. */
export class ArquivoRegistroManual {
    ultimoDia() {
        try {
            const arquivo = Gio.File.new_for_path(CAMINHO);
            const info = arquivo.query_info('standard::type,standard::size',
                Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            if (info.get_file_type() !== Gio.FileType.REGULAR || info.get_size() > TAMANHO_MAX)
                return null;

            const [, bytes] = arquivo.load_contents(null);
            return DataLocal.tentar(new TextDecoder().decode(bytes).trim());
        } catch {
            return null;
        }
    }

    salvar(dia) {
        GLib.mkdir_with_parents(GLib.path_get_dirname(CAMINHO), 0o700);
        // Escrita atômica (arquivo temporário + rename) e legível só pelo dono.
        GLib.file_set_contents_full(CAMINHO, dia.iso,
            GLib.FileSetContentsFlags.CONSISTENT, 0o600);
    }
}
