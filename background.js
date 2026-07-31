// Background Service Worker (Manifest V3)
// Gerencia eventos globais da extensão Assistente do Jorge

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background ServiceWorker] Extensão Assistente do Jorge instalada com sucesso.');
});

// Configura o comportamento do SidePanel no Chrome (abre ao clicar no ícone da extensão se ativado)
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn('[Background] Aviso ao configurar sidePanel behavior:', err));
}
