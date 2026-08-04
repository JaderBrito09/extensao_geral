# 📋 Gestão de Produto: Backlog de Sprints & User Stories

Este documento reúne o planejamento de entregas do **Assistente do Jorge**, incluindo as **Histórias de Usuário (User Stories)** e o **Quadro de Tarefas das Sprints 1 a 12**.

---

## 🏃 Histórias de Usuário (User Stories)

### 🔹 US-01: Autenticação via Conta Google
* **Como** usuário colaborador,
* **Quero** realizar login com minha Conta Google no painel lateral da extensão,
* **Para que** eu possa acessar minhas permissões e utilizar o assistente de forma segura.
* **Critérios de Aceite**:
  - Exibir botão "Entrar com Google" no Side Panel se o usuário não estiver autenticado.
  - Executar `chrome.identity.getAuthToken({ interactive: true })`.
  - Resgatar foto de perfil e e-mail do usuário logado.
  - Disponibilizar opção de Logout no cabeçalho.

### 🔹 US-02: Validação de Acesso na Planilha Google Sheets
* **Como** administrador do sistema,
* **Quero** controlar o acesso dos usuários ativando ou inativando e-mails em uma planilha Google,
* **Para que** somente pessoas autorizadas acessem o Assistente do Jorge.
* **Critérios de Aceite**:
  - O Proxy em Apps Script faz a busca do e-mail na aba `Usuarios`.
  - Se o e-mail não existir ou estiver `INATIVO`, exibir tela de acesso negado.
  - Se o e-mail estiver `ATIVO`, retornar a lista de `allowedSkills` e liberar a interface do chat.

### 🔹 US-03: Carregamento Dinâmico de Skills do GitHub
* **Como** usuário ativado,
* **Quero** visualizar a lista de habilidades analíticas disponíveis no menu suspenso (select),
* **Para que** eu possa escolher a instrução correta para a minha tarefa atual.
* **Critérios de Aceite**:
  - A extensão busca o catálogo `skills.json` no repositório exclusivo do GitHub.
  - Filtrar skills com base na coluna `Skills Permitidas` do usuário (`ALL`, `SKILL-ID`, `CAT:Nome`).
  - Preencher dinamicamente o `<select id="task-select">`.
  - Salvar cache em `chrome.storage.local` para suporte offline (TTL 1 hora).

### 🔹 US-04: Captura Sanitizada da Página Web
* **Como** usuário pesquisando uma página,
* **Quero** que a extensão extraia automaticamente o texto relevante da aba ativa,
* **Para que** o Gemini responda à minha pergunta com contexto completo da página.
* **Critérios de Aceite**:
  - Injetar script via `chrome.scripting.executeScript` na aba ativa.
  - Remover tags ruidosas (`script`, `style`, `nav`, `footer`, `iframe`, `svg`).
  - Limitar o tamanho do texto capturado (`MAX_PAGE_CHARS = 30000`).

### 🔹 US-05: Download Automático & Leitura de Documentos
* **Como** usuário analisando uma página com anexos,
* **Quero** que a extensão baixe e leia os documentos da página (.pdf, .txt, .csv, .json),
* **Para que** a resposta da IA inclua dados dos arquivos vinculados.
* **Critérios de Aceite**:
  - Detectar links de download na aba ativa.
  - Baixar arquivos para a máquina do usuário via `chrome.downloads.download()`.
  - Extrator em JS para ler o conteúdo textual dos arquivos anexados.
  - Consolidar prompt final e enviar para o Proxy Apps Script.

### 🔹 US-06: Processamento Avançado de Documentos e Leitura via OCR
* **Como** usuário anexando documentos à conversa,
* **Quero** que arquivos PDF sejam processados por um serviço de OCR externo e que arquivos `.docx` tenham suporte nativo de leitura,
* **Para que** eu possa enviar PDFs digitalizados/escaneados ou documentos Word com extração completa e precisa de dados para a IA.
* **Critérios de Aceite**:
  - Aceitar arquivos através dos 4 caminhos de anexo (Botão 📎, Drag & Drop, Links e Action Cards).
  - Identificar arquivos `.pdf` e enviá-los via requisição API para o serviço externo de OCR, recebendo o conteúdo tratado em formato JSON.
  - Manter a leitura direta via API em JS (`FileReader`) para arquivos de texto puro (`.txt`, `.csv`, `.json`, `.md`).
  - Implementar parser nativo para extração de texto de arquivos Microsoft Word (`.docx`).
  - Manter o fluxo atual de Armazenamento Temporário na UI (Chips de anexo) e Injeção de Contexto em tags XML (`<ARQUIVOS_ANEXADOS_PELO_USUARIO>`) no prompt do Gemini.

### 🔹 US-07: Migração do Controle de Acesso e Permissões de Skills para o Supabase
* **Como** administrador do sistema,
* **Quero** gerenciar usuários e permissões de skills através de um banco de dados moderno (Supabase) com Painel Web Admin,
* **Para que** as validações de login e carregamento de skills permitidas sejam instantâneas, sem latência e sem erros causados pela planilha do Google Sheets.
* **Critérios de Aceite**:
  - Tabela `users` no Supabase armazenando `email`, `status` (`ACTIVE`/`INACTIVE`), e `allowed_skills` (array de IDs).
  - Substituição da consulta à planilha por chamada à REST API / Client do Supabase (com RLS - Row Level Security).
  - Validação ultra-rápida de acesso no momento do login e atualização em tempo real de permissões.
  - Painel Web Admin (ou interface do Supabase) para cadastro simples com seleção de checkboxes das skills liberadas.

---

## 📅 Quadro de Acompanhamento de Sprints (1 a 14)

### Sprint 1 — Fundação do Projeto e Estrutura MV3
- `[x]` Tarefa 1: Criar arquivo `manifest.json` com Manifest V3
- `[x]` Tarefa 2: Criar arquivo `sidepanel.html` para a interface
- `[x]` Tarefa 3: Criar arquivo `sidepanel.css` com layout escuro e moderno

### Sprint 2 — Markdown & Sanitização XSS
- `[x]` Tarefa 4: Integrar biblioteca Marked.js para renderizar respostas da IA
- `[x]` Tarefa 5: Integrar biblioteca DOMPurify para sanitizar HTML
- `[x]` Tarefa 6: Criar suíte de testes automatizados unitários

### Sprint 3 — Autenticação Google OAuth 2.0
- `[x]` Tarefa 7: Configurar OAuth no `manifest.json`
- `[x]` Tarefa 8: Implementar botão de login no `sidepanel.js`
- `[x]` Tarefa 9: Salvar sessão do usuário logado

### Sprint 4 — Extração de DOM Sanitizada da Aba Ativa
- `[x]` Tarefa 10: Script de extração de texto limpo com foco em `<main>` e `<article>`

### Sprint 5 — Histórico de Conversas Retomáveis
- `[x]` Tarefa 11: Gerenciamento de sessões salvas em `chrome.storage.local`

### Sprint 6 — Proxy Gateway no Google Apps Script
- `[x]` Tarefa 12: Criar o script `apps-script/Code.gs`
- `[x]` Tarefa 13: Configurar validação de e-mail na Planilha Google Sheets
- `[x]` Tarefa 14: Integrar chamada da API do Gemini (`gemini-2.5-flash`) no proxy

### Sprint 7 — Validação de Permissão e Bloqueio de Acesso
- `[x]` Tarefa 15: Criar guia de deploy do Apps Script
- `[x]` Tarefa 16: Conectar extensão ao Web App Proxy
- `[x]` Tarefa 17: Criar documentação da planilha de controle
- `[x]` Tarefa 18: Tela de Acesso Negado para e-mails inativos

### Sprint 8 — Skills Dinâmicas via GitHub
- `[x]` Tarefa 19: Criar repositório e arquivo `skills-repo/skills/geral.md`
- `[x]` Tarefa 20: Implementar carregamento dinâmico via `skills.json`
- `[x]` Tarefa 21: Cache offline de skills com TTL de 1 hora e filtro de permissões

### Sprint 9 — Gestão de Anexos & Arquivos
- `[x]` Tarefa 22: Detecção de arquivos da página e leitor de anexos do usuário
- `[x]` Tarefa 23: Popover de anexos estilo Gemini (Upload, Drive, Link)

### Sprint 10 — Reformulação de Interface & UX
- `[x]` Tarefa 24: Limpeza do cabeçalho, botão de logout topo, select dinâmico sem mocks

### Sprint 11 — Suíte de Testes & Refatoração Estrutural
- `[x]` Tarefa 25: Reorganizar estrutura de arquivos em `docs/`, `tests/` e `credentials/`
- `[x]` Tarefa 26: 17 Testes de integração automatizados com 100% de aprovação

### Sprint 12 — Preparação para Deploy na Chrome Web Store
- `[x]` Tarefa 27: Gerar pacote compactado `.zip` (`assistente-jorge-extension-v1.2.1.zip`) para submissão
- `[x]` Tarefa 28: Validação final de escopos no GCP Console (`identity`, `storage`, `tabs`, `scripting`, `sidePanel`, `downloads`)
- `[x]` Tarefa 29: Captura de screenshots oficiais e elaboração de texto da loja

### Sprint 13 — OCR de PDFs & Parser de Documentos Word (.docx)
- `[ ]` Tarefa 30: Implementar chamada de API no `sidepanel.js` para envio de PDFs ao serviço externo de OCR e tratamento do retorno em JSON.
- `[ ]` Tarefa 31: Integrar leitor nativo de arquivos `.docx` (extração de texto via `JSZip` / XML `word/document.xml`).
- `[ ]` Tarefa 32: Preservar leitura direta de arquivos de texto puro (`.txt`, `.csv`, `.json`, `.md`) via `FileReader`.
- `[ ]` Tarefa 33: Integrar pipeline de OCR ao fluxo de renderização de anexos (Chips na UI) e montagem do prompt XML (`<ARQUIVOS_ANEXADOS_PELO_USUARIO>`).

### Sprint 14 — Migração de Controle de Acessos e Skills para o Supabase
- `[ ]` Tarefa 34: Criar projeto no Supabase e estruturar a tabela `user_permissions` (`email` PRIMARY KEY, `status`, `allowed_skills` text[], `created_at`).
- `[ ]` Tarefa 35: Configurar políticas de segurança (RLS - Row Level Security) para consulta pública das permissões via `anon_key` com escopo apenas de leitura.
- `[ ]` Tarefa 36: Integrar cliente Supabase REST / SDK no `sidepanel.js` substituindo a verificação legada na planilha Google Sheets.
- `[ ]` Tarefa 37: Atualizar lógica de filtragem de skills permitidas para ler o array `allowed_skills` retornado diretamente do Supabase.
- `[ ]` Tarefa 38: Atualizar documentações (`ARQUITETURA_E_ESPECIFICACAO.md`, `MANUAL_DO_USUARIO.md` e `POLITICA_DE_PRIVACIDADE.md`) refletindo a mudança de controle da planilha para o Supabase.

### Sprint 15 — Revisões de Código, Correções de Proxy, PDF e Sincronização v7
- `[x]` Tarefa 39 (Bloqueante): Impedir a sobrescrita indevida do endpoint do proxy na v7 com `Object.freeze` e fallback seguro para a URL oficial em `sidepanel.js`.
- `[x]` Tarefa 40 (Bloqueante): Implementar suporte a descompactação `FlateDecode` para PDFs comprimidos e tratamento de exceção sem erros não capturados.
- `[x]` Tarefa 41 (Bloqueante): Garantir validação obrigatória e sem bypass da coluna de skills no Apps Script (`Code.gs`) retornando 403 `ACESSO_NEGADO`.
- `[x]` Tarefa 42: Resolver conflito de interface entre Popup e Sidepanel isolando listeners por `target` em toda a extensão.
- `[x]` Tarefa 43: Adicionar `StorageLockManager` para evitar race conditions no storage e padronizar o envio de mensagens via iframe com helpers `JORGE_*`.
- `[x]` Tarefa 44: Aplicar nits de código da revisão `t_bc8f044c` e manter a suíte de testes com 55 verificações aprovadas.

