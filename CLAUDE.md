# Lembrete Duolingo — extensão GNOME Shell
Coruja no painel do GNOME 45–50 que lembra da lição diária do Duolingo; roda dentro do processo gnome-shell do usuário (sem servidor/VPS); "deploy" = `make install` local, distribuição via GitHub (sem CI — TODO).

## Estrutura
- Ponto de entrada / composition root: `extension.js` (monta camadas, timers, sinais GSettings)
- Preferências: `prefs.js` (libadwaita) · Config: `schemas/*.gschema.xml` (username, hora-alerta, intervalo-min)
- DDD + arquitetura limpa em `src/`, dependências só para dentro:
  - `domain/` regras puras (Username, DataLocal, ResumoPerfil, avaliarStatus) — sem `gi://`
  - `application/` casos de uso (`verificarLicaoDoDia.js`, `marcarComoFeito.js`) e portas (`portas.js`)
  - `infrastructure/` adaptadores: HTTP Soup (`duolingo/duolingoPerfilGateway.js`), JSON→domínio (`duolingo/mapeadorPerfil.js`), arquivo, GSettings, relógio, log
  - `presentation/indicador.js` só renderiza `EstadoLembrete` e repassa cliques
- Testes: `make test` (= `node --test 'tests/*.test.js'`, Node 18+); evals: não há
- Empacotar: `make pack` → `dist/`; novo diretório em `src/` exige `--extra-source` no Makefile

## Regras de negócio
- Verde se feito hoje (manual OU `currentStreak.endDate` == hoje); vermelho se hora ≥ hora-alerta; senão amarelo
- Modo manual grava `~/.local/state/lembrete-duolingo/feito-em` (AAAA-MM-DD)
- Só usuário público; nunca pedir senha. Username válido: `[A-Za-z0-9._-]{1,64}`

## Cuidados
- Integração externa: endpoint NÃO oficial `https://www.duolingo.com/2017-06-30/users` — pode quebrar sem aviso
- Variáveis de ambiente: nenhuma; config fica no GSettings
- Segurança já implementada, não regredir: sem redirect, resposta ≤ 64 KiB e `application/json`, campos validados no mapeador, arquivo 0600/dir 0700, debounce de 1,5 s + cancelamento da consulta anterior
- `domain/` e `application/` não podem importar `gi://` (quebra os testes no Node)
- `disable()` precisa remover todo timer/sinal/sessão criado em `enable()` (regra da revisão do extensions.gnome.org)
- Código em ES modules do GJS; `resource:///org/gnome/shell/...` só existe dentro do Shell

## Ao trabalhar aqui
- Comece pelos caminhos de "Estrutura"; não explore o repo inteiro.
- Rode só os testes do que mudou. Logs sempre com limite: `journalctl -o cat /usr/bin/gnome-shell -n 100 | grep -i duolingo`.
- `make install`/`enable` mexe na sessão GNOME real do usuário: só com confirmação do João.
- Branch feat/ ou fix/, nunca na main. Nunca exibir segredos.
