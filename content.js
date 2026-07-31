/**
 * content.js - Motor Universal de Extração de Downloads (Com Resolução Ancestral por `.closest()`)
 * 
 * Funcionalidade:
 * - Varre a página ativa e todos os seus iframes.
 * - Localiza links diretos, botões AJAX (PrimeFaces.ab, JSF, ASP.NET WebForms) e elementos interativos.
 * - Resolve automaticamente o elemento clicável pai a partir de textos em spans descendentes
 *   (ex: <span class="ui-button-text">Download Anexo</span> -> ancestral <button> ou <a href="#">).
 */

(function () {
    if (window.__universalDownloadExtractorInjected) {
        return;
    }
    window.__universalDownloadExtractorInjected = true;

    // Regex para identificar extensões de arquivos comuns em texto ou URLs
    const FILE_EXT_REGEX = /\.(pdf|zip|rar|7z|xlsx|xls|docx|doc|xml|csv|txt|png|jpg|jpeg|gz|tar)(?:[\?#]|$)/i;
    const FILE_KEYWORDS_REGEX = /(?:anexo|download|documento|relat[oó]rio|arquivo|comprovante|nota fiscal|pdf|xml|excel|baixar|exportar)/i;

    /**
     * Coleta informações de todos os downloads disponíveis na página ativa.
     */
    function collectDownloadButtonInfo() {
        const results = [];
        const seenElements = new Set();
        let counter = 0;

        console.log('[ContentScript - Universal Extractor] Iniciando varredura no frame:', window.location.href);

        // ---------------------------------------------------------------------
        // ESTRATÉGIA 1: Links Diretos HTML5 ou Href para Arquivos
        // ---------------------------------------------------------------------
        const anchorElements = document.querySelectorAll('a[href], a[download]');
        anchorElements.forEach((anchor) => {
            const href = anchor.getAttribute('href') || '';
            const downloadAttr = anchor.getAttribute('download');
            const hasFileExt = FILE_EXT_REGEX.test(href);
            const isDownloadAnchor = downloadAttr !== null || hasFileExt || (href.toLowerCase().includes('download') && !href.startsWith('#'));

            if (isDownloadAnchor && !seenElements.has(anchor)) {
                seenElements.add(anchor);
                const extId = `ext-dl-id-${++counter}`;
                anchor.setAttribute('data-ext-download-id', extId);

                let filename = downloadAttr || extractFilenameFromUrl(href) || extractFilenameFromContext(anchor) || 'arquivo_desconhecido.pdf';

                results.push({
                    id: extId,
                    filename: sanitizeFilename(filename),
                    type: 'direct_link',
                    strategy: 'HTML5 Direct Link / Href',
                    text: getElementLabel(anchor) || filename,
                    url: anchor.href
                });
            }
        });

        // ---------------------------------------------------------------------
        // ESTRATÉGIA 2: Resolução Ancestral por .closest() em Spans/Rótulos Descendentes
        // Garante que <span class="ui-button-text">Download Anexo</span> resolva o pai <button> ou <a>
        // ---------------------------------------------------------------------
        const labelElements = document.querySelectorAll('span, i, label, b, strong, p');
        labelElements.forEach((labelEl) => {
            const textContent = labelEl.innerText ? labelEl.innerText.trim() : '';
            
            if (textContent && FILE_KEYWORDS_REGEX.test(textContent) && textContent.length < 60) {
                // Tenta localizar o ancestral interativo clicável mais próximo
                const parentInteractive = labelEl.closest('button, a, [onclick], [role="button"], input[type="button"], input[type="submit"], .ui-button, .ui-commandlink');
                
                if (parentInteractive && !seenElements.has(parentInteractive)) {
                    seenElements.add(parentInteractive);
                    const extId = `ext-dl-id-${++counter}`;
                    parentInteractive.setAttribute('data-ext-download-id', extId);

                    const onclickAttr = parentInteractive.getAttribute('onclick') || '';
                    const isPrimeFaces = onclickAttr.includes('PrimeFaces.ab') || onclickAttr.includes('pf(') || parentInteractive.classList.contains('ui-button');
                    const isAspNet = onclickAttr.includes('__doPostBack');
                    let frameworkName = isPrimeFaces ? 'PrimeFaces' : (isAspNet ? 'ASP.NET' : 'Generic JS/DOM');

                    let filename = extractFilenameFromContext(parentInteractive) || textContent || 'arquivo_desconhecido.pdf';

                    results.push({
                        id: extId,
                        filename: sanitizeFilename(filename),
                        type: 'js_button',
                        strategy: `Ancestral .closest() (${frameworkName})`,
                        text: textContent || getElementLabel(parentInteractive),
                        url: null
                    });
                }
            }
        });

        // ---------------------------------------------------------------------
        // ESTRATÉGIA 3: Botões JS / Frameworks Corporativos Diretos
        // ---------------------------------------------------------------------
        const interactiveElements = document.querySelectorAll(`
            [onclick*="PrimeFaces.ab"],
            [onclick*="pf("],
            .ui-button,
            .ui-commandlink,
            button,
            input[type="button"],
            input[type="submit"],
            a[onclick],
            a[href^="javascript:"]
        `);

        interactiveElements.forEach((el) => {
            if (seenElements.has(el)) return;

            const onclickAttr = el.getAttribute('onclick') || '';
            const idAttr = el.id || '';
            const labelText = getElementLabel(el);

            const isPrimeFaces = onclickAttr.includes('PrimeFaces.ab') || onclickAttr.includes('pf(') || el.className.includes('ui-button');
            const isAspNet = onclickAttr.includes('__doPostBack');
            const isGenericJsDownload = /download|export|imprimir|baixar|gerar|anexo/i.test(onclickAttr) || /download|export|imprimir|baixar|gerar|anexo/i.test(idAttr) || FILE_KEYWORDS_REGEX.test(labelText);

            if (isPrimeFaces || isAspNet || isGenericJsDownload) {
                seenElements.add(el);
                const extId = `ext-dl-id-${++counter}`;
                el.setAttribute('data-ext-download-id', extId);

                let frameworkName = isPrimeFaces ? 'PrimeFaces' : (isAspNet ? 'ASP.NET' : 'Generic JS');
                let filename = extractFilenameFromContext(el) || labelText || 'arquivo_desconhecido.pdf';

                results.push({
                    id: extId,
                    filename: sanitizeFilename(filename),
                    type: 'js_button',
                    strategy: `AJAX/PostBack (${frameworkName})`,
                    text: labelText || `Download (${frameworkName})`,
                    url: null
                });
            }
        });

        // ---------------------------------------------------------------------
        // ESTRATÉGIA 4: Refinamento por Contexto de Linha (Tabelas e Grids)
        // ---------------------------------------------------------------------
        const tableRows = document.querySelectorAll('tr, .ui-datatable-data tr, div[role="row"]');
        tableRows.forEach((row) => {
            const actionBtns = row.querySelectorAll('[data-ext-download-id]');
            actionBtns.forEach((actionBtn) => {
                const extId = actionBtn.getAttribute('data-ext-download-id');
                const existingItem = results.find(r => r.id === extId);

                if (existingItem) {
                    const refinedName = extractFilenameFromRowCells(row, actionBtn);
                    if (refinedName && (existingItem.filename === 'arquivo_desconhecido.pdf' || existingItem.filename.toLowerCase().includes('download anexo'))) {
                        existingItem.filename = sanitizeFilename(refinedName);
                    }
                }
            });
        });

        console.log(`[ContentScript - Universal Extractor] Varredura no frame concluída. ${results.length} downloads encontrados.`);
        return results;
    }

    function getElementLabel(el) {
        if (!el) return '';
        const titleAttr = el.getAttribute('title') || el.getAttribute('aria-label');
        if (titleAttr && titleAttr.trim()) return titleAttr.trim();

        const uiButtonText = el.querySelector('.ui-button-text, .ui-c, span');
        if (uiButtonText && uiButtonText.innerText.trim()) {
            return uiButtonText.innerText.trim();
        }

        return el.innerText ? el.innerText.trim() : (el.value ? el.value.trim() : '');
    }

    function extractFilenameFromContext(element) {
        const directTitle = element.getAttribute('title') || element.getAttribute('aria-label');
        if (directTitle && (FILE_EXT_REGEX.test(directTitle) || (FILE_KEYWORDS_REGEX.test(directTitle) && !directTitle.toLowerCase().includes('download anexo')))) {
            return directTitle;
        }

        const row = element.closest('tr, div[role="row"], .ui-widget-content');
        if (row) {
            const rowFilename = extractFilenameFromRowCells(row, element);
            if (rowFilename) return rowFilename;
        }

        return null;
    }

    function extractFilenameFromRowCells(row, actionElement) {
        const cells = Array.from(row.querySelectorAll('td, th, div[role="cell"], .ui-dt-c'));
        
        for (const cell of cells) {
            const text = cell.innerText.trim();
            if (FILE_EXT_REGEX.test(text)) {
                return text;
            }
        }

        for (const cell of cells) {
            const specificSpan = cell.querySelector('.filename, .nome-arquivo, [class*="nome"], [class*="descricao"], .ui-column-title');
            if (specificSpan && specificSpan.innerText.trim() && !cell.contains(actionElement)) {
                return specificSpan.innerText.trim();
            }
        }

        for (const cell of cells) {
            if (cell.contains(actionElement)) continue;
            const text = cell.innerText.trim();
            if (text && text.length > 2 && !/^\d+$/.test(text) && !/ações|acoes|opções|download/i.test(text)) {
                return FILE_EXT_REGEX.test(text) ? text : `${text}.pdf`;
            }
        }

        return null;
    }

    function extractFilenameFromUrl(url) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            const pathname = parsedUrl.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            if (filename && FILE_EXT_REGEX.test(filename)) {
                return decodeURIComponent(filename);
            }
        } catch (e) {}
        return null;
    }

    function sanitizeFilename(filename) {
        if (!filename) return 'arquivo_desconhecido.pdf';
        let sanitized = filename.replace(/[\r\n\t]+/g, ' ').replace(/[\\/:*?"<>|]/g, '_').trim();
        if (!FILE_EXT_REGEX.test(sanitized)) {
            sanitized += '.pdf';
        }
        return sanitized.length > 100 ? sanitized.substring(0, 97) + '...' : sanitized;
    }

    function triggerDownloadElement(extId) {
        const element = document.querySelector(`[data-ext-download-id="${extId}"]`);
        if (!element) {
            console.error(`[ContentScript - Universal Extractor] Elemento "${extId}" não foi encontrado neste frame (${window.location.href}).`);
            return { success: false, error: 'Elemento não encontrado neste frame.' };
        }

        try {
            console.log(`[ContentScript - Universal Extractor] Executando clique nativo em "${extId}"...`);
            element.focus();
            element.click();
            return { success: true };
        } catch (err) {
            console.error(`[ContentScript - Universal Extractor] Erro ao clicar no elemento "${extId}":`, err);
            return { success: false, error: err.message || 'Falha ao disparar o botão.' };
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'ACTION_SCAN_DOWNLOADS') {
            try {
                const downloads = collectDownloadButtonInfo();
                sendResponse({ success: true, downloads: downloads, frameUrl: window.location.href });
            } catch (err) {
                console.error('[ContentScript - Universal Extractor] Erro durante a varredura:', err);
                sendResponse({ success: false, error: err.message, downloads: [] });
            }
            return true;
        }

        if (request.action === 'ACTION_TRIGGER_DOWNLOAD') {
            const result = triggerDownloadElement(request.id);
            sendResponse(result);
            return true;
        }
    });

    console.log('[ContentScript - Universal Extractor] Script pronto e escutando no frame:', window.location.href);
})();
