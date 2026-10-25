UUID := lembrete-duolingo@joaosantos
SRC  := .
DIST := dist

.PHONY: pack install enable uninstall clean test

## Gera dist/lembrete-duolingo@joaosantos.shell-extension.zip (já compila o schema)
pack:
	@mkdir -p $(DIST)
	gnome-extensions pack $(SRC) \
		--extra-source=icons \
		--extra-source=src \
		--out-dir=$(DIST) --force

## Instala para o usuário atual
install: pack
	gnome-extensions install --force $(DIST)/$(UUID).shell-extension.zip
	@echo "Instalado. Saia da sessão e entre de novo, depois rode: make enable"

enable:
	gnome-extensions enable $(UUID)

uninstall:
	gnome-extensions uninstall $(UUID)

## Testes unitários das camadas de domínio e aplicação (JS puro, roda no Node)
test:
	node --test 'tests/*.test.js'

clean:
	rm -rf $(DIST)
