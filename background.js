// Background Service Worker (Manifest V3)
// Define abertura do Side Panel ao clicar no ícone da extensão na barra do Chrome

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error("Erro ao configurar comportamento do Side Panel:", error));
  }
});
