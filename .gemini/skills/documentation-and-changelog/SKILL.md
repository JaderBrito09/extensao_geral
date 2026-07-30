---
name: documentation-and-changelog
description: Gerencia e atualiza a documentação técnica (docs/), o histórico de alterações (CHANGELOG.md), as User Stories e o README do projeto Assistente Jorge.
---

# Gestão de Documentação e Changelog — Assistente do Jorge

Esta skill mantém a documentação do projeto sincronizada com as novas funcionalidades, correções e versões lançadas.

---

## 📋 Responsabilidades e Automações

1. **Atualização do `CHANGELOG.md`**:
   - Ao lançar uma nova versão, incluir o bloco no topo do arquivo com a data, número da versão e resumo das alterações (Adicionado, Alterado, Corrigido).

2. **Validar Links Relativos de Documentação**:
   - Garantir que todos os arquivos Markdown apontem para links relativos simples do GitHub (ex: `docs/MANUAL_DO_USUARIO.md`) e NUNCA para arquivos locais (`file:///...`).

3. **Arquivos Sensíveis Privados**:
   - Garantir que `SETUP_E_INFRAESTRUTURA.md` permaneça apenas em ambiente local e anotado no `.gitignore`.
