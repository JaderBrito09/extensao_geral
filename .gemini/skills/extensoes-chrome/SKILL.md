---
name: extensoes-chrome
description: Diretrizes de desenvolvimento, arquitetura, auditoria e publicação de extensões Chrome em Manifest V3 para o projeto Assistente do Jorge. Ativar sempre que modificar manifest.json, background.js, sidepanel.*, popup.* ou ao preparar builds para a Chrome Web Store.
---

# Desenvolvimento e Publicação de Extensões Chrome (Manifest V3) — Assistente do Jorge

Este guia reúne as regras obrigatórias, decisões de arquitetura e checklists de publicação para o **Assistente do Jorge**.

---

## 🛑 Regras Obrigatórias Manifest V3 (Anti-Erros de Build)

### 1. Ícones do Manifest
Todas as resoluções especificadas no `manifest.json` DEVEM existir fisicamente na pasta `icons/`:
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png",
  "512": "icons/icon512.png"
}
```

### 2. Abertura do Painel Lateral (Side Panel)
O evento de clique no ícone da ação do Chrome DEVE abrir o Side Panel nativo no `background.js`:
```javascript
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});
```
*Nota: Não defina `default_popup` no `manifest.json` se o clique principal for abrir o Side Panel.*

### 3. Service Workers são Efêmeros (Sem Estado em Memória)
- O `background.js` pode ser inativado pelo Chrome após ~30 segundos de ociosidade.
- **NUNCA** guarde estado de sessão ou dados do usuário em variáveis globais no `background.js`.
- Sempre persista e leia estados utilizando `chrome.storage.local` ou `chrome.storage.session`.

### 4. Leitura da Aba Ativa e Permissões (`tabs` e `host_permissions`)
- Para ler `tab.url`, `tab.title` ou injetar scripts de extração do DOM da aba aberta a partir do Side Panel, declare a permissão `"tabs"` e `"scripting"`, além das `"host_permissions"` no `manifest.json`.

### 5. Sem `eval()` ou Scripts Inline (CSP Coder)
- O CSP do Manifest V3 proíbe `eval()`, `new Function()` e scripts inline em páginas HTML da extensão.
- Todo script deve ser carregado via arquivo externo: `<script src="sidepanel.js"></script>`.
- Todo HTML de resposta da IA deve ser sanitizado com `DOMPurify.sanitize()` antes de ser inserido no chat.

---

## 🏛️ Arquitetura Específica do Projeto Assistente do Jorge

```text
extensao_geral/
├── manifest.json            ⚙️ Configuração Manifest V3
├── background.js            🔄 Service Worker de eventos do navegador e atalhos
├── sidepanel.html           🎨 Interface do Painel Lateral de Chat
├── sidepanel.js             🧠 Lógica do Chat, OAuth 2.0, requisições ao Apps Script e Parser de Markdown
├── sidepanel.css            💄 Estilos CSS nativos do Chat
├── popup.html / popup.js    🔍 Pop-up auxiliar de atalho/status
├── lib/                     📚 Bibliotecas locais (marked.min.js, purify.min.js)
├── apps-script/             ⚡ Servidor Proxy Gateway no Google Apps Script (Code.gs)
└── docs/                    📖 Documentação do projeto (Manual, Arquitetura, Store)
```

---

## 🛡️ Checklist de Pré-Publicação na Chrome Web Store

Antes de gerar o pacote `.zip` para envio à Web Store:
- [ ] O `manifest_version` é obrigatoriamente `3`.
- [ ] As versões no `manifest.json` correspondem ao histórico de versões do projeto.
- [ ] Nenhuma credencial privada ou chave de API está hardcoded no código (a chave `GEMINI_API_KEY` fica no Apps Script).
- [ ] O arquivo `.zip` final NÃO contém arquivos sensíveis (`.env`, `credentials/`, `docs/SETUP_E_INFRAESTRUTURA.md`, `.git/`, `.DS_Store`).
- [ ] O guia [`GUIA_PUBLICACAO_CHROME_STORE.md`](file:///Users/jader/Meu%20Drive/extensao_geral/docs/GUIA_PUBLICACAO_CHROME_STORE.md) foi consultado para atualizar os textos da loja.
