import {test} from 'node:test';
import assert from 'node:assert/strict';

import {Username, UsernameInvalidoError} from '../src/domain/username.js';
import {DataLocal} from '../src/domain/dataLocal.js';
import {ResumoPerfil} from '../src/domain/perfil.js';
import {avaliarStatus, StatusLicao} from '../src/domain/lembrete.js';

test('Username aceita formato válido e rejeita o resto', () => {
    assert.equal(new Username('joao_santos.1-x').valor, 'joao_santos.1-x');
    for (const ruim of ['', 'a b', 'a&fields=x', 'ã', '../x/y', 'a'.repeat(65), null, 42])
        assert.throws(() => new Username(ruim), UsernameInvalidoError, String(ruim));
});

test('DataLocal só aceita AAAA-MM-DD', () => {
    assert.equal(DataLocal.tentar('2026-10-25').iso, '2026-10-25');
    assert.equal(DataLocal.tentar('25/10/2026'), null);
    assert.equal(DataLocal.tentar({}), null);
});

test('ResumoPerfil descarta streak que não é inteiro razoável', () => {
    assert.equal(new ResumoPerfil({streak: 7}).streak, 7);
    for (const ruim of ['7', -1, 1.5, 1e9, {}, null])
        assert.equal(new ResumoPerfil({streak: ruim}).streak, null);
});

test('ResumoPerfil sabe se a lição foi feita no dia', () => {
    const hoje = new DataLocal('2026-10-25');
    assert.ok(new ResumoPerfil({streak: 1, ultimoDia: hoje}).licaoFeitaEm(hoje));
    assert.ok(!new ResumoPerfil({streak: 1, ultimoDia: new DataLocal('2026-10-24')}).licaoFeitaEm(hoje));
});

test('avaliarStatus aplica a regra de cores', () => {
    assert.equal(avaliarStatus({feito: true, horaAtual: 23, horaAlerta: 20}), StatusLicao.FEITO);
    assert.equal(avaliarStatus({feito: false, horaAtual: 20, horaAlerta: 20}), StatusLicao.ATRASADO);
    assert.equal(avaliarStatus({feito: false, horaAtual: 19, horaAlerta: 20}), StatusLicao.PENDENTE);
    assert.equal(avaliarStatus({feito: false, horaAtual: 21, horaAlerta: 99}), StatusLicao.ATRASADO);
});
