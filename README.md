# 🤖 Assistente do Jorge — Extensão Chrome Side Panel (Manifest V3)

Assistente analítico inteligente para o Google Chrome que utiliza a API do **Google Gemini 2.5 Flash** (`gemini-2.5-flash`), **Habilidades gerenciadas em arquivos Markdown no GitHub**, **Painel de Arquivos da Página & Anexos** e **Persistência de Histórico de Conversas no Computador do Usuário**.

---

## ⚡ Recursos Principais

* **Habilidades Dinâmicas em Markdown (GitHub)**: Carregamento de Habilidades especialistas (`.md`) armazenadas no repositório, com orientação preliminar dinâmica ao usuário e suporte a bases de conhecimento complementares (leis, normas e manuais).
* **Restrição de Escopo Documental Estrita**: A IA responde exclusivamente com base no contexto da página web e dos anexos. Caso a informação não conste nos documentos, a IA solicita permissão prévia do usuário antes de realizar consultas externas.
* **Painel "Arquivos da Página"**: Detecção automática de documentos disponíveis na aba ativa (`.pdf`, `.txt`, `.csv`, `.json`, `.docx`, etc.), com botões para download unitário ou em lote ("Baixar Todos").
* **Anexo Manual de Arquivos**: O usuário pode anexar arquivos locais ou baixados diretamente no campo de interação para análise focada.
* **Histórico de Conversas Salvas (Sessões)**: Múltiplas conversas são persistidas localmente no computador do usuário (`chrome.storage.local`), permitindo iniciar **Nova Conversa** ou **Retomar** conversas anteriores a qualquer momento.
* **Modelo Configurável (`gemini-2.5-flash`)**: Definição dinâmica do modelo do Gemini via constante na extensão e no servidor Proxy Google Apps Script.
* **Captura de DOM & Formulários Just-in-Time**: Captura viva do estado da página e dados preenchidos em formulários no exato segundo do envio da pergunta.
* **Painel Lateral Nativo (`sidePanel`)**: Interface moderna em HTML/CSS/JS puro integrada à barra lateral do Chrome.

---

## 🚀 Como Executar em Modo de Desenvolvimento

1. Clone ou baixe este repositório na sua máquina.
2. Abra o Google Chrome e acesse `chrome://extensions`.
3. Ative o **Modo do desenvolvedor** no canto superior direito.
4. Clique em **Carregar sem compactação** (Load unpacked) e selecione a pasta deste projeto.
5. Clique no ícone da extensão para abrir o **Assistente do Jorge** no painel lateral.

---

## 📦 Pacote para Produção (Chrome Web Store)

Para gerar o arquivo `.zip` pronto para submissão no Chrome Developer Dashboard:
```bash
zip -r assistente-jorge-extension-v5.0.0.zip manifest.json background.js content.js popup.html popup.css popup.js sidepanel.html sidepanel.css sidepanel.js icons/ lib/ -x "*.DS_Store"
```
O pacote compilado é gerado como `assistente-jorge-extension-v5.0.0.zip` na raiz do projeto.

---

## 📚 Documentação do Projeto

Toda a documentação técnica e arquitetural pública do projeto está disponível na pasta [`docs/`](docs/):

| Documento | Descrição |
| :--- | :--- |
| 📖 [MANUAL_DO_USUARIO.md](docs/MANUAL_DO_USUARIO.md) | Guia ilustrado do usuário final: instalação, login, seleção de skills, leitura de documentos e histórico. |
| 🚀 [GUIA_PUBLICACAO_CHROME_STORE.md](docs/GUIA_PUBLICACAO_CHROME_STORE.md) | Passo a passo de publicação com Acesso Restrito / Não Listado na Chrome Web Store. |
| 🏗️ [ARQUITETURA_E_ESPECIFICACAO.md](docs/ARQUITETURA_E_ESPECIFICACAO.md) | Arquitetura técnica, especificações de produto, diagramas de fluxo, ADRs de design e políticas de privacidade. |
| 📋 [BACKLOG_E_USER_STORIES.md](docs/BACKLOG_E_USER_STORIES.md) | Planejamento de produto, Histórias de Usuário (User Stories) e acompanhamento de Sprints (1 a 12). |
| 💡 [GUIA_DE_SKILLS.md](docs/GUIA_DE_SKILLS.md) | Guia do criador de Habilidades, sintaxe Markdown, manifesto `skills.json` e integração com GitHub. |

> *Nota: Documentações sensíveis contendo IDs internos de infraestrutura (como `SETUP_E_INFRAESTRUTURA.md`) e pastas de credenciais são privadas e não são enviadas para o repositório público.*
