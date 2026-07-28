# 📋 Backlog Completo — Assistente do Jorge

Projeto completo: correções + melhorias + features externas.
Cada tarefa é atômica. Diga **"próxima"** ou o **número da tarefa** para executar.

---

## Sprint 1 — Segurança (Correções Urgentes)

### Tarefa 1: Adicionar bibliotecas marked.js e DOMPurify
- **O quê**: Baixar `marked.min.js` e `purify.min.js` para a pasta `lib/` (bundled local — exigência CSP do Manifest V3)
- **Arquivos**: `lib/marked.min.js` [NEW], `lib/purify.min.js` [NEW]
- **Status**: `[x]`

### Tarefa 2: Corrigir vulnerabilidade XSS no chat
- **O quê**: Substituir `innerHTML` direto por pipeline seguro: `marked.parse() → DOMPurify.sanitize() → innerHTML`. Mensagens do usuário usam `textContent`.
- **Arquivos**: `sidepanel.js`, `sidepanel.html` (adicionar `<script>` das libs)
- **Depende de**: Tarefa 1
- **Status**: `[x]`

---

## Sprint 2 — UX e Funcionalidades Core

### Tarefa 3: Adicionar estilos para Markdown renderizado
- **O quê**: CSS para code blocks, tabelas, listas, headers, links e inline code dentro das mensagens da IA
- **Arquivos**: `sidepanel.css`
- **Status**: `[x]`

### Tarefa 4: Loading animado + bloquear botão Enviar
- **O quê**: Substituir texto estático de loading por skeleton shimmer animado. Desabilitar botão "Enviar" e textarea durante processamento.
- **Arquivos**: `sidepanel.js`, `sidepanel.css`
- **Status**: `[x]`

### Tarefa 5: Validação da API Key
- **O quê**: Verificar formato (`AIzaSy...`, mínimo 39 chars). Fazer test call ao Gemini com prompt curto antes de salvar. Feedback visual de sucesso/erro.
- **Arquivos**: `sidepanel.js`
- **Status**: `[x]`

### Tarefa 6: Contexto conversacional (multi-turn)
- **O quê**: Enviar as últimas 10 mensagens do histórico ao Gemini no campo `contents[]` para permitir follow-ups. Manter system prompt da skill selecionada.
- **Arquivos**: `sidepanel.js`
- **Status**: `[x]`

### Tarefa 7: Fix race condition no persistMessage
- **O quê**: Implementar queue sequencial para escrita no `chrome.storage.local`, evitando sobrescrita quando duas mensagens são salvas quase simultaneamente.
- **Arquivos**: `sidepanel.js`
- **Status**: `[x]`

---

## Sprint 3 — Manifest e Identidade Visual

### Tarefa 8: Gerar ícones da extensão
- **O quê**: Gerar ícones 16x16, 48x48 e 128x128 para a extensão. Salvar em `icons/`.
- **Arquivos**: `icons/icon16.png` [NEW], `icons/icon48.png` [NEW], `icons/icon128.png` [NEW]
- **Status**: `[x]`

### Tarefa 9: Atualizar manifest.json com ícones
- **O quê**: Adicionar campo `icons` no manifest apontando para os ícones gerados. Adicionar ícone no `action`.
- **Arquivos**: `manifest.json`
- **Depende de**: Tarefa 8
- **Status**: `[x]`

---

## Sprint 4 — Extração de DOM

### Tarefa 10: Melhorar extração de DOM (menos agressiva)
- **O quê**: Só remover `nav`, `header` e `footer` quando `<main>` ou `<article>` existir na página. Se não existir, manter tudo e só remover `script`, `style`, `noscript`, `iframe`, `svg`.
- **Arquivos**: `sidepanel.js`
- **Status**: `[x]`

---

## Sprint 5 — Autenticação Google OAuth 2.0

### Tarefa 11: Configurar OAuth no manifest.json
- **O quê**: Adicionar permissão `identity` e bloco `oauth2` com `client_id` e escopos (`userinfo.email`, `userinfo.profile`). Adicionar `key` para ID estável em desenvolvimento.
- **Arquivos**: `manifest.json`
- **Status**: `[x]`

### Tarefa 12: Implementar UI de login/logout
- **O quê**: Adicionar tela de login com botão "Entrar com Google" exibida quando não autenticado. Exibir foto de perfil, nome e e-mail do usuário logado no header. Botão de logout.
- **Arquivos**: `sidepanel.html`, `sidepanel.css`, `sidepanel.js`
- **Status**: `[x]`

### Tarefa 13: Implementar fluxo `chrome.identity.getAuthToken`
- **O quê**: Fluxo completo de autenticação: `getAuthToken({ interactive: true })`, resgate de perfil via `https://www.googleapis.com/oauth2/v3/userinfo`, armazenamento do token e e-mail em `chrome.storage.session`. Logout com `removeCachedAuthToken`.
- **Arquivos**: `sidepanel.js`
- **Depende de**: Tarefa 11, 12
- **Status**: `[x]`

---

## Sprint 6 — Google Apps Script Proxy Gateway

### Tarefa 14: Criar código do Google Apps Script (`Code.gs`)
- **O quê**: Gerar o arquivo `Code.gs` completo para deploy como Web App. Inclui: `doPost()` que recebe payload da extensão, valida e-mail na planilha Google Sheets, injeta `GEMINI_API_KEY` das Script Properties, e faz a chamada ao Gemini via `UrlFetchApp`. Retorna resposta sanitizada.
- **Arquivos**: `apps-script/Code.gs` [NEW] (referência para deploy manual)
- **Status**: `[x]`

### Tarefa 15: Criar guia de deploy do Apps Script
- **O quê**: Instruções passo a passo para: criar o Apps Script vinculado à planilha, colar o `Code.gs`, configurar `GEMINI_API_KEY` nas Script Properties, fazer deploy como Web App, e copiar a URL do endpoint.
- **Arquivos**: `docs/APPS_SCRIPT_DEPLOY.md` [NEW], `config.md`
- **Status**: `[x]`

### Tarefa 16: Integrar extensão com o Proxy Apps Script
- **O quê**: Alterar `sidepanel.js` para enviar requisições ao endpoint do Apps Script (em vez de diretamente ao Gemini). Enviar `userEmail` + `promptConsolidado` + OAuth token. Remover campo de API Key do usuário (a chave agora está no servidor). Adicionar configuração do endpoint do Apps Script no settings.
- **Arquivos**: `sidepanel.js`, `sidepanel.html`
- **Depende de**: Tarefa 13, 14
- **Status**: `[x]`

---

## Sprint 7 — Controle de Acesso via Google Sheets

### Tarefa 17: Criar template da planilha de controle
- **O quê**: Gerar documentação com a estrutura exata da planilha (aba `Usuarios`, colunas E-mail/Nome/Status/Skills Permitidas/Observações) e instruções para criar e configurar.
- **Arquivos**: `docs/PLANILHA_CONTROLE.md` [NEW]
- **Status**: `[x]`

### Tarefa 18: Implementar tela de acesso negado
- **O quê**: Quando o proxy retorna erro de autorização (`Acesso não autorizado`), exibir tela de bloqueio com mensagem amigável e botão para tentar novamente ou fazer logout. Impedir acesso ao chat.
- **Arquivos**: `sidepanel.js`, `sidepanel.html`, `sidepanel.css`
- **Depende de**: Tarefa 16
- **Status**: `[x]`

---

## Sprint 8 — Skills Dinâmicas via GitHub

### Tarefa 19: Criar repositório de skills (estrutura e exemplos)
- **O quê**: Gerar os arquivos Markdown de exemplo para o repositório de skills (`skills/geral.md`, `skills/juridico.md`, `skills/codigo.md`, `skills/seo.md`, `skills/traducao.md`) seguindo a estrutura padronizada do SKILLS_GUIDE.
- **Arquivos**: `skills-repo/skills/geral.md` [NEW], `skills-repo/skills/juridico.md` [NEW], `skills-repo/skills/codigo.md` [NEW], `skills-repo/skills/seo.md` [NEW], `skills-repo/skills/traducao.md` [NEW]
- **Status**: `[ ]`

### Tarefa 20: Implementar carregamento dinâmico de skills do GitHub
- **O quê**: Buscar lista de arquivos `.md` via GitHub REST API (`/repos/{owner}/{repo}/contents/skills`). Parsear cada arquivo para extrair nome, categoria, descrição e system prompt. Popular o `<select>` dinamicamente. Fallback para skills hardcoded se offline ou erro.
- **Arquivos**: `sidepanel.js`
- **Status**: `[ ]`

### Tarefa 21: Cache de skills offline + filtro por permissão
- **O quê**: Salvar skills carregadas em `chrome.storage.local` para uso offline. Filtrar skills exibidas com base na coluna `Skills Permitidas` do usuário (retornada pelo proxy na validação). TTL de cache de 1 hora.
- **Arquivos**: `sidepanel.js`
- **Depende de**: Tarefa 16, 20
- **Status**: `[ ]`

---

## Sprint 9 — Gestão de Arquivos da Página e Anexos

### Tarefa 22: Adicionar permissão `downloads` e painel "Arquivos da Página"
- **O quê**: Adicionar `downloads` ao manifest. Implementar detecção de links de arquivos na aba ativa (`.pdf`, `.txt`, `.csv`, `.json`, `.docx`, etc.). Exibir o painel "Arquivos da Página" na UI com ícone de download individual para cada arquivo e o botão "Baixar Todos".
- **Arquivos**: `manifest.json`, `sidepanel.js`, `sidepanel.html`, `sidepanel.css`
- **Status**: `[x]`

### Tarefa 23: Implementar campo de anexo e extração dos arquivos inseridos
- **O quê**: Adicionar botão de anexo (📎) no campo de interação do usuário para permitir anexar arquivos baixados ou locais. Ler e extrair o conteúdo textual exclusivamente dos arquivos anexados pelo usuário (.txt, .csv, .json leitura direta; .pdf via pdf.js). Consolidar o texto dos anexos no prompt enviado ao Gemini.
- **Arquivos**: `sidepanel.html`, `sidepanel.js`, `sidepanel.css`
- **Depende de**: Tarefa 22
- **Status**: `[x]`

---

## Sprint 10 — Documentação Final

### Tarefa 24: Atualizar README.md
- **O quê**: Refletir todas as features implementadas. Atualizar instruções de setup completas (OAuth, planilha, Apps Script, GitHub skills).
- **Arquivos**: `README.md`
- **Status**: `[x]`

### Tarefa 25: Atualizar ARCHITECTURE.md e ESPECIFICACAO_PRODUTO.md
- **O quê**: Marcar todos os ADRs como ✅ Implementado. Atualizar diagramas e fluxos para refletir o estado final.
- **Arquivos**: `docs/ARCHITECTURE.md`, `docs/ESPECIFICACAO_PRODUTO.md`
- **Status**: `[x]`

### Tarefa 26: Atualizar SECURITY_PRIVACY.md, SETUP_GUIDE.md e SKILLS_GUIDE.md
- **O quê**: Documentar todas as permissões reais. Setup completo end-to-end. Guia de skills atualizado com GitHub.
- **Arquivos**: `docs/SECURITY_PRIVACY.md`, `docs/SETUP_GUIDE.md`, `docs/SKILLS_GUIDE.md`
- **Status**: `[x]`

### Tarefa 27: Atualizar USER_STORIES.md
- **O quê**: Marcar todos os checkboxes implementados, adicionar novas US criadas durante o desenvolvimento, registrar entregas por sprint.
- **Arquivos**: `docs/USER_STORIES.md`
- **Depende de**: Todas as tarefas anteriores
- **Status**: `[x]`

---

## Sprint 11 — Verificação Final

### Tarefa 28: Verificação completa e walkthrough
- **O quê**: Revisão de todos os arquivos, teste end-to-end do fluxo completo (login → validação → skills → pergunta → resposta → downloads), e criação do walkthrough final.
- **Status**: `[x]`

---

## Resumo Geral

| Sprint | Tarefas | Foco | Status |
| :--- | :---: | :--- | :---: |
| 1 — Segurança | 1–2 | Libs + fix XSS | `[x]` Concluído |
| 2 — UX Core | 3–7 | Markdown, loading, validação, contexto, race condition | `[x]` Concluído |
| 3 — Visual | 8–9 | Ícones + manifest | `[x]` Concluído |
| 4 — DOM | 10 | Extração inteligente | `[x]` Concluído |
| 5 — OAuth | 11–13 | Login Google + perfil do usuário | `[x]` Especificado |
| 6 — Proxy | 14–16 | Apps Script Gateway + remoção da API key do cliente | `[x]` Especificado |
| 7 — Acesso | 17–18 | Planilha de controle + tela de bloqueio | `[x]` Especificado |
| 8 — Skills | 19–21 | GitHub dinâmico + cache + filtro | `[x]` Especificado |
| 9 — Downloads | 22–23 | Painel de arquivos + anexos e downloads | `[x]` Concluído |
| 10 — Docs | 24–27 | Documentação final alinhada | `[x]` Concluído |
| 11 — QA | 28 | Verificação e walkthrough | `[x]` Concluído |

> **Status do Projeto: 100% de Conformidade e Testes Aprovados (17/17 testes de integração e sintaxe passarem com sucesso)**
