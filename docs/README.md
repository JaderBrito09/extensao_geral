# 📚 Documentação Técnica e Operacional — Agente MVP (Hermes Agent & WebApp)

Bem-vindo ao centro de documentação oficial do ecossistema **Hermes Agent MVP**, reunindo o WebApp corporativo (Next.js), o Cérebro Central do Agent (VPS Hostinger), o Banco de Dados PostgreSQL (`pgvector`) e os Clientes de Borda (incluindo a Extensão Chrome **Assistente do Jorge**).

---

## 🗺️ Visão Geral da Documentação

| Documento | Foco | Conteúdo Principal |
| :--- | :--- | :--- |
| 📖 [PDR.md](PDR.md) | Produto | Visão geral do produto, requisitos de negócio e escopo funcional do MVP. |
| 🏗️ [ARQUITETURA_E_ESPECIFICACAO.md](ARQUITETURA_E_ESPECIFICACAO.md) | Arquitetura | Visão da arquitetura alvo, Diagramas Mermaid, ADRs e fluxo de comunicação unificado. |
| 🛠️ [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Infraestrutura | Setup de VPS (Hostinger), Easypanel (Projeto `agente`), PostgreSQL 16 + pgvector e Deploy via SSH. |
| 🔌 [API_INTEGRATION.md](API_INTEGRATION.md) | Integração API | Contrato REST/SSE para clientes (Webapp Next.js, Extensão Chrome e APIs externas). |
| 💡 [SKILLS_AND_PROJECTS.md](SKILLS_AND_PROJECTS.md) | Skills & RAG | Mapeamento de Skills nativas no Hermes, isolamento de RAG e gestão de projetos no Postgres. |
| 📋 [BACKLOG.md](BACKLOG.md) | Produto/PM | Backlog do produto, histórias de usuário, matriz SDD e roadmap de desenvolvimento. |
| 🌊 [SSE_STREAMING_GUIDE.md](SSE_STREAMING_GUIDE.md) | Protocolo | Guia de implementação de streaming Server-Sent Events (SSE) para chat em tempo real. |

---

## 🎯 1. Princípios de Arquitetura Unificada (Cérebro Central na VPS)

O ecossistema adota o conceito de **Cérebro Unificado Centralizado**:

```text
[ Cliente: WebApp Next.js ]  ──┐
                               ├──> [ API REST/SSE (VPS) ] ──> [ Hermes Agent Core ] ──> [ Postgres + pgvector ]
[ Cliente: Chrome Extension ] ──┘
```

1. **Hermes Agent (VPS Hostinger KVM 4)**:
   * Mantém **100% de suas capacidades nativas** (terminal shell, leitura/escrita de arquivos, orquestração de skills, background jobs, acesso ao Gemini 2.5 Flash / Ollama local).
   * Atua como serviço centralizado na VPS, podendo servir múltiplos frontends e integrações simultaneamente.

2. **WebApp Corporativo (Next.js para 20+ Usuários)**:
   * Interface otimizada e simplificada para gestão de documentação (Wiki/SDD), RAG de projetos, chat interativo e Google Drive.
   * **Escopo Controlado (RBAC)**: Remove interfaces ruidosas ou perigosas (como terminal web exposto para usuários comuns, gestão visual de workspaces Git locais e edição crua de chaves de API).

3. **Extensão Chrome ("Assistente do Jorge")**:
   * Cliente leve de captura e interação na borda do navegador.
   * Migrada da arquitetura legada (Apps Script + Planilhas Google + GitHub raw) para se comunicar diretamente com a **API do Hermes Agent na VPS**, consumindo autenticação OAuth e permissões unificadas no PostgreSQL.

---

## 🚀 1. Instruções de Instalação (Installation Instructions)

### Modo de Desenvolvimento (Descompactado)
1. Clone ou baixe este repositório (`/Users/jader/Meu Drive/extensao_geral`).
2. Acesse `chrome://extensions` no Google Chrome.
3. Ative o **Modo do desenvolvedor** no canto superior direito.
4. Clique em **Carregar sem compactação** (Load unpacked) e selecione a pasta do projeto.
5. Fixe a extensão na barra de ferramentas e clique para abrir o **Side Panel**.

### Produção (Pacote `.zip` para Chrome Web Store)
1. Para gerar o pacote compilado pronto para submissão:
   ```bash
   zip -r assistente-jorge-extension-v7.zip manifest.json background.js content.js popup.html popup.css popup.js sidepanel.html sidepanel.css sidepanel.js icons/ lib/ -x "*.DS_Store"
   ```
2. Acesse o [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
3. Faça upload do arquivo `assistente-jorge-extension-v7.zip`.

---

## ⚙️ 2. Opções de Configuração (Configuration Options)

### Constantes e Parâmetros em `sidepanel.js`
* **`DEFAULT_GEMINI_MODEL`**: `gemini-2.5-flash` — Modelo LLM padrão configurado para requisições de análise rápida e multimodal.
* **`DEFAULT_APPS_SCRIPT_ENDPOINT`**: `https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec` — Endpoint público do Proxy Gateway.
* **`MAX_PAGE_CHARS`**: `30000` — Limite máximo de caracteres sanitizados do DOM para prevenção de estouro de tokens.
* **`MAX_HISTORY_TURNS`**: `10` — Janela máxima de mensagens de conversas anteriores enviadas em cada requisição.

### Controle de Acesso e Permissões (Google Sheets)
* **Planilha ID**: `1VbXL-23CimrbmoEThgPRSepOfzmgRtTXrIyftwXBRGE` (Aba `Usuarios`).
* **Estrutura de Colunas**: `E-mail` | `Nome` | `Status` (`ATIVO`/`INATIVO`) | `Skills Permitidas` | `Observações`.
* **Sintaxe de Permissão**: `ALL` / `*` (Acesso total), `SKILL-ID` (Acesso por ID), `CAT:Nome` (Acesso por Categoria).

---

## 🏗️ 3. Visão Geral da Arquitetura (Architecture Overview)

O **Assistente do Jorge** adota a arquitetura **Client-Proxy Gateway**:

```text
[Chrome Extension (SidePanel MV3)] ──(OAuth 2.0 Token)──> [Apps Script Proxy Gateway]
                                                                  │
                                                        (Planilha Google Sheets)
                                                        Valida E-mail & Permissão
                                                                  │
                                                                  ▼
[GitHub Raw Repository] <──(skills.json / .md)──────── [Google Gemini 2.5 Flash]
```

* **Client MV3 (Chrome Extension)**: Executa a interface do usuário no painel lateral, realiza extração sanitizada do DOM via `content.js` e armazena o histórico em `chrome.storage.local`.
* **Proxy Gateway (Google Apps Script)**: Intermedeia chamadas à API do Gemini, mantendo a chave `GEMINI_API_KEY` protegida em servidor e validando usuários ativos na planilha Google Sheets.
* **Catálogo de Skills no GitHub**: As Habilidades Especialistas são baixadas dinamicamente do repositório `JaderBrito09/assistente-jorge-skills` sem necessidade de re-compilação da extensão.

---

## 💡 4. Diretrizes de Uso (Usage Guidelines)

1. **Seleção de Habilidades**: Escolha a instrução especialista desejada no menu suspenso. A orientação inicial será exibida automaticamente no chat.
2. **Análise de Páginas e Formulários**: O assistente captura em tempo real o conteúdo visível da aba ativa (`<main>`, `<article>`), removendo scripts e elementos ruidosos.
3. **Painel de Arquivos da Página**: Documentos encontrados na página (`.pdf`, `.txt`, `.csv`, `.json`) são listados no painel com opção de download unitário ou em lote ("Baixar Todos").
4. **Anexo de Arquivos Locais**: O usuário pode anexar arquivos locais (`📎`) para análise focada na conversa.
5. **Restrição Estrita de Escopo Documental**: A IA responde prioritariamente com base no conteúdo da página e dos anexos. Para informações externas, solicita permissão prévia do usuário.
