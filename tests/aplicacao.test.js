import {test} from 'node:test';
import assert from 'node:assert/strict';

import {VerificarLicaoDoDia} from '../src/application/verificarLicaoDoDia.js';
import {MarcarComoFeito} from '../src/application/marcarComoFeito.js';
import {
    ConsultaCanceladaError, PerfilNaoEncontradoError,
} from '../src/application/portas.js';
import {paraResumoPerfil} from '../src/infrastructure/duolingo/mapeadorPerfil.js';
import {DataLocal} from '../src/domain/dataLocal.js';
import {ResumoPerfil} from '../src/domain/perfil.js';
import {StatusLicao} from '../src/domain/lembrete.js';

const HOJE = new DataLocal('2026-10-25');

function montar({username = 'joao', hora = 10, buscar, manual = null} = {}) {
    let registro = manual;
    const chamadas = [];
    const deps = {
        perfis: {
            buscar: async (u, c) => {
                chamadas.push(u.valor);
                return buscar(u, c);
            },
        },
        registroManual: {ultimoDia: () => registro, salvar: d => (registro = d)},
        relogio: {hoje: () => HOJE, horaAtual: () => hora},
        configuracoes: {username: () => username, horaAlerta: () => 20},
        logger: {warn() {}, error() {}},
    };
    return {caso: new VerificarLicaoDoDia(deps), deps, chamadas};
}

test('sem usuário não consulta a rede', async () => {
    const {caso, chamadas} = montar({username: '  '});
    const estado = await caso.consultar();
    assert.equal(chamadas.length, 0);
    assert.equal(estado.status, StatusLicao.PENDENTE);
});

test('usuário inválido não consulta a rede e mostra erro', async () => {
    const {caso, chamadas} = montar({username: 'a&b=c'});
    const estado = await caso.consultar();
    assert.equal(chamadas.length, 0);
    assert.match(estado.erro, /inválido/);
});

test('fica verde quando a ofensiva terminou hoje', async () => {
    const {caso} = montar({buscar: async () => new ResumoPerfil({streak: 9, ultimoDia: HOJE})});
    const estado = await caso.consultar();
    assert.equal(estado.status, StatusLicao.FEITO);
    assert.equal(estado.streak, 9);
});

test('cancelamento devolve null', async () => {
    const {caso} = montar({buscar: async () => {
        throw new ConsultaCanceladaError();
    }});
    assert.equal(await caso.consultar(), null);
});

test('perfil não encontrado e falhas genéricas viram mensagens', async () => {
    let erro = new PerfilNaoEncontradoError();
    const {caso} = montar({hora: 21, buscar: async () => {
        throw erro;
    }});
    assert.match((await caso.consultar()).erro, /não encontrado/);
    erro = new Error('HTTP 500');
    const estado = await caso.consultar();
    assert.match(estado.erro, /Não consegui/);
    assert.equal(estado.status, StatusLicao.ATRASADO);
});

test('marcar como feito deixa verde sem nova consulta', async () => {
    const {caso, deps} = montar({username: ''});
    new MarcarComoFeito(deps).executar();
    assert.equal(caso.estadoAtual().status, StatusLicao.FEITO);
});

test('mapeador valida o JSON do Duolingo', () => {
    const r = paraResumoPerfil('{"users":[{"streak":3,"streakData":{"currentStreak":{"endDate":"2026-10-25"}}}]}');
    assert.equal(r.streak, 3);
    assert.ok(r.licaoFeitaEm(HOJE));

    assert.throws(() => paraResumoPerfil('{"users":[]}'), PerfilNaoEncontradoError);
    assert.throws(() => paraResumoPerfil('nao json'), /JSON/);

    const lixo = paraResumoPerfil('{"users":[{"streak":"<b>9</b>","streakData":{"currentStreak":{"endDate":1}}}]}');
    assert.equal(lixo.streak, null);
    assert.equal(lixo.ultimoDia, null);
});
