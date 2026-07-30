---
name: memory-leak-debugging
description: Diagnostica e resolve vazamentos de memória (memory leaks) em aplicações JavaScript e extensões Chrome (Side Panel, Content Scripts e Service Worker). Utilizar quando houver alto uso de memória, travamentos ou na análise de heapsnapshots.
---

# Depuração e Limpeza de Memória — Assistente do Jorge

Esta skill fornece diretrizes e fluxos de trabalho para identificar, diagnosticar e corrigir vazamentos de memória (memory leaks) e retenção indevida de dados na extensão **Assistente do Jorge**.

## 🎯 Princípios Fundamentais no Contexto da Extensão

- **Não ler arquivos `.heapsnapshot` brutos diretamente**: Arquivos de snapshot são extremamente grandes e consomem muitos tokens. Utilize ferramentas especializadas (como `memlab` ou scripts comparadores).
- **Isolar o Escopo do Vazamento**: Identifique se o vazamento está ocorrendo no:
  1. **Side Panel / Popup (`sidepanel.js`)**: Nós DOM desanexados, ouvintes de evento (`addEventListener`) não removidos, acúmulo infinito de histórico no DOM.
  2. **Background Service Worker (`background.js`)**: Retenção de objetos globais em memória viva (lembre-se: service workers no Manifest V3 são efêmeros e devem persistir estado via `chrome.storage`).
  3. **Content Scripts (`content.js`)**: Referências retidas em páginas de terceiros ou injeções de DOM não limpas ao fechar/navegar.

## ⚠️ Causas Comuns de Memory Leak na Extensão

1. **Acúmulo do Histórico no Chat**: Renderizar centenas de mensagens de chat no DOM sem virtualização ou limitação de nós visíveis.
2. **Event Listeners no `chrome.runtime.onMessage`**: Registrar ouvintes duplicados a cada abertura do painel lateral sem a devida remoção.
3. **Imagens e Arquivos em Base64**: Manter anexos pesados (`.pdf`, imagens) gravados em variáveis globais no estado da janela do chat em vez de liberar após o envio.
4. **Instâncias do Marked / DOMPurify**: Criar novas instâncias de leitores/parsers a cada ciclo de renderização.

---

## 🔄 Fluxos de Trabalho de Diagnóstico e Limpeza

### 1. Captura e Comparação de Snapshots de Memória

1. Abra o DevTools da extensão (clique com botão direito no Side Panel > *Inspecionar*).
2. Vá até a aba **Memory** (Memória) e selecione **Take heap snapshot**.
3. Realize ações repetitivas no chat (ex: alternar habilidades 10 vezes, enviar 5 mensagens com anexos, abrir/fechar o histórico).
4. Force a coleta de lixo (clique no ícone de lixeira 🗑️).
5. Tire um novo snapshot e compare a diferença de objetos retidos.

### 2. Práticas de Limpeza no Código (`sidepanel.js`)

#### ✅ Liberar Memória de Anexos
```javascript
// Após converter e enviar o arquivo para a API, limpe o buffer da memória
let currentAttachment = { name: file.name, data: base64Data };

async function handleSend() {
  await sendMessageToProxy(currentAttachment);
  // Limpeza explícita da memória
  currentAttachment = null;
  document.getElementById('fileInput').value = '';
}
```

#### ✅ Remover Event Listeners ao Desmontar / Reiniciar
```javascript
// Evite múltiplos listeners globais
function setupListeners() {
  chrome.runtime.onMessage.removeListener(onMessageCallback);
  chrome.runtime.onMessage.addListener(onMessageCallback);
}
```

---

## 🛠️ Checklist de Verificação de Memória do Projeto

- [ ] Variáveis globais de anexos e arquivos são zeradas (`null`) após o envio.
- [ ] O Service Worker não armazena estado persistente em variáveis no topo do arquivo (utiliza `chrome.storage.local` ou `chrome.storage.session`).
- [ ] Elementos de mensagens antigas do chat são removidos ou limpos ao clicar em `+ Nova Conversa`.
