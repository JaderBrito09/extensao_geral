// Background Service Worker (Manifest V3)
// Gerencia eventos globais da extensão Assistente do Jorge

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background ServiceWorker] Extensão Assistente do Jorge instalada com sucesso.');
});

// Listener global para gerenciar erros não capturados na comunicação
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PING') {
    sendResponse({ status: 'PONG' });
    return true;
  }
});
