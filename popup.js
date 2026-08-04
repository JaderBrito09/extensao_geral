/**
 * popup.js - Lógica da Interface do Usuário (Popup Multi-Frame)
 * 
 * Funcionalidade:
 * - Solicita a varredura da guia ativa E de todos os seus iframes (`allFrames: true`).
 * - Consolidação unificada e sincronização via chrome.storage com o Sidepanel.
 * - Fornece feedback visual em tempo real (botão "Baixando...", toast de status verde/vermelho).
 * - Utiliza listeners isolados para evitar vazamento de estado.
 */

/**
 * Protocolo de Mensagens Padronizadas para o Popup
 */
function createStandardMessage(source, action, payload = {}, target = '*') {
  return {
    source: source || 'JORGE_POPUP',
    target: target || '*',
    action: action,
    payload: payload,
    timestamp: Date.now()
  };
}

function isStandardMessage(data) {
  return data && typeof data === 'object' && typeof data.source === 'string' && data.source.startsWith('JORGE_') && typeof data.action === 'string';
}

document.addEventListener('DOMContentLoaded', () => {
  const downloadListEl = document.getElementById('download-list');
  const emptyStateEl = document.getElementById('empty-state');
  const loadingSpinnerEl = document.getElementById('loading-spinner');
  const statusToastEl = document.getElementById('status-toast');
  const toastMessageEl = document.getElementById('toast-message');
  const fileCounterEl = document.getElementById('file-counter');
  const btnRefresh = document.getElementById('btn-refresh');

  let toastTimeout = null;

  function showStatusToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessageEl.textContent = message;
    statusToastEl.className = `toast ${isError ? 'error' : 'success'}`;
    toastTimeout = setTimeout(() => {
      statusToastEl.className = 'toast hidden';
    }, 3500);
  }

  // Sincronização via Storage Local para ler arquivos já detectados
  async function loadCachedFiles() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    try {
      const { detected_page_files = [] } = await chrome.storage.local.get('detected_page_files');
      if (Array.isArray(detected_page_files) && detected_page_files.length > 0) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        renderDownloadList(detected_page_files, tab ? tab.id : null);
      }
    } catch (e) {
      console.warn('[Popup] Erro ao carregar cache de arquivos:', e);
    }
  }

  async function scanActiveTab() {
    loadingSpinnerEl.classList.remove('hidden');
    emptyStateEl.classList.add('hidden');
    downloadListEl.innerHTML = '';
    fileCounterEl.textContent = 'Buscando arquivos...';

    console.log('[Popup] Consultando aba ativa e seus frames...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('Nenhuma aba ativa identificada.');

      // Garante injeção em todos os frames da aba ativa
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content.js']
      }).catch((err) => {
        console.warn('[Popup] Execução de script multi-frame (aviso):', err.message);
      });

      // Envia mensagem única para escanear a página
      chrome.tabs.sendMessage(tab.id, { target: 'content', action: 'ACTION_SCAN_DOWNLOADS' }, (response) => {
        loadingSpinnerEl.classList.add('hidden');

        if (chrome.runtime.lastError) {
          console.warn('[Popup] Aviso de comunicação:', chrome.runtime.lastError.message);
        }

        if (response && response.success && Array.isArray(response.downloads) && response.downloads.length > 0) {
          // Normaliza os itens baixados para a estrutura unificada
          const normalizedDownloads = response.downloads.map(item => ({
            id: item.id,
            name: item.filename || item.name,
            filename: item.filename || item.name,
            type: item.type,
            strategy: item.strategy || 'Universal Extractor',
            text: item.text || item.filename || '',
            url: item.url || '#'
          }));

          renderDownloadList(normalizedDownloads, tab.id);

          // Salva no storage local para manter sincronizado com o Sidepanel
          if (chrome.storage) {
            chrome.storage.local.set({ detected_page_files: normalizedDownloads }).catch(() => {});
          }
        } else {
          emptyStateEl.classList.remove('hidden');
          fileCounterEl.textContent = '0 arquivos encontrados';
        }
      });
    } catch (err) {
      loadingSpinnerEl.classList.add('hidden');
      emptyStateEl.classList.remove('hidden');
      fileCounterEl.textContent = '0 arquivos encontrados';
      console.error('[Popup] Falha ao escanear página:', err);
      showStatusToast(`Falha ao escanear: ${err.message}`, true);
    }
  }

  function renderDownloadList(downloads, tabId) {
    loadingSpinnerEl.classList.add('hidden');
    downloadListEl.innerHTML = '';

    if (!downloads || downloads.length === 0) {
      emptyStateEl.classList.remove('hidden');
      fileCounterEl.textContent = '0 arquivos encontrados';
      return;
    }

    emptyStateEl.classList.add('hidden');
    fileCounterEl.textContent = `${downloads.length} arquivo${downloads.length > 1 ? 's' : ''} encontrado${downloads.length > 1 ? 's' : ''}`;

    downloads.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'download-item';

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';

      const fileName = document.createElement('span');
      fileName.className = 'file-name';
      const displayName = item.filename || item.name || 'arquivo_download';
      fileName.textContent = displayName;
      fileName.title = displayName;

      const fileMeta = document.createElement('span');
      fileMeta.className = 'file-meta';
      const strategyText = item.strategy || 'Universal Extractor';
      const detailText = item.text ? item.text.substring(0, 30) : displayName;
      fileMeta.textContent = `${strategyText} • ${detailText}`;

      fileInfo.appendChild(fileName);
      fileInfo.appendChild(fileMeta);

      const btnAction = document.createElement('button');
      btnAction.className = 'btn-download-action';
      btnAction.textContent = 'Download';

      btnAction.addEventListener('click', async () => {
        const originalText = btnAction.textContent;
        btnAction.textContent = 'Baixando...';
        btnAction.disabled = true;

        console.log(`[Popup] Iniciando download do item ID "${item.id}" (Tipo: ${item.type})...`);

        if (item.type === 'direct_link' && item.url && item.url !== '#' && chrome.downloads) {
          chrome.downloads.download({
            url: item.url,
            filename: displayName,
            conflictAction: 'uniquify'
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              showStatusToast(`Erro no download: ${chrome.runtime.lastError.message}`, true);
              btnAction.textContent = originalText;
              btnAction.disabled = false;
            } else {
              showStatusToast(`Download iniciado: ${displayName}`);
              setTimeout(() => { btnAction.textContent = 'Concluído'; }, 1000);
            }
          });
        } else {
          // Para botões JS / PrimeFaces, dispara o clique enviando mensagem isolada para o content script
          const targetTabId = tabId || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
          if (targetTabId) {
            chrome.tabs.sendMessage(targetTabId, { target: 'content', action: 'ACTION_TRIGGER_DOWNLOAD', id: item.id }, (response) => {
              if (chrome.runtime.lastError || !response || !response.success) {
                const errorMsg = (response && response.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Falha ao acionar botão.';
                console.error('[Popup] Erro ao disparar clique:', errorMsg);
                showStatusToast(`Erro: ${errorMsg}`, true);
                btnAction.textContent = originalText;
                btnAction.disabled = false;
              } else {
                showStatusToast(`Download iniciado para ${displayName}`);
                setTimeout(() => { btnAction.textContent = 'Iniciado'; }, 1200);
              }
            });
          }
        }
      });

      li.appendChild(fileInfo);
      li.appendChild(btnAction);
      downloadListEl.appendChild(li);
    });
  }

  // Listener isolado de alterações no chrome.storage para manter sincronia em tempo real
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.detected_page_files) {
        const newFiles = changes.detected_page_files.newValue || [];
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
          renderDownloadList(newFiles, tab ? tab.id : null);
        }).catch(() => {
          renderDownloadList(newFiles, null);
        });
      }
    });
  }

  // Listener isolado de mensagens de runtime para o Popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.target && request.target !== 'popup') return false;

      if (request.action === 'ACTION_UPDATE_DOWNLOADS') {
        if (Array.isArray(request.downloads)) {
          renderDownloadList(request.downloads, request.tabId || null);
          sendResponse({ success: true });
          return true;
        }
      }
      return false;
    });
  }

  btnRefresh.addEventListener('click', scanActiveTab);
  
  // Inicialização: carrega do cache primeiro, depois faz a varredura
  loadCachedFiles();
  scanActiveTab();
});
