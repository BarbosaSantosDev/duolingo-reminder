# 🦉 Lembrete Duolingo

Extensão para o **GNOME Shell** que coloca uma corujinha no painel superior para você não esquecer da lição diária do Duolingo.

| Cor | Significado |
|---|---|
| 🟡 Amarela | Lição de hoje ainda pendente |
| 🔴 Vermelha | Já passou do horário de alerta e você não fez a lição |
| 🟢 Verde | Lição de hoje feita |

Clicando na coruja você tem:

- **Abrir o Duolingo** no navegador
- **Marcar como feito hoje** (modo manual)
- **Verificar agora**
- **Configurações**

> ⚠️ Projeto pessoal e **não oficial**, sem nenhuma afiliação com o Duolingo. O ícone é uma coruja original, não o mascote da marca.

## Como funciona

A extensão tem dois modos:

- **Manual (padrão):** você clica em *Marcar como feito hoje* e a coruja fica verde até a meia-noite.
- **Automático:** você informa seu **nome de usuário** do Duolingo nas configurações e a extensão consulta o seu perfil público periodicamente. Ela mostra sua ofensiva (🔥 streak) ao lado da coruja e fica verde sozinha quando a lição do dia conta.

O modo automático usa um endpoint **não documentado** do site do Duolingo (o mesmo que o site usa para carregar perfis). Ele pode mudar ou parar de funcionar sem aviso. Se isso acontecer, o modo manual continua funcionando.

**Nunca é pedida senha.** Só o nome de usuário, que é público.

## Requisitos

- GNOME Shell **45 a 50** (Fedora 39+, Ubuntu 23.10+, Arch etc.)
- `gnome-extensions` (já vem com o GNOME)
- Node.js 18+ — **só** para rodar os testes; a extensão não precisa dele

## Instalação

```bash
git clone https://github.com/BarbosaSantosDev/duolingo-reminder.git
cd duolingo-reminder
make install
```

Depois **saia da sessão e entre de novo** (no Wayland o GNOME só carrega extensões novas no login) e ative:

```bash
make enable
```

### Sem `make`

```bash
gnome-extensions pack . \
  --extra-source=icons \
  --extra-source=src \
  --out-dir=dist --force
gnome-extensions install --force dist/lembrete-duolingo@joaosantos.shell-extension.zip
# saia e entre na sessão
gnome-extensions enable lembrete-duolingo@joaosantos
```

## Configuração

Abra pelo menu da coruja → **Configurações**, pelo app **Extensões**, ou:

```bash
gnome-extensions prefs lembrete-duolingo@joaosantos
```

| Opção | Padrão | Descrição |
|---|---|---|
| Usuário | *(vazio)* | Seu usuário do Duolingo (o que aparece em `duolingo.com/profile/<usuario>`). Vazio = só modo manual |
| Hora do alerta | `20` | A partir desta hora a coruja fica vermelha |
| Verificar a cada | `15` min | Intervalo entre as consultas |

Seu perfil precisa estar **público** para o modo automático funcionar. Para testar se o seu usuário é encontrado:

```bash
curl -s "https://www.duolingo.com/2017-06-30/users?username=SEU_USUARIO&fields=users%7Bstreak,streakData%7BcurrentStreak%7D%7D"
```

A resposta esperada é algo como `{"users":[{"streak":7,"streakData":{"currentStreak":{"endDate":"2026-10-24", ...}}}]}`. A coruja fica verde quando `endDate` é a data de hoje.

## Estrutura

A raiz do repositório é a própria extensão; a pasta com o UUID (`lembrete-duolingo@joaosantos`) só é criada pelo `gnome-extensions install`.

O código segue **DDD** com **arquitetura limpa**: as dependências apontam sempre para dentro (apresentação/infraestrutura → aplicação → domínio). O domínio e a aplicação são JavaScript puro, sem `gi://`, e por isso são testáveis fora do GNOME Shell.

```
duolingo-reminder/
├── metadata.json            # identidade da extensão (uuid, versões do GNOME suportadas)
├── extension.js             # composition root: monta as camadas, timers e sinais
├── prefs.js                 # janela de configurações (libadwaita)
├── stylesheet.css           # cores de cada estado
├── icons/
│   └── coruja-symbolic.svg
├── schemas/
│   └── org.gnome.shell.extensions.lembrete-duolingo.gschema.xml
├── src/
│   ├── domain/              # regras de negócio, sem dependências externas
│   │   ├── username.js      #   value object com validação do nome de usuário
│   │   ├── dataLocal.js     #   value object de data AAAA-MM-DD
│   │   ├── perfil.js        #   ResumoPerfil (ofensiva + último dia)
│   │   └── lembrete.js      #   StatusLicao, regra das cores, EstadoLembrete
│   ├── application/         # casos de uso e portas (contratos)
│   │   ├── portas.js
│   │   ├── verificarLicaoDoDia.js
│   │   └── marcarComoFeito.js
│   ├── infrastructure/      # adaptadores que implementam as portas
│   │   ├── duolingo/
│   │   │   ├── duolingoPerfilGateway.js  # HTTP (libsoup 3)
│   │   │   └── mapeadorPerfil.js         # camada anticorrupção JSON → domínio
│   │   ├── arquivoRegistroManual.js
│   │   ├── configuracoesGSettings.js
│   │   ├── relogioGLib.js
│   │   └── loggerConsole.js
│   └── presentation/
│       └── indicador.js     # ícone e menu no painel
└── tests/                   # testes unitários (make test)
```

O estado do modo manual fica salvo em `~/.local/state/lembrete-duolingo/feito-em` (diretório `0700`, arquivo `0600`).

## Segurança

- Só o nome de usuário público é usado; ele é validado (`[A-Za-z0-9._-]`, até 64 caracteres) antes de qualquer requisição.
- A consulta vai apenas para `https://www.duolingo.com`, sem seguir redirecionamentos, e se identifica com um User-Agent próprio.
- A resposta precisa ser `application/json` e é limitada a 64 KiB; cada campo é validado antes de chegar à interface.
- As consultas têm debounce enquanto você digita o usuário e uma nova consulta cancela a anterior.

## Desenvolvimento

| Comando | O que faz |
|---|---|
| `make test` | Testes unitários do domínio, da aplicação e do mapeador de JSON |
| `make pack` | Gera `dist/lembrete-duolingo@joaosantos.shell-extension.zip` |
| `make install` | Empacota e instala para o usuário atual |
| `make enable` | Ativa a extensão (depois de sair e entrar na sessão) |
| `make clean` | Apaga `dist/` |

Só `extension.js`, `prefs.js`, `metadata.json`, `stylesheet.css`, `schemas/`, `icons/` e `src/` entram no pacote; `tests/`, `Makefile` e este README ficam de fora.

## Problemas

Mensagens que podem aparecer no menu da coruja:

| Mensagem | Causa provável |
|---|---|
| Nome de usuário inválido | O usuário tem caracteres fora de `[A-Za-z0-9._-]` ou mais de 64 caracteres |
| Usuário não encontrado (o perfil é público?) | Usuário digitado errado ou perfil privado |
| Não consegui consultar o Duolingo | Sem internet, ou o endpoint não oficial mudou — o modo manual continua funcionando |

Ver os logs da extensão:

```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i duolingo
```

## Desinstalar

```bash
make uninstall
# ou
gnome-extensions uninstall lembrete-duolingo@joaosantos
```

## Licença

[GPL-2.0-or-later](LICENSE)
