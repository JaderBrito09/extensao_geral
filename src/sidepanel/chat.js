// src/sidepanel/chat.js
import { historyEl, userInputEl, sendBtn, appendMessageUI } from './ui.js';
import { extrairConteudoDaPagina } from './files.js';
import { activeSkillKey, getActiveSkill, exibirCardSelecaoHabilidade } from './skills.js';
import { currentUser } from './auth.js';
import { renderHistoryList } from './ui.js';

let activeChatId = null;
const MAX_HISTORY_TURNS = 10;

// Funções de escape para segurança
function escapeHtml(unsafe) { return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

async function processarRequisicao() {
    const userInput = userInputEl.value.trim();
    if (!userInput) return;
    if (!activeSkillKey) {
        appendMessageUI('⚠️ Por favor, selecione uma Habilidade antes de enviar uma pergunta.', 'ai-msg');
        return;
    }
    
    appendMessageUI(escapeHtml(userInput), 'user-msg');
    const userMessage = { type: 'user-msg', text: userInput };
    userInputEl.value = '';
    userInputEl.style.height = 'auto';
    appendMessageUI('', 'ai-msg', true);

    try {
        const pageContent = await extrairConteudoDaPagina();
        const history = await getChatHistory();
        history.push(userMessage);

        const prompt = construirPromptXml(userInput, pageContent, history);
        const responseText = await enviarParaProxy(prompt);
        
        const loadingEl = historyEl.querySelector('.message:last-child .loading-dots');
        if (loadingEl) loadingEl.parentElement.parentElement.remove();
        
        const aiMessage = { type: 'ai-msg', text: responseText };
        history.push(aiMessage);
        await saveChatHistory(history);

        appendMessageUI(marked.parse(responseText), 'ai-msg');
    } catch (err) {
        console.error("Erro ao processar requisição:", err);
        const loadingEl = historyEl.querySelector('.message:last-child .loading-dots');
        if (loadingEl) loadingEl.parentElement.innerHTML = DOMPurify.sanitize(`❌ Erro: ${err.message}`);
    }
}

function construirPromptXml(userInput, pageContent, history) {
    const skill = getActiveSkill();
    const skillPrompt = skill?.systemPrompt || "Você é um assistente prestativo.";
    const historyXml = history.slice(-MAX_HISTORY_TURNS).map(msg => 
        msg.type === 'user-msg' ? `<user_turn>${escapeHtml(msg.text)}</user_turn>` : `<ai_turn>${escapeHtml(msg.text)}</ai_turn>`
    ).join('\n');

    return `<prompt>
        <system_instructions>${skillPrompt}</system_instructions>
        <chat_history>${historyXml}</chat_history>
        <user_input>${escapeHtml(userInput)}</user_input>
        <untrusted_web_content>${escapeHtml(pageContent)}</untrusted_web_content>
    </prompt>`;
}

async function enviarParaProxy(promptXml) {
    const proxyEndpoint = "https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec";
    const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            authToken: currentUser?.token || "",
            prompt: promptXml,
            model: "gemini-2.5-flash"
        })
    });
    if (!response.ok) throw new Error(`Erro de comunicação com o servidor: ${response.statusText}`);
    const data = await response.json();
    if (data.error) throw new Error(`Erro da API: ${data.error}`);
    return data.response;
}

async function getChatHistory() {
    if (!activeChatId) return [];
    const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    const session = chat_sessions.find(s => s.id === activeChatId);
    return session ? session.messages : [];
}

async function saveChatHistory(messages) {
    if (!activeChatId) return;
    const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    const sessionIndex = chat_sessions.findIndex(s => s.id === activeChatId);
    if (sessionIndex > -1) {
        chat_sessions[sessionIndex].messages = messages;
        chat_sessions[sessionIndex].updatedAt = new Date().toISOString();
        if (messages.length > 0 && chat_sessions[sessionIndex].title === 'Nova Conversa') {
             chat_sessions[sessionIndex].title = messages[0].text.substring(0, 40) + '...';
        }
    }
    await chrome.storage.local.set({ chat_sessions });
}


export async function iniciarNovaConversa(shouldNotify = true) {
    activeChatId = 'chat-' + Date.now();
    const newSession = { id: activeChatId, title: 'Nova Conversa', updatedAt: new Date().toISOString(), messages: [] };
    const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    chat_sessions.unshift(newSession);
    await chrome.storage.local.set({ chat_sessions, active_chat_id: activeChatId });
    
    historyEl.innerHTML = '';
    if (currentUser?.allowed_skills) {
        exibirCardSelecaoHabilidade(currentUser.allowed_skills);
    }
}

export function initChat() {
    const historyDrawerBtn = document.getElementById('history-drawer-btn');
    historyDrawerBtn?.addEventListener('click', toggleHistoryDrawer);
    // ... outros listeners
    const newChatBtn = document.getElementById('new-chat-btn');
    newChatBtn?.addEventListener('click', () => iniciarNovaConversa(true));
}

export function initActionListeners() {
    sendBtn.addEventListener('click', processarRequisicao);
    userInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            processarRequisicao();
        }
    });
}

// ... (lógica de histórico que também precisa ser migrada)
async function toggleHistoryDrawer() { /* ... */ }
