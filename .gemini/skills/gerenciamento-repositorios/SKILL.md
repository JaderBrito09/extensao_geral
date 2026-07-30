---
name: gerenciamento-repositorios
description: Diretrizes, automações e políticas de versionamento Git/GitHub para criar, atualizar e comitar código nos repositórios do projeto Assistente Jorge (extensao_geral e assistente-jorge-skills).
---

# Diretrizes e Automações de Versionamento no GitHub - Assistente Jorge

Esta skill orienta e executa a criação, atualização e gerenciamento dos repositórios do projeto no GitHub, garantindo conformidade com padrões de commit, segurança de credenciais e integridade das builds.

---

## 🚀 Fluxo de Execução Automática (Quando a skill for chamada com 'execute')

Ao ser acionada para comitar ou sincronizar o repositório, o assistente DEVE executar obrigatoriamente a seguinte sequência de ações:

### Etapa 1: Validação de Segurança & Testes
1. Rodar os testes de regressão automatizados:
   ```bash
   node tests/test.js
   ```
   *Se algum teste falhar, o commit DEVE ser interrompido até que os erros sejam corrigidos.*

2. Inspecionar os arquivos modificados e pendentes:
   ```bash
   git status
   ```
   *Garantir que nenhum arquivo proibido (credenciais, `.env`, `.DS_Store`, `.zip`, `SETUP_E_INFRAESTRUTURA.md`) esteja staged.*

### Etapa 2: Estagiamento e Padrão de Commit
1. Adicionar arquivos modificados respeitando as regras do repositório:
   ```bash
   git add .
   ```
2. Gerar mensagem de commit formatada conforme a convenção **Conventional Commits**:
   - `feat:` Nova funcionalidade na extensão ou em skills.
   - `fix:` Correção de bug em scripts, layouts ou integrações.
   - `docs:` Alterações em documentações (`README.md`, `MANUAL_DO_USUARIO.md`, etc.).
   - `style:` Ajustes visuais em CSS ou HTML sem alterar lógica.
   - `refactor:` Melhoria de código sem alterar comportamento.
   - `chore:` Atualizações de configurações, `.gitignore` ou dependências.

   *Exemplo:*
   ```bash
   git commit -m "feat(sidepanel): adiciona suporte a novos tipos de anexos e suporte a a11y"
   ```

### Etapa 3: Sincronização com o GitHub
1. Verificar se o remoto está configurado (`git remote -v`). Se o repositório for novo, adicionar o remote:
   ```bash
   git remote add origin https://github.com/JaderBrito09/<nome-do-repositorio>.git
   ```
2. Enviar as alterações para o repositório remoto:
   ```bash
   git push origin main
   ```

---

## 📂 Escopo dos Repositórios

### 1. Repositório da Extensão Chrome (`extensao_geral`)
**URL:** `https://github.com/JaderBrito09/extensao_geral`  
**Objetivo:** Código-fonte da extensão Chrome, backend de integração e documentação.

#### ✅ O que DEVE ser comitado:
- **Código da Extensão:** `manifest.json`, `background.js`, `content.js`, `popup.*`, `sidepanel.*`.
- **Bibliotecas auxiliares:** `lib/marked.min.js`, `lib/purify.min.js`.
- **Ativos de Imagem:** `icons/` (`icon16.png`, `icon48.png`, `icon128.png`, `icon512.png`).
- **Backend Apps Script:** `apps-script/Code.gs`.
- **Testes & Docs:** `tests/test.js`, `README.md`, `docs/`.
- **Configurações:** `.gitignore`, `.gemini/`.

#### ❌ O que NÃO deve ser comitado:
- Credenciais e Chaves de API (`credentials/`, `client_secret_*.json`, `.env`, `*.pem`).
- Documentação de Infraestrutura Sensível (`docs/SETUP_E_INFRAESTRUTURA.md`).
- Pacotes de Distribuição `.zip` (devem ser publicados apenas em Releases no GitHub).
- Pastas `node_modules/`, `.DS_Store`, `.vscode/`, `*.log`, capturas de tela soltas na raiz.

---

### 2. Repositório de Skills em Produção (`assistente-jorge-skills`)
**URL:** `https://github.com/JaderBrito09/assistente-jorge-skills`  
**Objetivo:** Manter o catálogo e repositório oficial de Habilidades (Skills) em produção.

#### ✅ O que DEVE ser comitado:
- **Manifesto de Skills:** `skills.json` (índice com metadados e versões).
- **Estrutura de cada Skill:** `skills/<nome-da-skill>/SKILL.md`, `references/` e `scripts/`.

#### ❌ O que NÃO deve ser comitado:
- Código-fonte da extensão Chrome, credenciais, arquivos compilados ou `.DS_Store`.

---

## 🛡️ Checklist de Segurança de Pré-Commit

- [ ] Suíte de testes (`node tests/test.js`) executou e passou 100%.
- [ ] O `git status` foi verificado para impedir inclusão acidental de credenciais.
- [ ] O `.gitignore` contém regras para bloqueio de `.env`, `credentials/`, `SETUP_E_INFRAESTRUTURA.md` e `.zip`.
- [ ] Mensagem de commit atende ao padrão Conventional Commits.
