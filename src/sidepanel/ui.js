// src/sidepanel/ui.js
import { converterMarkdownParaTxtFormatado } from './files.js';

// Exporta referências a elementos do DOM para serem usados por outros módulos
export const mainAppScreen = document.getElementById('main-app-screen');
export const loginScreen = document.getElementById('login-screen');
export const accessDeniedScreen = document.getElementById('access-denied-screen');

export const userAvatar = document.getElementById('user-avatar');
export const userName = document.getElementById('user-name');
export const userEmail = document.getElementById('user-email');

export const googleLoginBtn = document.getElementById('google-login-btn');
export const googleLogoutBtn = document.getElementById('google-logout-btn');
export const retryAuthBtn = document.getElementById('retry-auth-btn');
export const deniedLogoutBtn = document.getElementById('denied-logout-btn');
export const deniedUserEmail = document.getElementById('denied-user-email');
export const loginErrorMsg = document.getElementById('login-error-msg');

export const historyEl = document.getElementById('chat-history');
export const sendBtn = document.getElementById('send-btn');
export const userInputEl = document.getElementById('user-input');
export const newChatBtn = document.getElementById('new-chat-btn');
export const historySessionsList = document.getElementById('history-sessions-list');

// Handler de clique em opção interativa configurável
let interactiveOptionHandler = null;

export function setInteractiveOptionHandler(handler) {
    interactiveOptionHandler = handler;
}

// Função utilitária para escapar HTML e prevenir XSS
export function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Renderiza um card interativo com botões de opção rápida
 */
export function renderizarCardInterativo(containerEl, dadosPrompt, customCallback = null) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'interactive-option-card';

    if (dadosPrompt.title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'interactive-title';
        titleEl.textContent = dadosPrompt.title;
        cardDiv.appendChild(titleEl);
    }

    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'interactive-options-group';

    (dadosPrompt.options || []).forEach((opcao, idx) => {
        const btn = document.createElement('button');
        btn.className = 'interactive-option-btn';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'option-label';
        labelSpan.textContent = opcao.label || opcao.text || `Opção ${idx + 1}`;

        if (opcao.badge) {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'option-badge';
            badgeSpan.textContent = opcao.badge;
            btn.appendChild(badgeSpan);
        }

        btn.appendChild(labelSpan);

        btn.addEventListener('click', () => {
            optionsGroup.querySelectorAll('.interactive-option-btn').forEach(b => {
                b.disabled = true;
                b.classList.add('disabled');
            });
            btn.classList.add('selected');

            if (opcao.action === 'upload_file' || opcao.action === 'attach_file') {
                const fileInput = document.getElementById('file-input');
                if (fileInput) {
                    if (opcao.accept) fileInput.setAttribute('accept', opcao.accept);
                    else fileInput.removeAttribute('accept');
                    fileInput.click();
                }
            } else {
                const textoParaEnviar = opcao.value || opcao.label || opcao.text;
                if (customCallback) {
                    customCallback(textoParaEnviar);
                } else if (interactiveOptionHandler) {
                    interactiveOptionHandler(textoParaEnviar);
                } else if (userInputEl) {
                    userInputEl.value = textoParaEnviar;
                    sendBtn?.click();
                }
            }
        });

        optionsGroup.appendChild(btn);
    });

    cardDiv.appendChild(optionsGroup);
    containerEl.appendChild(cardDiv);
}

/**
 * Adiciona uma mensagem ao histórico do chat de forma segura.
 */
export function appendMessageUI(content, className = 'ai-msg', isLoading = false, isWelcomeMessage = false) {
    if (!historyEl) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;

    if (isLoading) {
        messageDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        historyEl.appendChild(messageDiv);
        historyEl.scrollTop = historyEl.scrollHeight;
        return messageDiv;
    }

    if (className.includes('user-msg')) {
        messageDiv.textContent = content;
        historyEl.appendChild(messageDiv);
        historyEl.scrollTop = historyEl.scrollHeight;
        return messageDiv;
    }

    const contentStr = typeof content === 'string' ? content : String(content || '');
    const jsonMatch = contentStr.match(/```json\s*([\s\S]*?)\s*```/);
    let parsedInteractive = null;

    if (jsonMatch) {
        try {
            const data = JSON.parse(jsonMatch[1]);
            if (data && data.type === 'interactive_prompt' && Array.isArray(data.options)) {
                parsedInteractive = data;
            }
        } catch (e) {}
    }

    if (parsedInteractive) {
        const textWithoutJson = contentStr.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
        if (textWithoutJson) {
            const textContainer = document.createElement('div');
            const parsedHtml = (typeof marked !== 'undefined') ? marked.parse(textWithoutJson) : textWithoutJson;
            textContainer.innerHTML = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(parsedHtml) : parsedHtml;
            messageDiv.appendChild(textContainer);
        }
        renderizarCardInterativo(messageDiv, parsedInteractive);
    } else {
        const parsedHtml = (typeof marked !== 'undefined') ? marked.parse(contentStr) : contentStr;
        messageDiv.innerHTML = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(parsedHtml) : parsedHtml;
    }

    if (className.includes('ai-msg') && !isLoading && !isWelcomeMessage && !parsedInteractive && contentStr.length > 500) {
        const downloadFooter = document.createElement('div');
        downloadFooter.className = 'md-download-footer';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'md-download-btn';
        downloadBtn.title = 'Baixar este relatório em formato de texto (.txt)';
        downloadBtn.innerHTML = '📥 <span>Baixar relatório (.txt)</span>';
        
        downloadBtn.addEventListener('click', () => {
            const txtFormatted = converterMarkdownParaTxtFormatado(contentStr);
            const blob = new Blob([txtFormatted], { type: 'text/plain;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = `relatorio_jorge_${timestamp}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        downloadFooter.appendChild(downloadBtn);
        messageDiv.appendChild(downloadFooter);
    }

    historyEl.appendChild(messageDiv);
    historyEl.scrollTop = historyEl.scrollHeight;
    return messageDiv;
}

/**
 * Renderiza o painel de arquivos detectados na página.
 */
export function renderPageFilesUI(files, onDownloadClick) {
    const pageFilesList = document.getElementById('page-files-list');
    const pageFilesPanel = document.getElementById('page-files-panel');
    const pageFilesCount = document.getElementById('page-files-count');
    
    if (!pageFilesList || !pageFilesPanel || !pageFilesCount) return;

    pageFilesList.innerHTML = '';
    if (!files || files.length === 0) {
        pageFilesPanel.classList.add('hidden');
        return;
    }

    pageFilesCount.textContent = files.length;
    pageFilesPanel.classList.remove('hidden');

    files.forEach((file) => {
        const li = document.createElement('li');
        li.className = 'page-file-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'page-file-name';
        nameSpan.textContent = file.name;
        nameSpan.title = file.url !== '#' ? file.url : file.name;

        const dlBtn = document.createElement('button');
        dlBtn.className = 'download-file-btn';
        dlBtn.innerHTML = '⬇️';
        dlBtn.title = `Baixar ${file.name}`;
        dlBtn.addEventListener('click', () => onDownloadClick(file));

        li.appendChild(nameSpan);
        li.appendChild(dlBtn);
        pageFilesList.appendChild(li);
    });
}

/**
 * Renderiza os arquivos que o usuário anexou manualmente.
 */
export function renderAttachedFilesUI(files, onRemoveClick) {
    const attachedFilesContainer = document.getElementById('attached-files-container');
    if (!attachedFilesContainer) return;
    
    attachedFilesContainer.innerHTML = '';
    if (!files || files.length === 0) {
        attachedFilesContainer.classList.add('hidden');
        return;
    }
    
    attachedFilesContainer.classList.remove('hidden');
    attachedFilesContainer.textContent = `${files.length} arquivo(s) anexado(s).`;
}

export function initUI() {
    if (userInputEl) {
        userInputEl.addEventListener('input', () => {
            userInputEl.style.height = 'auto';
            userInputEl.style.height = `${userInputEl.scrollHeight}px`;
        });
    }
}

/**
 * Renderiza a lista de sessões de chat no painel de histórico.
 */
export function renderHistoryList(sessions, activeChatId, onSessionClick, onDeleteClick) {
    if (!historySessionsList) return;
    historySessionsList.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        const li = document.createElement('li');
        li.className = 'history-session-item';
        li.textContent = 'Nenhuma conversa anterior salva.';
        historySessionsList.appendChild(li);
        return;
    }

    sessions.forEach(session => {
        const li = document.createElement('li');
        li.className = `history-session-item ${session.id === activeChatId ? 'active' : ''}`;
        li.setAttribute('data-session-id', session.id);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-session-info';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-session-title';
        titleSpan.textContent = escapeHtml(session.title || 'Conversa sem título');

        const dateStr = session.updatedAt ? new Date(session.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
        const dateSpan = document.createElement('span');
        dateSpan.className = 'history-session-date';
        dateSpan.textContent = `${dateStr} (${session.messages?.length || 0} msgs)`;

        infoDiv.appendChild(titleSpan);
        infoDiv.appendChild(dateSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn-sm delete-session-btn';
        deleteBtn.title = 'Excluir conversa';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onDeleteClick(session.id);
        });
        
        li.appendChild(infoDiv);
        li.appendChild(deleteBtn);
        
        li.addEventListener('click', () => {
            onSessionClick(session.id);
        });

        historySessionsList.appendChild(li);
    });
}
