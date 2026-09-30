// src/sidepanel/files.js
import { renderPageFilesUI, renderAttachedFilesUI, appendMessageUI } from './ui.js';
import { activeSkillKey } from './skills.js';

// --- State ---
let detectedPageFiles = [];
let attachedFiles = [];

// --- Injected Functions ---
function extractPageFilesFromDOM() {
    const supportedExts = ['.pdf', '.txt', '.csv', '.json', '.docx', '.xlsx', '.doc', '.xls', '.zip', '.rar', '.7z', '.xml', '.md', '.ods', '.odt', '.png', '.jpg', '.jpeg'];
    const fileMap = new Map();
    document.querySelectorAll('a[href], [download], [data-href], embed[src], object[data], iframe[src]').forEach(el => {
        const rawUrl = el.href || el.getAttribute('download') || el.getAttribute('data-href') || el.src || el.data;
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.startsWith('javascript:') || rawUrl.startsWith('#')) return;
        try {
            const urlObj = new URL(rawUrl, document.baseURI);
            const pathname = urlObj.pathname.toLowerCase();
            if (supportedExts.some(ext => pathname.endsWith(ext)) || el.hasAttribute('download')) {
                let filename = el.getAttribute('download') || pathname.split('/').pop() || 'arquivo';
                if (!fileMap.has(urlObj.href)) {
                    fileMap.set(urlObj.href, { name: decodeURIComponent(filename).trim(), url: urlObj.href, isDomClick: false });
                }
            }
        } catch (e) {}
    });
    // Lógica simplificada. A completa será adicionada se necessário.
    return Array.from(fileMap.values());
}

function triggerDomDownloadInPage(fileInfo) {
    const el = document.querySelector(`[data-ext-download-id="${fileInfo.id}"]`);
    el?.click();
}

// --- File Logic ---

export async function carregarArquivosPagina() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
            detectedPageFiles = [];
            renderPageFilesUI(detectedPageFiles, baixarArquivoUnitario);
            return;
        }

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: extractPageFilesFromDOM
        }).catch(err => {
            console.error("[Files] Erro ao injetar script de extração:", err);
            return [];
        });

        detectedPageFiles = (results || []).flatMap(r => r.result || []);
        renderPageFilesUI(detectedPageFiles, baixarArquivoUnitario);
    } catch (err) {
        console.error("[Files] Erro ao carregar arquivos da página:", err);
    }
}

async function baixarArquivoUnitario(file) {
    if (!activeSkillKey) {
        appendMessageUI('⚠️ **Nenhuma Habilidade selecionada.**\nPor favor, selecione uma Habilidade para habilitar o download.', 'ai-msg');
        return;
    }
    
    appendMessageUI(
        `📄 **Arquivo Selecionado: ${file.name}**\n\n` +
        `Para analisar este arquivo, por favor, baixe-o para seu computador e anexe-o à conversa usando o botão 📎.`,
        'ai-msg'
    );

    if (file.url && file.url !== '#') {
        chrome.downloads.download({ url: file.url, filename: file.name, saveAs: true });
    } else {
        // Lógica para clique no DOM se necessário
    }
}

function baixarTodosArquivos() {
    detectedPageFiles.forEach(baixarArquivoUnitario);
}

async function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
        // Lógica de `readFileContent` (pdf, txt, etc.) virá aqui.
        const content = await file.text(); // Simplificado por enquanto
        attachedFiles.push({ name: file.name, type: file.type, content });
    }
    renderAttachedFilesUI(attachedFiles, removeAttachedFile);
}

function removeAttachedFile(fileName) {
    attachedFiles = attachedFiles.filter(f => f.name !== fileName);
    renderAttachedFilesUI(attachedFiles, removeAttachedFile);
}


function removeSuperfluousContent(doc) {
    doc.querySelectorAll('script, style, nav, footer, aside, form, noscript, iframe, header, .noprint, [aria-hidden="true"]').forEach(el => el.remove());
    return doc;
}

function extractMainContentText(doc) {
    const main = doc.querySelector('main');
    if (main) return main.innerText;
    const article = doc.querySelector('article');
    if (article) return article.innerText;
    return doc.body ? doc.body.innerText : '';
}

/**
 * Função injetada para extrair texto limpo do DOM da página ativa.
 */
function extractCleanDOMText() {
    const docClone = document.cloneNode(true);
    const cleanedDoc = removeSuperfluousContent(docClone);
    const text = extractMainContentText(cleanedDoc);
    return text.replace(/\s\s+/g, ' ').trim();
}


export async function extrairConteudoDaPagina() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || tab.url.startsWith('chrome://')) return "";

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: extractCleanDOMText
        });
        return (results || []).map(r => r.result).join('\n\n').trim();
    } catch (err) {
        console.error("Erro ao extrair conteúdo da página:", err);
        return "[Não foi possível extrair o conteúdo da página]";
    }
}


export function initFiles() {
    const fileInput = document.getElementById('file-input');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const optUploadFile = document.getElementById('opt-upload-file');

    optUploadFile?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', handleFileSelection);
    downloadAllBtn?.addEventListener('click', baixarTodosArquivos);

    carregarArquivosPagina();
    chrome.tabs.onActivated.addListener(carregarArquivosPagina);
    chrome.tabs.onUpdated.addListener((tabId, info) => info.status === 'complete' && carregarArquivosPagina());
}
