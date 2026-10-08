# 📋 Gestão de Produto: Backlog de Sprints & User Stories

| Versão | Data | Autor | Descrição da Alteração |
| :--- | :--- | :--- | :--- |
| **v1.0** | 28/07/2026 | Jader Brito | Estruturação inicial do backlog e histórias de usuário (Sprints 1 a 12). |
| **v2.0** | 04/08/2026 | Jader Brito | Adição das Sprints 13 a 15 (OCR, Supabase e consolidação v7). |
| **v2.1** | 11/08/2026 | Jader Brito | Adição das Sprints 16 e 17 (Google Docs/Sheets, TXT formatado e remediações de segurança v8). |
| **v2.2** | 18/08/2026 | Jader Brito | Registro da US-10 e Sprint 18 (Bugfix da captura indevida de botões de relatório e restauração do filtro preciso de anexos). |
| **v2.3** | 29/09/2026 | Jader Brito | Registro da US-11 e Sprint 19 (Restauração de Permissões MV3: activeTab e host_permissions globais para injeção e leitura de páginas externas no Side Panel). |
| **v2.4** | 30/09/2026 | Jader Brito | Registro da US-15 e Sprint 21 (v9.3.5: Parser nativo de prompts interativos/cards e resiliência de e-mail/sessão no payload). |
| **v2.5** | 08/10/2026 | Jader Brito | Registro da US-16 e Sprint 22 (v9.3.6: Execução dinâmica de contexto de boas-vindas do Validador IMGG e supressão de prompt transcrito). |
| **v2.6** | 08/10/2026 | Jader Brito | Registro da US-17 e Sprint 23 (Autonomia e resiliência na extração de DOM: escopo autocontido, preservação de formulários e suporte a SPAs governamentais). |

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

### 🔹 US-08: Leitura Integrada via API do Google Documents e Google Sheets
* **Como** usuário colaborador do assistente,
* **Quero** que a extensão leia o conteúdo completo de documentos do Google Docs e planilhas do Google Sheets diretamente via API (ou exportação autenticada),
* **Para que** eu possa realizar análises e tirar dúvidas sobre documentos e planilhas armazenados no Google Drive sem limitações de captura de tela.
* **Critérios de Aceite**:
  - Identificar automaticamente links e abas ativas do Google Docs (`/document/d/...`) e Google Sheets (`/spreadsheets/d/...`).
  - Utilizar a API do Google Documents v1 (`/v1/documents/`) e Google Sheets v4 (`/v4/spreadsheets/`) com token Google OAuth2 (`chrome.identity.getAuthToken`).
  - Implementar fallback resiliente para endpoints de exportação em texto puro (`/export?format=txt`) e CSV (`/export?format=csv`).
  - Integrar a leitura completa tanto à aba ativa quanto ao popover de anexos (Google Drive / Inserir Link).

### 🔹 US-09: Formatação e Exportação de Relatórios em Texto Puro (.txt)
* **Como** usuário analista,
* **Quero** baixar respostas e relatórios fornecidos pelo assistente no formato de texto puro `.txt` com formatação visual estruturada (caixa alta para títulos, delimitadores visuais, divisores de seção e tabelas ASCII alinhadas),
* **Para que** os relatórios fiquem limpos, padronizados, legíveis em qualquer editor e livres de sintaxe crua de Markdown.
* **Critérios de Aceite**:
  - Substituir o botão e a extensão de download na interface de `.md` para `.txt` ("Baixar relatório (.txt)").
  - Converter dinamicamente marcas de Markdown (# H1, ## H2, ### H3, **negrito**, tabelas) em texto formatado com bordas (`===`, `---`, `►`), alinhamento de colunas e caixas ASCII.
  - Adicionar cabeçalho e rodapé padronizados do relatório com data de geração e identificador oficial do Assistente do Jorge.

### 🔹 US-10: Restauração da Detecção Precisa de Anexos em Grids e Supressão de Ações Globais/Relatórios
* **Como** usuário auditando ou analisando processos e formulários com grids de anexos,
* **Quero** que o painel de Arquivos da Página capture estritamente os links e botões de download dos arquivos anexos reais da tabela/grid da página (como nas versões v1 a v6),
* **Para que** botões de ação globais do sistema (como "Relatório Preliminar", "Relatório Definitivo", "Salvar", "Voltar") não apareçam indevidamente na grid de arquivos para download nem poluam o contexto da análise.
* **Critérios de Aceite**:
  - Remover termos genéricos de relatórios/ações globais (`relat[oó]rio`, `gerar`, `imprimir`) de `FILE_KEYWORDS_REGEX` no `content.js`.
  - Excluir explicitamente botões de ação e navegação de frameworks corporativos (PrimeFaces/ASP.NET) que não correspondam a arquivos reais anexados.
  - Priorizar e restringir a identificação aos elementos contidos em linhas de tabelas/grids de anexos (`tr`, `.ui-datatable`, `[role="row"]`) ou com extensões de arquivos explícitas (`.pdf`, `.docx`, `.xlsx`, `.zip`, etc.).
  - Restaurar o comportamento original das versões anteriores onde apenas anexos legítimos em tela eram detectados e disponibilizados para download e montagem de contexto.

### 🔹 US-11: Restauração da Permissão de Injeção e Leitura de Páginas Ativas (MV3 host_permissions & activeTab)
* **Como** usuário analisando itens e processos em portais e sistemas governamentais/externos (ex: gestaoparcerias.sistema.gov.br),
* **Quero** que o Side Panel da extensão execute a extração limpa do DOM da aba ativa sem bloqueios de segurança do navegador,
* **Para que** o Assistente do Jorge capture o texto do item em tela e a IA realize a validação sem reportar diagnóstico de conteúdo restrito/vazio com 0 caracteres lidos.
* **Critérios de Aceite**:
  - Declarar `"activeTab"` na lista de `permissions` no `manifest.json`.
  - Declarar `"http://*/*"` e `"https://*/*"` em `host_permissions` no `manifest.json` para autorizar a injeção via `chrome.scripting.executeScript` em qualquer página ativa navegada pelo usuário.
  - Adicionar log explicativo e tratamento de exceção resiliente no `sidepanel.js` caso a injeção de script falhe.
  - Assegurar que a suíte de testes valide as permissões requeridas para extração no Manifest V3.

### 🔹 US-12: Modularização do Código-Fonte do Side Panel
* **Como** desenvolvedor da equipe de manutenção,
* **Quero** que a lógica do arquivo monolítico `sidepanel.js` seja refatorada e dividida em módulos com responsabilidades únicas (ex: `auth.js`, `ui.js`, `api.js`, `skillsManager.js`),
* **Para que** a base de código se torne mais legível, sustentável, fácil de depurar e aberta a contribuições futuras.

### 🔹 US-13: Reforço de Segurança contra XSS e Separação UI/Lógica
* **Como** usuário da extensão,
* **Quero** que a interface do chat renderize respostas da IA e outros conteúdos dinâmicos de forma segura, sem o uso direto de `innerHTML`,
* **Para que** a extensão seja resiliente a ataques de Cross-Site Scripting (XSS) e o fluxo de dados entre a lógica e a interface seja mais claro e previsível.

### 🔹 US-14: Central de Notificações da Interface do Usuário
* **Como** usuário do assistente,
* **Quero** receber feedback visual claro e amigável (notificações ou "toasts") dentro do Side Panel quando ocorrerem erros (ex: falha de rede, API indisponível, erro de autenticação),
* **Para que** eu possa entender o que aconteceu e como proceder, em vez de encontrar uma interface que falha silenciosamente.

### 🔹 US-15: Parser Nativo de Prompts Interativos (Cards) e Resiliência de Identidade no Payload (v9.3.5)
* **Como** usuário selecionando habilidades analíticas com questionários ou opções guiadas (ex: Análise e Consulta Livre),
* **Quero** que as opções de ação sejam renderizadas diretamente como botões interativos e que minhas perguntas sejam enviadas com minha identificação autenticada garantida,
* **Para que** a interface não exiba blocos JSON crus desestruturados e a API do Proxy Gateway não rejeite minhas requisições por ausência de e-mail no payload.
* **Critérios de Aceite**:
  - `appendMessageUI` deve interceptar blocos de código ```` ```json ```` do tipo `interactive_prompt`, extraindo o JSON e renderizando botões interativos via `renderizarCardInterativo`.
  - O texto introdutório da orientação da habilidade deve ser formatado via `marked.parse` e sanitizado via `DOMPurify`.
  - Os botões interativos do card devem preencher automaticamente a caixa de entrada ou acionar diretamente o pipeline de envio da consulta.
  - O e-mail do usuário logado deve ser recuperado de forma assíncrona e defensiva (`obterUsuarioAtual`) e enviado obrigatoriamente no campo `userEmail` do payload.
  - Adicionar barreira client-side amigável solicitando autenticação se o usuário não estiver logado antes de enviar ao Proxy.
  - Extrair o texto de respostas da API a partir de `data.candidates[0].content.parts[0].text` ou `data.response`.

### 🔹 US-16: Execução Dinâmica de Contexto de Boas-Vindas e Supressão de Prompt Transcrito (v9.3.6)
* **Como** usuário abrindo o Side Panel do Assistente do Jorge com a Habilidade do Validador IMGG 100 Pontos ativa,
* **Quero** receber uma saudação inteligente e contextualizada com base na aba em que estou navegando (Caso 1 no Gestaopublicagov.br ou Caso 2 fora do portal) com opções interativas prontas,
* **Para que** a extensão execute a lógica de negócio do assistente em vez de transcrever cruamente as instruções procedimentais de prompt da IA, e sem exibir indevidamente botões de download de relatório (.txt) nas mensagens de acolhimento.
* **Critérios de Aceite**:
  - `inicializarAgenteUnico` deve inspecionar assincronamente a URL da aba ativa (`chrome.tabs.query`).
  - Se a URL contiver `gestaoparcerias.sistema.gov.br` ou `treinamentoparcerias.sistema.gov.br`, exibir a mensagem contextualizada do Caso 1 com atalhos de validação rápida.
  - Se a URL não pertencer ao portal, exibir a mensagem orientadora do Caso 2 com botões interativos de "🔄 Verificar Página" e "📖 Dúvidas sobre o IMGG".
  - `appendMessageUI` deve aceitar a flag `isWelcomeMessage` para suprimir a criação do botão de download de relatório (.txt) em saudações e acolhimentos.
  - Eliminar qualquer transcrição de regras procedimentais ("Antes de apresentar as opções...", "Caso 1: ...", "Caso 2: ...") direcionadas ao modelo.

### 🔹 US-17: Autonomia e Resiliência na Extração de DOM Sanitizada da Aba Ativa (v9.3.7)
* **Como** usuário solicitando validação ou análise de páginas ativas no portal Gestaopublicagov.br ou outros sistemas web,
* **Quero** que a extensão extraia com sucesso todo o conteúdo textual legível da aba ativa em tempo real sem falhas silenciosas de script,
* **Para que** a tag `<conteudo_pagina>` contenha dados completos e a IA consiga realizar a análise preliminar dos requisitos sem relatar ausência de conteúdo.
* **Critérios de Aceite**:
  - A função `extractCleanDOMText` injetada via `chrome.scripting.executeScript` deve ser 100% autocontida, sem referências a funções externas de módulo (`removeSuperfluousContent`, `extractMainContentText`), eliminando o erro de runtime `ReferenceError`.
  - A lista de exclusão de elementos ruidosos NÃO deve remover a tag `<form>`, garantindo preservação integral de telas corporativas e governamentais baseadas em JSF/PrimeFaces/ASP.NET.
  - Implementar fallback resiliente: se a extração com `allFrames: true` falhar ou retornar vazia devido a restrições de sandbox/CSP de frames terceiros, tentar automaticamente a extração do top-frame principal.
  - Sanitizar os resultados de injeção concatenando segmentos válidos e garantindo que o texto real da página chegue até `<conteudo_pagina>`.

### 🔹 TD-01: Otimização da Injeção de `content.js`
* **Dívida Técnica:** O `content.js` é atualmente injetado em todas as páginas (`<all_urls>`) em `document_idle`, o que pode ser ineficiente se sua única função for responder a mensagens sob demanda.
* **Ação de Remediação:** Investigar o `content.js`. Se ele for reativo (apenas responde a chamadas), converter sua injeção para programática (`chrome.scripting.executeScript`) apenas quando uma funcionalidade específica for ativada pelo usuário no Side Panel.

### 🔹 TD-02: Refatoração da Suíte de Testes para Arquitetura Modular
* **Dívida Técnica:** A suíte de testes em `tests/test.js` está obsoleta e depende do arquivo `sidepanel.js`, que foi removido. Os testes atualmente não são executáveis.
* **Ação de Remediação:** Refatorar `tests/test.js` para usar importações de módulos (requer configuração para `type: "module"` ou `require` de `.cjs`). Os testes devem importar as unidades lógicas diretamente de `src/sidepanel/auth.js`, `src/sidepanel/chat.js`, etc., em vez de ler o código-fonte como texto.

---

## 📅 Quadro de Acompanhamento de Sprints (1 a 20)

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

### Sprint 16 — Leitura via Google Docs/Sheets APIs & Formatação de Relatórios (.txt)
- `[x]` Tarefa 45: Implementar função `extrairConteudoGoogleDocOuSheet` no `sidepanel.js` para integração com Google Documents API v1 e Google Sheets API v4.
- `[x]` Tarefa 46: Adicionar fallback resiliente para os endpoints de exportação em texto puro (`/export?format=txt`) e CSV (`/export?format=csv`).
- `[x]` Tarefa 47: Integrar extração de documentos do Google Docs e Sheets ao menu de anexos (`optGoogleDrive` / `optInsertLink`) e à detecção de aba ativa.
- `[x]` Tarefa 48: Implementar o conversor de relatórios Markdown `converterMarkdownParaTxtFormatado` com formatação de fontes, hierarquia visual, divisores e tabelas ASCII.
- `[x]` Tarefa 49: Atualizar o botão de download no `sidepanel.js` para exportação direta de relatórios no formato `.txt` ("Baixar relatório (.txt)").
- `[x]` Tarefa 50: Adicionar testes de integração automatizados na suíte para verificação das APIs do Google Docs/Sheets e conversão de relatórios `.txt`.

### Sprint 17 — Remediação dos Achados de Segurança, Arquitetura & Conformidade MV3 (v8)
- `[x]` Tarefa 51 (Bloqueante): Implementar verificação criptográfica do Token OAuth do Google no `Code.gs` (`SEC-01`).
- `[x]` Tarefa 52 (Bloqueante): Restringir permissões de host no `manifest.json` removendo o escopo irrestrito `<all_urls>` (`SEC-02`).
- `[x]` Tarefa 53: Prevenir Indirect Prompt Injection no `sidepanel.js` usando a tag `<untrusted_web_content>` e instrução de sistema estrita (`SEC-03`).
- `[x]` Tarefa 54: Adicionar filtro de frames invisíveis e `MutationObserver` no `content.js` para suporte resiliente a SPAs (`FE-01` e `ARCH-02`).
- `[x]` Tarefa 55: Modularizar componentes em `src/` e tratar fontes CID/CMap no parser de PDF (`ARCH-01` e `ARCH-03`).
- `[x]` Tarefa 56: Atualizar a suíte de testes com 59 verificações aprovadas com 100% de sucesso.

### Sprint 18 — Correção da Detecção de Anexos em Tela e Supressão de Botões de Ação Globais (v8.1 / Bugfix)
- `[ ]` Tarefa 57 (Bug): Remover o termo `relat[oó]rio` de `FILE_KEYWORDS_REGEX` e eliminar captura indevida de botões de emissão de relatórios e ações de toolbar em `content.js`.
- `[ ]` Tarefa 58 (Correção): Restringir a Estratégia 3 (botões PrimeFaces/ASP.NET) para exigir vínculo estrito a linhas de tabela de anexos (`tr`, `.ui-datatable-data`) ou nomes com extensões válidas.
- `[ ]` Tarefa 59 (Melhoria): Adicionar lista de exclusão explícita para ações de sistema ("relatório preliminar", "relatório definitivo", "salvar", "voltar", "cancelar", "imprimir").
- `[ ]` Tarefa 60 (Testes): Adicionar testes automatizados na suíte garantindo que links legítimos de anexos sejam capturados e ações de sistema/relatórios sejam ignoradas.

### Sprint 19 — Restauração de Permissões de Leitura do DOM e activeTab no Manifest V3
- `[ ]` Tarefa 61 (Permissão): Adicionar permissão `"activeTab"` no array de `permissions` do `manifest.json`.
- `[ ]` Tarefa 62 (Permissão): Adicionar `"http://*/*"` e `"https://*/*"` em `host_permissions` no `manifest.json` para autorizar `chrome.scripting.executeScript` na extração de DOM em sites externos (ex: gestaoparcerias.sistema.gov.br).
- `[ ]` Tarefa 63 (Tratamento de Erro): Adicionar log explicativo e tratamento de exceção descritivo em `sidepanel.js` ao executar `chrome.scripting.executeScript`.
- `[ ]` Tarefa 64 (Testes): Adicionar testes automatizados na suíte validando a presença de `activeTab` e `host_permissions` globais no `manifest.json`.

### Sprint 20 — Refatoração Estratégica e Dívidas Técnicas
- `[ ]` Tarefa 65 (Refatoração): Criar estrutura de diretórios `src/sidepanel/` com arquivos modulares (`auth.js`, `ui.js`, `api.js`, `skills.js`, `files.js`, `main.js`).
- `[ ]` Tarefa 66 (Refatoração): Migrar a lógica de autenticação (OAuth, validação de proxy) de `sidepanel.js` para `src/sidepanel/auth.js`.
- `[ ]` Tarefa 67 (Refatoração): Isolar toda a manipulação direta do DOM (ex: `document.getElementById`, `element.appendChild`) em `src/sidepanel/ui.js`.
- `[ ]` Tarefa 68 (Segurança): Substituir todas as instâncias de `innerHTML` por métodos seguros como `textContent` ou `createElement`, e integrar `DOMPurify` para sanitizar respostas de IA antes da renderização.
- `[ ]` Tarefa 69 (UX): Implementar um componente de notificação em `ui.js` para exibir mensagens de erro da API ou de operações falhas.
- `[ ]` Tarefa 70 (Otimização): Analisar `content.js` e, se confirmado como reativo, remover sua declaração do `manifest.json` e convertê-lo para injeção programática sob demanda.

### Sprint 21 — Estabilização da Modularização MV3 e Resiliência de Payload (v9.3.5)
- `[x]` Tarefa 71 (Correção): Parser de blocos `interactive_prompt` em `appendMessageUI` e renderização de cards interativos.
- `[x]` Tarefa 72 (Autenticação): Hidratação defensiva assíncrona de `currentUser` via `obterUsuarioAtual()` em `auth.js`.
- `[x]` Tarefa 73 (Integração): Envio obrigatório de `userEmail` e extração de `candidates` no retorno da API em `api.js`.
- `[x]` Tarefa 74 (Relatórios): Restauração da formatação completa de relatórios `.txt` em `files.js` e suíte com 74 testes aprovados.

### Sprint 22 — Execução Dinâmica de Contexto de Boas-Vindas e Supressão de Prompt Transcrito (v9.3.6)
- `[x]` Tarefa 75 (Lógica): Inspeção dinâmica da aba ativa em `inicializarAgenteUnico()` para detecção do portal Gestaopublicagov.br.
- `[x]` Tarefa 76 (Interface): Apresentação contextualizada do Caso 1 (no portal) e Caso 2 (fora do portal) com cards interativos nativos.
- `[x]` Tarefa 77 (UX/Segurança): Supressão da injeção do botão de download de relatório (.txt) em mensagens de boas-vindas (`isWelcomeMessage`).
- `[x]` Tarefa 78 (Qualidade): Eliminação de transcrições de diretrizes de sistema da IA na tela do usuário.

### Sprint 23 — Autonomia e Resiliência na Extração de DOM Sanitizada da Aba Ativa (v9.3.7)
- `[x]` Tarefa 79 (Injeção): Tornar `extractCleanDOMText` 100% autocontida sem referências a funções de escopo externo de módulo em `files.js`.
- `[x]` Tarefa 80 (Preservação): Excluir a tag `form` da lista de filtros para manter íntegras as telas do Gestaopublicagov.br e sistemas JSF/PrimeFaces.
- `[x]` Tarefa 81 (Resiliência): Adicionar tratamento de fallback (allFrames vs top-frame) e sanitização de retorno em `extrairConteudoDaPagina()`.
- `[x]` Tarefa 82 (Testes): Garantir que a suíte de testes automatizados valide a extração com tags de formulário preservadas.




