// Background Service Worker (Manifest V3)
// Gerencia eventos globais da extensão Assistente do Jorge e sincronização entre Popup e Sidepanel

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background ServiceWorker] Extensão Assistente do Jorge instalada com sucesso.');
});

// Configura o comportamento do SidePanel no Chrome (abre ao clicar no ícone da extensão)
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn('[Background] Aviso ao configurar sidePanel behavior:', err));
}

// Handler de fallback para clique na ação do Chrome
if (typeof chrome !== 'undefined' && chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener(async (tab) => {
    if (chrome.sidePanel && chrome.sidePanel.open && tab && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId }).catch((err) => {
        console.warn('[Background] Erro ao abrir SidePanel via action click:', err);
      });
    }
  });
}

// Listener Isolado de Mensagens do Runtime para o Background Service Worker
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Isola o listener: processa apenas se a mensagem for especificamente direcionada ao 'background' ou '*'
    if (request.target && request.target !== 'background' && request.target !== '*') {
      return false;
    }

    const action = request.action || (request.payload && request.payload.action);

    if (action === 'ACTION_PING') {
      sendResponse({
        source: 'JORGE_BACKGROUND',
        action: 'ACTION_PONG',
        success: true,
        timestamp: Date.now()
      });
      return true;
    }

    if (action === 'ACTION_OPEN_SIDEPANEL') {
      const windowId = (sender.tab && sender.tab.windowId) || request.windowId || (request.payload && request.payload.windowId);
      if (chrome.sidePanel && chrome.sidePanel.open && windowId) {
        chrome.sidePanel.open({ windowId })
          .then(() => sendResponse({ source: 'JORGE_BACKGROUND', action: 'ACTION_OPEN_SIDEPANEL', success: true }))
          .catch((err) => sendResponse({ source: 'JORGE_BACKGROUND', action: 'ACTION_OPEN_SIDEPANEL', success: false, error: err.message }));
        return true;
      }
      sendResponse({ source: 'JORGE_BACKGROUND', action: 'ACTION_OPEN_SIDEPANEL', success: false, error: 'SidePanel API não disponível.' });
      return false;
    }

    if (action === 'ACTION_SYNC_STATE') {
      const syncData = request.data || (request.payload && request.payload.data);
      if (syncData && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(syncData, () => {
          if (!chrome.runtime.lastError) {
            sendResponse({ source: 'JORGE_BACKGROUND', action: 'ACTION_SYNC_STATE', success: true });
          } else {
            sendResponse({ source: 'JORGE_BACKGROUND', action: 'ACTION_SYNC_STATE', success: false, error: chrome.runtime.lastError.message });
          }
        });
        return true;
      }
    }

    return false;
  });
}
