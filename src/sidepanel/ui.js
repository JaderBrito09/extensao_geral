// src/sidepanel/ui.js

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

// Função utilitária para escapar HTML e prevenir XSS
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Adiciona uma mensagem ao histórico do chat de forma segura.
 * @param {string} htmlContent - Conteúdo HTML da mensagem (será sanitizado).
 * @param {string} className - Classe CSS para a mensagem ('user-msg' ou 'ai-msg').
 * @param {boolean} isLoading - Se a mensagem deve mostrar um indicador de carregamento.
 */
export function appendMessageUI(htmlContent, className, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;

    if (isLoading) {
        messageDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    } else {
        // Sanitize o conteúdo HTML antes de inseri-lo no DOM
        messageDiv.innerHTML = DOMPurify.sanitize(htmlContent);
    }

    historyEl.appendChild(messageDiv);
    historyEl.scrollTop = historyEl.scrollHeight;
}

/**
 * Renderiza o painel de arquivos detectados na página.
 * @param {Array} files - A lista de arquivos detectados.
 * @param {Function} onDownloadClick - Callback para o clique no botão de download.
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
 * @param {Array} files - A lista de arquivos anexados.
 * @param {Function} onRemoveClick - Callback para remover um anexo.
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
    // A lógica de criação dos chips de anexo será adicionada aqui.
    // Por enquanto, apenas mostra um contador.
    attachedFilesContainer.textContent = `${files.length} arquivo(s) anexado(s).`;
}
export function initUI() {
    userInputEl.addEventListener('input', () => {
        userInputEl.style.height = 'auto';
        userInputEl.style.height = `${userInputEl.scrollHeight}px`;
    });
}

/**
 * Renderiza a lista de sessões de chat no painel de histórico.
 * @param {Array} sessions - Array de objetos de sessão do chat.
 * @param {string} activeChatId - O ID da sessão de chat ativa no momento.
 * @param {Function} onSessionClick - Callback para quando uma sessão é clicada.
 * @param {Function} onDeleteClick - Callback para quando o botão de deletar é clicado.
 */
export function renderHistoryList(sessions, activeChatId, onSessionClick, onDeleteClick) {
    historySessionsList.innerHTML = ''; // Limpa a lista antes de renderizar

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
        deleteBtn.innerHTML = '🗑️'; // Ícones são seguros com innerHTML
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

/**
 * Renderiza um card interativo com botões de opção.
 * @param {string} title - O título do card.
 * @param {Array} options - Array de objetos de opção, ex: [{label: 'Opção 1', value: 'opt1'}].
 * @param {Function} onOptionClick - Callback executado quando uma opção é clicada.
 */
export function renderSkillSelectionCard(title, options, onOptionClick) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai-msg';

    const cardDiv = document.createElement('div');
    cardDiv.className = 'interactive-option-card';

    if (title) {
        const titleEl = document.createElement('div');
        titleEl.className = 'interactive-title';
        titleEl.textContent = title;
        cardDiv.appendChild(titleEl);
    }

    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'interactive-options-group';

    options.forEach((option) => {
        const btn = document.createElement('button');
        btn.className = 'interactive-option-btn';
        btn.textContent = option.label;
        btn.addEventListener('click', () => {
            optionsGroup.querySelectorAll('button').forEach(b => b.disabled = true);
            btn.classList.add('selected');
            onOptionClick(option.skillKey); // Usando skillKey como no código legado
        });
        optionsGroup.appendChild(btn);
    });

    cardDiv.appendChild(optionsGroup);
    msgDiv.appendChild(cardDiv);
    historyEl.appendChild(msgDiv);
    historyEl.scrollTop = historyEl.scrollHeight;
}