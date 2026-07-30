---
name: gerenciamento-repositorios
description: Diretrizes e políticas de versionamento para os repositórios GitHub do projeto Assistente Jorge (extensao_geral e assistente-jorge-skills).
---

# Diretrizes de Versionamento no GitHub - Assistente Jorge

Este documento estabelece as regras de o que deve e não deve ser comitado e enviado para cada repositório do projeto no GitHub.

---

## 1. Repositório da Extensão Chrome (`extensao_geral`)
**URL:** `https://github.com/JaderBrito09/extensao_geral`  
**Objetivo:** Manter o código-fonte completo da extensão Chrome, backend de integração e documentação técnica.

### ✅ O que DEVE ser gravado neste repositório:
- **Código-fonte da Extensão Chrome:** `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`, `sidepanel.html`, `sidepanel.js`, `sidepanel.css`.
- **Bibliotecas auxiliares:** `lib/marked.min.js`, `lib/purify.min.js`.
- **Recursos visuais da extensão:** `icons/` (`icon16.png`, `icon48.png`, `icon128.png`, `icon512.png`).
- **Backend & Integrações:** `apps-script/Code.gs` (código de integração com Google Sheets/Drive).
- **Testes automatizados:** `tests/package.json`, `tests/package-lock.json`, `tests/test.js`.
- **Documentação técnica:** `README.md`, `docs/` (`MANUAL_DO_USUARIO.md`, `ARQUITETURA_E_ESPECIFICACAO.md`, `GUIA_PUBLICACAO_CHROME_STORE.md`, `POLITICA_DE_PRIVACIDADE.md`, etc.).
- **Configurações do Git & Projetos:** `.gitignore`, `.gemini/`.

### ❌ O que NÃO deve ser gravado neste repositório:
- **Credenciais e Chaves de API:** Pasta `credentials/`, arquivos `client_secret_*.json`, `.env`, `env.json`, `*.pem`, `*.key`.
- **Pacotes de Distribuição (Builds):** Arquivos `.zip` (ex: `assistente-jorge-extension-v1.0.0.zip`). Devem ser publicados apenas nas *Releases* do GitHub.
- **Dependências instaladas:** Qualquer pasta `node_modules/` (como `tests/node_modules/`).
- **Arquivos temporários do SO e IDEs:** `.DS_Store`, `.vscode/`, `.idea/`, `*.log`.
- **Imagens temporárias avulsas:** Screenshots e capturas de tela soltas na raiz (ex: `Captura de Tela*.png`).

---

## 2. Repositório de Skills em Produção (`assistente-jorge-skills`)
**URL:** `https://github.com/JaderBrito09/assistente-jorge-skills`  
**Objetivo:** Manter o catálogo e repositório oficial de Habilidades (Skills) consumidas pela extensão em ambiente de produção.

### ✅ O que DEVE ser gravado neste repositório:
- **Manifesto de Skills:** `skills.json` (índice com metadados e versões das skills disponíveis).
- **Estrutura de cada Skill:** 
  - `skills/<nome-da-skill>/SKILL.md` (instruções e prompt da skill).
  - `skills/<nome-da-skill>/references/` (manuais, portarias, tabelas de referência e imagens usadas no conhecimento da skill).
  - `skills/<nome-da-skill>/scripts/` (scripts auxiliares executados pela skill, se houver).

### ❌ O que NÃO deve ser gravado neste repositório:
- Código da Extensão Chrome (`manifest.json`, `popup.*`, `sidepanel.*`, etc.).
- Credenciais ou dados confidenciais.
- Arquivos compilados ou `.DS_Store`.

---

## 🛡️ Checklist de Segurança e Boas Práticas Antes do Commit

1. **Verificar o `git status`**: Garanta que nenhum arquivo indesejado ou credencial esteja como *untracked* ou *staged*.
2. **Atualizar o `.gitignore`**: Caso um novo tipo de arquivo temporário ou credencial seja adicionado ao projeto, inclua a regra no `.gitignore` imediatamente.
3. **Remoção de credenciais rastreadas**: Se um arquivo sensível for acidentalmente rastreado, utilize `git rm --cached <arquivo>` e commit para removê-lo do rastreamento sem apagar a cópia local.
