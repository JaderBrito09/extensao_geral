/**
 * popup.js - Lógica da Interface do Usuário (Popup Multi-Frame)
 * 
 * Funcionalidade:
 * - Solicita a varredura da guia ativa E de todos os seus iframes (`allFrames: true`).
 * - Consolidação unificada de todos os arquivos/botões de download encontrados.
 * - Fornece feedback visual em tempo real (botão "Baixando...", toast de status verde/vermelho).
 */

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
      chrome.tabs.sendMessage(tab.id, { action: 'ACTION_SCAN_DOWNLOADS' }, (response) => {
        loadingSpinnerEl.classList.add('hidden');

        if (chrome.runtime.lastError) {
          console.warn('[Popup] Aviso de comunicação:', chrome.runtime.lastError.message);
        }

        if (response && response.success && Array.isArray(response.downloads) && response.downloads.length > 0) {
          renderDownloadList(response.downloads, tab.id);
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
    downloadListEl.innerHTML = '';
    fileCounterEl.textContent = `${downloads.length} arquivo${downloads.length > 1 ? 's' : ''} encontrado${downloads.length > 1 ? 's' : ''}`;

    downloads.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'download-item';

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';

      const fileName = document.createElement('span');
      fileName.className = 'file-name';
      fileName.textContent = item.filename;
      fileName.title = item.filename;

      const fileMeta = document.createElement('span');
      fileMeta.className = 'file-meta';
      fileMeta.textContent = `${item.strategy} • ${item.text.substring(0, 30)}`;

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

        if (item.type === 'direct_link' && item.url && chrome.downloads) {
          chrome.downloads.download({
            url: item.url,
            filename: item.filename,
            conflictAction: 'uniquify'
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              showStatusToast(`Erro no download: ${chrome.runtime.lastError.message}`, true);
              btnAction.textContent = originalText;
              btnAction.disabled = false;
            } else {
              showStatusToast(`Download iniciado: ${item.filename}`);
              setTimeout(() => { btnAction.textContent = 'Concluído'; }, 1000);
            }
          });
        } else {
          // Para botões JS / PrimeFaces, dispara o clique enviando mensagem com id
          chrome.tabs.sendMessage(tabId, { action: 'ACTION_TRIGGER_DOWNLOAD', id: item.id }, (response) => {
            if (chrome.runtime.lastError || !response || !response.success) {
              const errorMsg = (response && response.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Falha ao acionar botão.';
              console.error('[Popup] Erro ao disparar clique:', errorMsg);
              showStatusToast(`Erro: ${errorMsg}`, true);
              btnAction.textContent = originalText;
              btnAction.disabled = false;
            } else {
              showStatusToast(`Download iniciado para ${item.filename}`);
              setTimeout(() => { btnAction.textContent = 'Iniciado'; }, 1200);
            }
          });
        }
      });

      li.appendChild(fileInfo);
      li.appendChild(btnAction);
      downloadListEl.appendChild(li);
    });
  }

  btnRefresh.addEventListener('click', scanActiveTab);
  scanActiveTab();
});
