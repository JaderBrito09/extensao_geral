// src/sidepanel/files.js
import { renderPageFilesUI, renderAttachedFilesUI, appendMessageUI } from './ui.js';
import { activeSkillKey } from './skills.js';
import { currentUser } from './auth.js';

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
    return Array.from(fileMap.values());
}

export function getAttachedFiles() {
    return attachedFiles;
}

export function clearAttachedFiles() {
    attachedFiles = [];
    renderAttachedFilesUI(attachedFiles, removeAttachedFile);
}

// --- File Logic ---

export async function extrairConteudoGoogleDocOuSheet(url, tokenOverride = null) {
  if (!url) return null;
  
  let token = tokenOverride || currentUser?.token || null;
  if (!token && typeof chrome !== 'undefined' && chrome.identity) {
    try {
      token = await new Promise((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, (t) => resolve(t || null));
      });
    } catch (e) {
      console.warn("Nenhum token silencioso obtido para Google API:", e);
    }
  }

  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);

  if (docMatch && docMatch[1]) {
    const documentId = docMatch[1];
    if (token) {
      try {
        const apiResp = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apiResp.ok) {
          const docData = await apiResp.json();
          const title = docData.title || "Google Document";
          let docText = "";
          if (docData.body && docData.body.content) {
            docData.body.content.forEach(element => {
              if (element.paragraph && element.paragraph.elements) {
                element.paragraph.elements.forEach(elem => {
                  if (elem.textRun && elem.textRun.content) {
                    docText += elem.textRun.content;
                  }
                });
              }
            });
          }
          return `[DOCUMENTO GOOGLE DOCS: "${title}"]\n\n${docText.trim()}`;
        }
      } catch (err) {
        console.warn("Falha na chamada Docs API v1:", err);
      }
    }

    try {
      const exportResp = await fetch(`https://docs.google.com/document/d/${documentId}/export?format=txt`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (exportResp.ok) {
        const txt = await exportResp.text();
        return `[DOCUMENTO GOOGLE DOCS (Export TXT)]:\n\n${txt.trim()}`;
      }
    } catch (e) {
      console.warn("Falha no export TXT do Google Docs:", e);
    }
  }

  if (sheetMatch && sheetMatch[1]) {
    const sheetId = sheetMatch[1];
    if (token) {
      try {
        const apiResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?includeGridData=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apiResp.ok) {
          const sheetData = await apiResp.json();
          const title = sheetData.properties?.title || "Planilha Google Sheets";
          let out = `[PLANILHA GOOGLE SHEETS: "${title}"]\n`;
          if (sheetData.sheets) {
            sheetData.sheets.forEach(s => {
              out += `\n--- Aba: ${s.properties?.title || 'Sem título'} ---\n`;
              const rowData = s.data?.[0]?.rowData || [];
              rowData.slice(0, 100).forEach(r => {
                const vals = (r.values || []).map(v => v.formattedValue || v.userEnteredValue?.stringValue || "").join(" | ");
                if (vals.trim()) out += vals + "\n";
              });
            });
          }
          return out.trim();
        }
      } catch (err) {
        console.warn("Falha na chamada Sheets API v4:", err);
      }
    }

    try {
      const exportResp = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (exportResp.ok) {
        const csv = await exportResp.text();
        return `[PLANILHA GOOGLE SHEETS (Export CSV)]:\n\n${csv.trim()}`;
      }
    } catch (e) {
      console.warn("Falha no export CSV do Google Sheets:", e);
    }
  }

  return null;
}

export function converterMarkdownParaTxtFormatado(markdownText) {
  if (!markdownText) return "";

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');

  let txt = `================================================================================\n`;
  txt += `                     RELATÓRIO DE ANÁLISE - ASSISTENTE DO JORGE\n`;
  txt += `================================================================================\n`;
  txt += `Data de Geração: ${dateStr}\n`;
  txt += `--------------------------------------------------------------------------------\n\n`;

  let lines = markdownText.split(/\r?\n/);
  let inCodeBlock = false;
  let inTable = false;
  let tableRows = [];

  function processTable(rows) {
    if (!rows || rows.length === 0) return "";
    const parsed = rows.map(r => r.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1));
    const dataRows = parsed.filter(row => !row.every(cell => /^[:\-\s]+$/.test(cell)));
    if (dataRows.length === 0) return "";

    const colCount = Math.max(...dataRows.map(r => r.length));
    const colWidths = new Array(colCount).fill(0);

    dataRows.forEach(row => {
      for (let i = 0; i < colCount; i++) {
        const val = row[i] || "";
        colWidths[i] = Math.max(colWidths[i], val.length);
      }
    });

    for (let i = 0; i < colCount; i++) {
      colWidths[i] = Math.max(colWidths[i], 5);
    }

    let result = "";
    const border = "+" + colWidths.map(w => "-".repeat(w + 2)).join("+") + "+\n";

    result += border;
    dataRows.forEach((row, rowIndex) => {
      let lineStr = "|";
      for (let i = 0; i < colCount; i++) {
        const val = (row[i] || "").padEnd(colWidths[i]);
        lineStr += ` ${val} |`;
      }
      result += lineStr + "\n";
      if (rowIndex === 0) {
        result += border;
      }
    });
    result += border + "\n";
    return result;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        txt += `┌────────────────────────────────────────────────────────────────────────┐\n`;
      } else {
        txt += `└────────────────────────────────────────────────────────────────────────┘\n\n`;
      }
      continue;
    }

    if (inCodeBlock) {
      txt += `│  ${line}\n`;
      continue;
    }

    if (line.trim().startsWith('|')) {
      inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      inTable = false;
      txt += processTable(tableRows);
      tableRows = [];
    }

    if (line.startsWith('# ')) {
      const title = line.replace(/^#\s+/, '').toUpperCase().trim();
      txt += `\n================================================================================\n`;
      txt += `  ${title}\n`;
      txt += `================================================================================\n\n`;
      continue;
    }

    if (line.startsWith('## ')) {
      const section = line.replace(/^##\s+/, '').toUpperCase().trim();
      txt += `\n--------------------------------------------------------------------------------\n`;
      txt += `  ${section}\n`;
      txt += `--------------------------------------------------------------------------------\n\n`;
      continue;
    }

    if (line.startsWith('### ')) {
      const subsection = line.replace(/^###\s+/, '').trim();
      txt += `\n► ${subsection.toUpperCase()}\n`;
      txt += `--------------------------------------------------\n`;
      continue;
    }

    if (line.startsWith('#### ') || line.startsWith('##### ') || line.startsWith('###### ')) {
      const sub = line.replace(/^#{4,6}\s+/, '').trim();
      txt += `\n▪ ${sub}\n`;
      continue;
    }

    if (line.startsWith('> ')) {
      txt += `│  ${line.replace(/^>\s+/, '')}\n`;
      continue;
    }

    if (/^\s*[\*\-\+]\s+/.test(line)) {
      const item = line.replace(/^\s*[\*\-\+]\s+/, '').trim();
      const cleanItem = item.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      txt += `  • ${cleanItem}\n`;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const item = line.replace(/^\s*(\d+\.)\s+/, '$1 ').trim();
      const cleanItem = item.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      txt += `  ${cleanItem}\n`;
      continue;
    }

    let cleanLine = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, "'$1'");

    txt += cleanLine + "\n";
  }

  if (inTable && tableRows.length > 0) {
    txt += processTable(tableRows);
  }

  txt += `\n================================================================================\n`;
  txt += `Fim do Relatório - Gerado automaticamente pelo Assistente do Jorge\n`;
  txt += `================================================================================\n`;

  return txt;
}

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
    appendMessageUI(
        `📄 **Arquivo Selecionado: ${file.name}**\n\n` +
        `Para analisar este arquivo, por favor, baixe-o para seu computador e anexe-o à conversa usando o botão 📎.`,
        'ai-msg'
    );

    if (file.url && file.url !== '#') {
        chrome.downloads.download({ url: file.url, filename: file.name, saveAs: true });
    }
}

function baixarTodosArquivos() {
    detectedPageFiles.forEach(baixarArquivoUnitario);
}

async function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
        const content = await file.text();
        attachedFiles.push({ name: file.name, type: file.type || 'text/plain', content });
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

        if (tab.url.includes('docs.google.com/document') || tab.url.includes('docs.google.com/spreadsheets')) {
          const googleExtracted = await extrairConteudoGoogleDocOuSheet(tab.url);
          if (googleExtracted) return googleExtracted;
        }

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
    chrome.tabs?.onActivated?.addListener(carregarArquivosPagina);
    chrome.tabs?.onUpdated?.addListener((tabId, info) => info.status === 'complete' && carregarArquivosPagina());
}
