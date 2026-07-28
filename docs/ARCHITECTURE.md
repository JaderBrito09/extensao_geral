# 🏛️ Arquitetura & Decisões de Design (ADRs): Assistente do Jorge

Este documento registra as decisões arquiteturais do projeto (**Architecture Decision Records - ADRs**), justificando os motivos das escolhas técnicas e o padrão de design adotado.

---

## 🏗️ Padrão Geral da Arquitetura

O **Assistente do Jorge** utiliza uma arquitetura **Serverless, Zero-Cost & Zero-Database Proxy**, composta por:
1. **Frontend / Extension Core**: Extensão nativa Manifest V3 rodando no cliente (Side Panel HTML/CSS/JS).
2. **Identity & Authorization Provider**: Google OAuth 2.0 (`chrome.identity`).
3. **User Directory**: Planilha Google (Google Sheets API v4).
4. **Secure Proxy & Gateway**: Google Apps Script Web App (Executando em nuvem Google sem custos).
5. **Skills Repository**: Repositório GitHub (GitHub REST API).
6. **AI Inference Engine**: Google GenAI REST API (Gemini 2.5 Flash).

---

## 📜 Registros de Decisões Arquiteturais (ADRs)

### 📌 ADR-001: Subdivisão do Banco de Dados por Google Sheets (Gestão de Usuários)
* **Status**: Aprovado
* **Contexto**: O projeto necessita validar quais colaboradores podem acessar a extensão (até ~200 usuários), sem incorrer em custos de servidores ou bancos relacionais.
* **Decisão**: Utilizar uma Planilha Google protegida consultada para controle de e-mails ativos.
* **Consequências**:
  * **Positivas**: Custo zero, zero manutenção de servidores, facilidade absoluta para o gestor adicionar/bloquear usuários editando linhas.

---

### 📌 ADR-002: Armazenamento de Skills como Arquivos Markdown no GitHub
* **Status**: Aprovado
* **Contexto**: As habilidades analíticas (System Prompts) mudam frequentemente e precisam ser editadas por especialistas sem alterar o código-fonte da extensão.
* **Decisão**: Armazenar cada skill como um arquivo `.md` em uma pasta `/skills/` em um repositório GitHub público/privado.
* **Consequências**:
  * **Positivas**: Versionamento completo por commits Git, edição fácil em formato texto/markdown, leitura rápida via GitHub API Raw.

---

### 📌 ADR-003: Uso da API Nativa `chrome.sidePanel` (Manifest V3)
* **Status**: Aprovado
* **Contexto**: A interface do assistente deve estar visível ao lado da navegação web do usuário sem obstruir o conteúdo da aba.
* **Decisão**: Utilizar o `sidePanel` nativo do Manifest V3 acionado pelo ícone da extensão via Service Worker (`background.js`).

---

### 📌 ADR-004: Proxy Seguro de API Key via Google Apps Script Web App
* **Status**: Aprovado (Substitui armazenamento direto em planilha)
* **Contexto**: Disponibilizar a `GEMINI_API_KEY` diretamente em células de planilha ou no código da extensão exporia a chave a usuários com acesso à planilha ou via inspeção do navegador.
* **Decisão**: Utilizar um **Google Apps Script Web App (Proxy Gateway gratuito)**. A chave `GEMINI_API_KEY` fica salva de forma estritamente privada nas **Script Properties** do Apps Script. A extensão envia o payload para o endpoint do Apps Script, que valida o e-mail do usuário na planilha, insere a API Key protegida e executa a chamada para o Gemini via `UrlFetchApp`.
* **Consequências**:
  * **Positivas**:
    1. **Segurança Máxima**: A `GEMINI_API_KEY` **nunca trafega** para o navegador dos usuários nem fica exposta na planilha.
    2. **Custo Zero**: O Google Apps Script é um serviço serverless 100% gratuito integrado ao ecossistema Google Workspace.
    3. **Troca Instantânea**: O administrador pode rotacionar a API Key no painel do Apps Script sem precisar re-publicar a extensão no Chrome Web Store.
    4. **Impossível Burlar**: Usuários não autorizados ou inativos não conseguem consumir a cota do Gemini.
