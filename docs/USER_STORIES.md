# 📋 User Stories & Product Backlog Ágil: Assistente do Jorge

Product Backlog estruturado no formato de **Histórias de Usuário (User Stories)** com critérios de aceite (*Definition of Done*) divididos por Sprints.

---

## 🏃 Sprint 1: Fundação, Autenticação & Validação (Google Sheets)

### 🔹 US-01: Autenticação via Conta Google
* **Como** usuário colaborador,
* **Quero** realizar login com minha Conta Google no painel lateral da extensão,
* **Para que** eu possa acessar minhas permissões e utilizar o assistente de forma segura.
* **Critérios de Aceite**:
  - [ ] Exibir botão "Entrar com Google" no Side Panel se o usuário não estiver autenticado.
  - [ ] Executar `chrome.identity.getAuthToken({ interactive: true })`.
  - [ ] Resgatar foto de perfil e e-mail do usuário logado.
  - [ ] Disponibilizar opção de Logout.

### 🔹 US-02: Validação de Acesso na Planilha Google Sheets
* **Como** administrador do sistema,
* **Quero** controlar o acesso dos usuários ativando ou inativando e-mails em uma planilha Google,
* **Para que** somente pessoas autorizadas acessem o Assistente do Jorge.
* **Critérios de Aceite**:
  - [ ] A extensão faz requisição na Google Sheets API v4 buscando o e-mail logado.
  - [ ] Se o e-mail não existir ou estiver `INATIVO`, exibir tela de acesso negado.
  - [ ] Se o e-mail estiver `ATIVO`, armazenar as permissões e liberar a interface do chat.

---

## 🏃 Sprint 2: Skills Dinâmicas em Markdown (GitHub)

### 🔹 US-03: Carregamento de Skills do GitHub
* **Como** usuário ativado,
* **Quero** visualizar a lista de skills analíticas disponíveis em um menu suspenso (select),
* **Para que** eu possa escolher a instrução correta para a minha tarefa atual.
* **Critérios de Aceite**:
  - [ ] A extensão busca a lista de arquivos `.md` na pasta `/skills/` via GitHub REST API.
  - [ ] Filtrar skills com base na coluna `Skills Permitidas` do usuário vinda da planilha.
  - [ ] Preencher dinamicamente o `<select id="task-select">`.
  - [ ] Salvar cache em `chrome.storage.local` para suporte offline.

---

## 🏃 Sprint 3: Extração de Página, Auto-Downloads e IA

### 🔹 US-04: Captura Sanitizada da Página Web
* **Como** usuário pesquisando uma página,
* **Quero** que a extensão extraia automaticamente o texto relevante da aba ativa,
* **Para que** o Gemini responda à minha pergunta com contexto completo da página.
* **Critérios de Aceite**:
  - [ ] Injetar script via `chrome.scripting.executeScript` na aba ativa.
  - [ ] Remover tags ruidosas (`script`, `style`, `nav`, `footer`, `iframe`, `svg`).
  - [ ] Limitar o tamanho do texto capturado (`.slice(0, 30000)`).

### 🔹 US-05: Download Automático & Leitura de Documentos
* **Como** usuário analisando uma página com anexos,
* **Quero** que a extensão baixe e leia os documentos da página (.pdf, .txt, .csv, .json),
* **Para que** a resposta da IA inclua dados dos arquivos vinculados.
* **Critérios de Aceite**:
  - [ ] Detectar links de download na aba ativa.
  - [ ] Baixar arquivos para a máquina do usuário via `chrome.downloads.download()`.
  - [ ] Extrator em JS para ler o conteúdo textual dos arquivos baixados.
  - [ ] Consolidar prompt final e enviar para a API do Gemini.
