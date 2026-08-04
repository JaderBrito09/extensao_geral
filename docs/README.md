# 📚 Documentação Técnica e Operacional — Assistente do Jorge

Bem-vindo ao centro de documentação oficial do **Assistente do Jorge**, extensão analítica inteligente para Google Chrome (Manifest V3) integrada ao painel lateral (`sidePanel`).

Este repositório reúne a documentação de arquitetura, instalação, configuração, publicação e utilização do projeto.

---

## 🗺️ Visão Geral da Documentação

| Documento | Foco | Conteúdo Principal |
| :--- | :--- | :--- |
| 📖 [MANUAL_DO_USUARIO.md](MANUAL_DO_USUARIO.md) | Usuário Final | Guia de uso, instalação no Chrome, login Google, seleção de Habilidades e gestão de arquivos/conversas. |
| 🏗️ [ARQUITETURA_E_ESPECIFICACAO.md](ARQUITETURA_E_ESPECIFICACAO.md) | Arquitetura | Modelo Client-Proxy, Diagramas de Sequência (Mermaid), ADRs, Permissões V3 e Segurança. |
| 🛠️ [SETUP_E_INFRAESTRUTURA.md](SETUP_E_INFRAESTRUTURA.md) | Infraestrutura | Setup de GCP, OAuth 2.0, Planilha Google Sheets, Deploy do Apps Script e Parâmetros do Projeto. |
| 💡 [GUIA_DE_SKILLS.md](GUIA_DE_SKILLS.md) | Especialistas | Estruturação de Habilidades (`SKILL.md`), manifesto `skills.json` e integração com o repositório GitHub. |
| 🚀 [GUIA_PUBLICACAO_CHROME_STORE.md](GUIA_PUBLICACAO_CHROME_STORE.md) | Publicação | Passo a passo de submissão na Chrome Web Store (Acesso Restrito / Não Listado). |
| 📋 [BACKLOG_E_USER_STORIES.md](BACKLOG_E_USER_STORIES.md) | Produto/PM | Histórias de Usuário (US-01 a US-07) e Roteiro de Sprints (1 a 14). |
| 📜 [POLITICA_DE_PRIVACIDADE.md](POLITICA_DE_PRIVACIDADE.md) | Compliance | Termos de privacidade e declaração de uso de dados exigidos pelo Google. |

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
