// Configuration of Specialized Skills with dedicated System Instructions
const skillsConfig = {
  geral: {
    systemPrompt: "Atue como um analista de dados e informação sênior. Resuma os pontos centrais, extraia insights essenciais e responda à pergunta sobre a página com clareza objetiva e estrutura organizada.",
    label: "Geral"
  },
  juridico: {
    systemPrompt: "Atue como um advogado especialista em Direito Digital e Contratos. Analise o conteúdo da página focando em riscos ocultos, obrigações do usuário, cláusulas abusivas, privacidade e conformidade legal (LGPD/GDPR).",
    label: "Jurídico"
  },
  codigo: {
    systemPrompt: "Atue como Engenheiro de Software Sênior e Arquiteto de Sistemas. Avalie o código, documentação ou arquitetura técnica na página, identificando vulnerabilidades, débitos técnicos, más práticas e sugestões de otimização de código.",
    label: "Dev/Código"
  },
  seo: {
    systemPrompt: "Atue como Especialista em SEO e Content Marketing. Analise a hierarquia da página, clareza da proposta de valor, adequação de palavras-chave, escaneabilidade e otimização para motores de busca.",
    label: "SEO"
  },
  traducao: {
    systemPrompt: "Atue como um Tradutor e Adaptador Linguístico Cultural sênior. Traduza e adapte trechos ou o resumo da página para o Português do Brasil com fluência natural, preservando termos técnicos relevantes.",
    label: "Tradução"
  }
};

const MAX_PAGE_CHARS = 30000; // Limite de caracteres para prevenção de estouro de tokens
const MAX_HISTORY_TURNS = 10; // Número máximo de mensagens do histórico enviadas ao Gemini
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'; // Modelo padrão do Gemini (facilita troca futura)

const STRICT_DOCUMENT_SCOPE_PROMPT = `
[REGRA OBRIGATÓRIA DE RESTRIÇÃO DE ESCOPO DOCUMENTAL]:
1. Responda EXCLUSIVAMENTE com base no conteúdo da página web ativa, nos arquivos anexados pelo usuário e nas bases de conhecimento da Habilidade fornecida.
2. Se a informação solicitada pelo usuário NÃO constar nos arquivos fornecidos nem na página ativa:
   - NÃO responda diretamente utilizando conhecimento externo prévio.
   - Pergunte exatamente ao usuário: "A informação solicitada não consta na documentação nem nos arquivos fornecidos. Deseja que eu busque essa informação fora da documentação fornecida?"
3. Se e somente se o usuário responder "sim" ou autorizar explicitamente a busca externa:
   - Forneça a resposta com base em conhecimento geral, mas inclua OBRIGATORIAMENTE no início e no final o seguinte aviso destacado:
   "**⚠️ ATENÇÃO: Esta resposta foi gerada com base em conhecimento externo e NÃO consta na documentação ou arquivos fornecidos.**"
`;

// DOM Element References
const sendBtn = document.getElementById('send-btn');
const userInputEl = document.getElementById('user-input');
const selectEl = document.getElementById('task-select');
const historyEl = document.getElementById('chat-history');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const pageInfoBadge = document.getElementById('page-info-badge');

// Elements - Botões de Topo e Histórico de Sessões
const newChatBtn = document.getElementById('new-chat-btn');
const historyDrawerBtn = document.getElementById('history-drawer-btn');
const historyDrawer = document.getElementById('history-drawer');
const closeHistoryDrawerBtn = document.getElementById('close-history-drawer-btn');
const historySessionsList = document.getElementById('history-sessions-list');

// Elements - Arquivos da Página e Anexos
const pageFilesPanel = document.getElementById('page-files-panel');
const pageFilesList = document.getElementById('page-files-list');
const pageFilesCount = document.getElementById('page-files-count');
const downloadAllBtn = document.getElementById('download-all-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const attachedFilesContainer = document.getElementById('attached-files-container');

// Elements - Autenticação Google OAuth
const loginScreen = document.getElementById('login-screen');
const mainAppScreen = document.getElementById('main-app-screen');
const googleLoginBtn = document.getElementById('google-login-btn');
const googleLogoutBtn = document.getElementById('google-logout-btn');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');

// Application State
let activeChatId = null;
let detectedPageFiles = [];
let attachedFiles = []; // Array of { name, type, content }
let currentUser = null; // { name, email, picture, token }

// Event Listeners
document.addEventListener('DOMContentLoaded', initSidePanel);
sendBtn.addEventListener('click', processarRequisicao);
userInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    processarRequisicao();
  }
});
clearHistoryBtn.addEventListener('click', limparConversaAtual);

// Listeners de Autenticação OAuth 2.0
googleLoginBtn.addEventListener('click', realizarLoginGoogle);
googleLogoutBtn.addEventListener('click', realizarLogoutGoogle);

// Listeners de Ações de Topo e Gaveta de Histórico
newChatBtn.addEventListener('click', () => iniciarNovaConversa(true));
historyDrawerBtn.addEventListener('click', toggleHistoryDrawer);
closeHistoryDrawerBtn.addEventListener('click', () => historyDrawer.classList.add('hidden'));

// Listeners para Anexo de Arquivos e Downloads
attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelection);
downloadAllBtn.addEventListener('click', baixarTodosArquivos);

// Monitorar troca de abas para atualizar lista de arquivos da página
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.onActivated?.addListener(carregarArquivosPagina);
  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') carregarArquivosPagina();
  });
}

// Init SidePanel & Session
async function initSidePanel() {
  await verificarStatusAuth();

  const data = await chrome.storage.local.get(['chat_sessions', 'active_chat_id']);
  let sessions = data.chat_sessions || [];
  activeChatId = data.active_chat_id;

  if (sessions.length > 0) {
    let currentSession = sessions.find(s => s.id === activeChatId) || sessions[0];
    activeChatId = currentSession.id;
    carregarMensagensDaSessao(currentSession);
  } else {
    await iniciarNovaConversa(false);
  }

  // Tenta carregar os arquivos da aba ativa ao iniciar
  carregarArquivosPagina();
}

/**
 * Verifica o status de autenticação no storage de sessão ao iniciar.
 * Se o usuário já estiver logado no perfil do Chrome, realiza o login automático sem requerer cliques.
 */
async function verificarStatusAuth() {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      exibirTelaLogin();
      return;
    }

    // 1. Tentar carregar a sessão já salva no armazenamento da extensão
    const data = await chrome.storage.session.get(['user_profile']);
    if (data.user_profile && data.user_profile.email) {
      currentUser = data.user_profile;
      exibirPerfilLogado(currentUser);
      return;
    }

    // 2. Tentar autenticação silenciosa com a conta logada no perfil do Chrome
    const autoLoggedIn = await realizarLoginSilencioso();
    if (!autoLoggedIn) {
      exibirTelaLogin();
    }
  } catch (err) {
    exibirTelaLogin();
  }
}

/**
 * Tenta autenticar silenciosamente com a conta do perfil do Chrome
 * @returns {Promise<boolean>} Retorna true se autenticou automaticamente
 */
async function realizarLoginSilencioso() {
  if (typeof chrome === 'undefined' || !chrome.identity) return false;

  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        resolve(false);
      } else {
        try {
          const profile = await buscarPerfilUsuario(token);
          profile.token = token;
          currentUser = profile;
          await chrome.storage.session.set({ user_profile: profile });
          exibirPerfilLogado(profile);
          resolve(true);
        } catch (err) {
          resolve(false);
        }
      }
    });
  });
}

/**
 * Executa o fluxo de autenticação com chrome.identity.getAuthToken
 * @param {boolean} interactive - Se true, abre a janela de login proativamente
 */
async function realizarLoginGoogle(interactive = true) {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    console.warn('API chrome.identity indisponível.');
    return;
  }

  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (authToken) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(authToken);
        }
      });
    });

    if (token) {
      const profile = await buscarPerfilUsuario(token);
      profile.token = token;
      currentUser = profile;

      await chrome.storage.session.set({ user_profile: profile });
      exibirPerfilLogado(profile);
    } else {
      if (interactive) exibirTelaLogin();
    }
  } catch (err) {
    console.warn('Falha na autenticação Google OAuth:', err.message || err);
    exibirTelaLogin();
  }
}

/**
 * Busca dados de perfil do usuário na Google UserInfo API
 */
async function buscarPerfilUsuario(token) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Não foi possível obter dados do perfil do usuário.');
  const data = await resp.json();
  return {
    name: data.name || 'Usuário Google',
    email: data.email,
    picture: data.picture || 'icons/icon48.png'
  };
}

/**
 * Realiza o logout e revoga a sessão
 */
async function realizarLogoutGoogle() {
  if (typeof chrome === 'undefined' || !chrome.identity) return;

  try {
    const data = await chrome.storage.session.get(['user_profile']);
    if (data.user_profile && data.user_profile.token) {
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token: data.user_profile.token }, resolve);
      });
    }
    await chrome.storage.session.remove(['user_profile']);
    currentUser = null;
    exibirTelaLogin();
  } catch (err) {
    console.error('Erro ao realizar logout:', err);
    exibirTelaLogin();
  }
}

function exibirPerfilLogado(profile) {
  userAvatar.src = profile.picture;
  userName.textContent = profile.name;
  userEmail.textContent = profile.email;
  mainAppScreen.classList.remove('hidden');
  loginScreen.classList.add('hidden');
}

function exibirTelaLogin() {
  mainAppScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

async function iniciarNovaConversa(shouldNotify = true) {
  activeChatId = 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  historyEl.innerHTML = `
    <div class="message ai-msg">
      <strong>Olá! 👋 (Nova Conversa)</strong><br>
      Selecione uma Habilidade, abra qualquer site e me envie uma pergunta. Vou analisar o conteúdo completo da sua aba ativa.
    </div>
  `;

  const newSession = {
    id: activeChatId,
    title: 'Nova Conversa',
    updatedAt: new Date().toISOString(),
    messages: []
  };

  const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
  chat_sessions.unshift(newSession);
  await chrome.storage.local.set({ chat_sessions, active_chat_id: activeChatId });

  if (historyDrawer) historyDrawer.classList.add('hidden');
  scrollToBottom();
}

function carregarMensagensDaSessao(session) {
  historyEl.innerHTML = '';
  if (!session.messages || session.messages.length === 0) {
    historyEl.innerHTML = `
      <div class="message ai-msg">
        <strong>Olá! 👋</strong><br>
        Selecione uma Habilidade, abra qualquer site e me envie uma pergunta. Vou analisar o conteúdo completo da sua aba ativa.
      </div>
    `;
  } else {
    session.messages.forEach(msg => {
      appendMessageUI(msg.text, msg.type, false);
    });
  }
  scrollToBottom();
}

async function toggleHistoryDrawer() {
  if (historyDrawer.classList.contains('hidden')) {
    await renderizarListaHistorico();
    historyDrawer.classList.remove('hidden');
  } else {
    historyDrawer.classList.add('hidden');
  }
}

async function renderizarListaHistorico() {
  const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
  historySessionsList.innerHTML = '';

  if (chat_sessions.length === 0) {
    historySessionsList.innerHTML = '<li class="history-session-item"><span>Nenhuma conversa anterior salva.</span></li>';
    return;
  }

  chat_sessions.forEach(session => {
    const li = document.createElement('li');
    li.className = `history-session-item ${session.id === activeChatId ? 'active' : ''}`;

    const dateStr = session.updatedAt ? new Date(session.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    
    li.innerHTML = `
      <div class="history-session-info">
        <span class="history-session-title">${escapeHtml(session.title || 'Conversa sem título')}</span>
        <span class="history-session-date">${dateStr} (${session.messages?.length || 0} msgs)</span>
      </div>
      <button class="icon-btn-sm delete-session-btn" title="Excluir conversa">🗑️</button>
    `;

    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-session-btn')) return;
      retomarConversa(session.id);
    });

    const delBtn = li.querySelector('.delete-session-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      excluirConversa(session.id);
    });

    historySessionsList.appendChild(li);
  });
}

async function retomarConversa(sessionId) {
  const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
  const session = chat_sessions.find(s => s.id === sessionId);
  if (session) {
    activeChatId = session.id;
    await chrome.storage.local.set({ active_chat_id: activeChatId });
    carregarMensagensDaSessao(session);
  }
  historyDrawer.classList.add('hidden');
}

async function excluirConversa(sessionId) {
  let { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
  chat_sessions = chat_sessions.filter(s => s.id !== sessionId);
  await chrome.storage.local.set({ chat_sessions });

  if (activeChatId === sessionId) {
    if (chat_sessions.length > 0) {
      await retomarConversa(chat_sessions[0].id);
    } else {
      await iniciarNovaConversa(false);
    }
  } else {
    renderizarListaHistorico();
  }
}

async function limparConversaAtual() {
  if (!activeChatId) return;
  let { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
  const idx = chat_sessions.findIndex(s => s.id === activeChatId);
  if (idx !== -1) {
    chat_sessions[idx].messages = [];
    chat_sessions[idx].updatedAt = new Date().toISOString();
    await chrome.storage.local.set({ chat_sessions });
  }
  historyEl.innerHTML = `
    <div class="message ai-msg">
      Conversa limpa. Faça uma nova pergunta sobre a aba ativa.
    </div>
  `;
}

// --- Gestão do Painel 'Arquivos da Página' e Downloads ---

// Função injetada no DOM para extrair links de download na aba ativa
function extractPageFilesFromDOM() {
  const supportedExts = ['.pdf', '.txt', '.csv', '.json', '.docx', '.xlsx', '.zip', '.xml', '.md'];
  const links = Array.from(document.querySelectorAll('a[href]'));
  const fileMap = new Map();

  links.forEach(a => {
    const href = a.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

    try {
      const urlObj = new URL(href, document.baseURI);
      const pathname = urlObj.pathname.toLowerCase();
      const isSupported = supportedExts.some(ext => pathname.endsWith(ext)) || a.hasAttribute('download');
      
      if (isSupported) {
        let filename = a.getAttribute('download') || pathname.split('/').pop() || 'arquivo';
        filename = decodeURIComponent(filename).trim();
        if (!filename) filename = 'arquivo_download';

        if (!fileMap.has(href)) {
          fileMap.set(href, { name: filename, url: href });
        }
      }
    } catch (e) {}
  });

  return Array.from(fileMap.values());
}

async function carregarArquivosPagina() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      pageFilesPanel.classList.add('hidden');
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageFilesFromDOM
    });

    detectedPageFiles = results[0]?.result || [];
    renderPageFilesUI();
  } catch (err) {
    console.warn("Erro ao carregar arquivos da página:", err);
    pageFilesPanel.classList.add('hidden');
  }
}

function renderPageFilesUI() {
  pageFilesList.innerHTML = '';
  if (!detectedPageFiles || detectedPageFiles.length === 0) {
    pageFilesPanel.classList.add('hidden');
    return;
  }

  pageFilesCount.textContent = detectedPageFiles.length;
  pageFilesPanel.classList.remove('hidden');

  detectedPageFiles.forEach((file) => {
    const li = document.createElement('li');
    li.className = 'page-file-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'page-file-name';
    nameSpan.textContent = file.name;
    nameSpan.title = file.url;

    const dlBtn = document.createElement('button');
    dlBtn.className = 'download-file-btn';
    dlBtn.innerHTML = '⬇️';
    dlBtn.title = `Baixar ${file.name}`;
    dlBtn.addEventListener('click', () => baixarArquivoUnitario(file.url, file.name));

    li.appendChild(nameSpan);
    li.appendChild(dlBtn);
    pageFilesList.appendChild(li);
  });
}

function baixarArquivoUnitario(url, filename) {
  if (typeof chrome !== 'undefined' && chrome.downloads) {
    chrome.downloads.download({ url, filename: filename || undefined });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    a.click();
  }
}

function baixarTodosArquivos() {
  if (!detectedPageFiles || detectedPageFiles.length === 0) return;
  detectedPageFiles.forEach(file => {
    baixarArquivoUnitario(file.url, file.name);
  });
}

// --- Gestão de Anexo Manual de Arquivos pelo Usuário ---

async function handleFileSelection(e) {
  const files = Array.from(e.target.files);
  if (!files || files.length === 0) return;

  for (const file of files) {
    try {
      const textContent = await readFileContent(file);
      attachedFiles.push({
        name: file.name,
        type: file.type,
        content: textContent
      });
    } catch (err) {
      console.error(`Erro ao ler arquivo ${file.name}:`, err);
      attachedFiles.push({
        name: file.name,
        type: file.type,
        content: `[Erro ao ler conteúdo textual do arquivo: ${err.message}]`
      });
    }
  }

  fileInput.value = '';
  renderAttachedFilesUI();
}

function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => resolve(evt.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

function renderAttachedFilesUI() {
  attachedFilesContainer.innerHTML = '';
  if (attachedFiles.length === 0) {
    attachedFilesContainer.classList.add('hidden');
    return;
  }

  attachedFilesContainer.classList.remove('hidden');
  attachedFiles.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'attached-file-chip';
    chip.innerHTML = `
      📄 <span>${escapeHtml(file.name)}</span>
      <button class="attached-file-remove" data-index="${index}" title="Remover anexo">✕</button>
    `;
    attachedFilesContainer.appendChild(chip);
  });

  attachedFilesContainer.querySelectorAll('.attached-file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      attachedFiles.splice(idx, 1);
      renderAttachedFilesUI();
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Extraction Script injected into Active Tab
function extractCleanDOMText() {
  const clone = document.body.cloneNode(true);
  const hasMainOrArticle = clone.querySelector('main, article') !== null;
  
  let noiseSelectors = ['script', 'style', 'noscript', 'iframe', 'svg'];
  if (hasMainOrArticle) {
    noiseSelectors.push('nav', 'header', 'footer');
  }

  noiseSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  const mainContent = clone.querySelector('main, article') || clone;
  let rawText = mainContent.innerText || mainContent.textContent || '';
  return rawText.replace(/\s+/g, ' ').trim();
}

// T4: Bloqueia/desbloqueia UI durante processamento
function setUiBusy(busy) {
  sendBtn.disabled = busy;
  userInputEl.disabled = busy;
  attachBtn.disabled = busy;
}

// Main Processing Workflow
async function processarRequisicao() {
  const userInput = userInputEl.value.trim();
  const selectedSkillKey = selectEl.value;

  if (!userInput && attachedFiles.length === 0) return;

  // 1. Obter API Key (do storage ou fallback)
  const { gemini_api_key: storedKey } = await chrome.storage.local.get('gemini_api_key');
  const apiKey = storedKey || "";

  // Snapshot dos anexos atuais para esta requisição
  const currentAttachedFiles = [...attachedFiles];
  attachedFiles = [];
  renderAttachedFilesUI();

  // 2. Renderizar mensagem do usuário na UI e bloquear controles (T4)
  setUiBusy(true);
  const displayMsg = userInput || "(Consulta com arquivo(s) anexado(s))";
  appendMessageUI(displayMsg, 'user-msg', true);
  userInputEl.value = '';
  const loadingId = appendMessageUI('', 'ai-msg loading', false);

  try {
    // 3. Obter aba ativa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error("Não foi possível acessar a aba ativa.");
    }

    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      throw new Error("Páginas internas do Chrome (chrome://) não permitem injeção de scripts por segurança.");
    }

    // 4. Executar injeção no DOM da aba ativa
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCleanDOMText
    });

    const pageContentRaw = injectionResults[0]?.result || "";
    
    if (!pageContentRaw) {
      pageInfoBadge.textContent = "Sem conteúdo textual extraído";
    } else {
      pageInfoBadge.textContent = `${Math.min(pageContentRaw.length, MAX_PAGE_CHARS)} chars lidos`;
    }

    // 5. Truncamento Seguro
    const pageContentTruncated = pageContentRaw.slice(0, MAX_PAGE_CHARS);

    // 6. Montar conteúdo dos arquivos anexados manualmente pelo usuário
    let attachedContentText = "";
    if (currentAttachedFiles.length > 0) {
      attachedContentText = "\n\n[ARQUIVOS ANEXADOS PELO USUÁRIO PARA ANÁLISE]:\n" +
        currentAttachedFiles.map(f => `--- INÍCIO DO ARQUIVO: ${f.name} ---\n${f.content}\n--- FIM DO ARQUIVO: ${f.name} ---`).join("\n\n");
    }

    // 7. Montagem do Prompt Consolidado e Chamada via Google Apps Script Proxy Gateway
    const currentSkill = skillsConfig[selectedSkillKey];
    
    // Obter URL do endpoint do Apps Script das configurações (ou fallback padrão oficial)
    const { apps_script_endpoint: storedEndpoint } = await chrome.storage.local.get('apps_script_endpoint');
    const proxyEndpoint = storedEndpoint || "https://script.google.com/macros/s/AKfycbyLfAPyTaKvoSgl7W-OdXrfKRm1rofmRGs_ZD15RzMf1GrvTQAR6DiZrFD6SiZ8HSV4/exec";

    // Recorrer ao histórico da sessão ativa
    const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    const activeSession = chat_sessions.find(s => s.id === activeChatId);
    const historyMessages = (activeSession?.messages || []).slice(-MAX_HISTORY_TURNS);

    const systemInstructionText = `[DIRETRIZ DA SKILL / SYSTEM INSTRUCTION]:\n${currentSkill.systemPrompt}\n\n${STRICT_DOCUMENT_SCOPE_PROMPT}\n\n[BASE DE CONHECIMENTO - CONTEÚDO EXTRAÍDO DA PÁGINA ATUAL]:\n${pageContentTruncated || "Nenhum texto extraído."}${attachedContentText}`;

    const historyTurns = historyMessages.map(msg => ({
      role: msg.type.includes('user-msg') ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const currentTurn = { role: 'user', parts: [{ text: userInput || "Por favor, analise o(s) arquivo(s) anexado(s) em conjunto com a página." }] };

    const contents = [...historyTurns, currentTurn];

    // E-mail do usuário autenticado (ou fallback)
    const userEmailToSend = currentUser?.email || "usuario@local.dev";

    const payloadBody = {
      userEmail: userEmailToSend,
      systemInstruction: systemInstructionText,
      contents: contents,
      model: DEFAULT_GEMINI_MODEL
    };

    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payloadBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errDetail = errData.message || errData.error || response.statusText;
      throw new Error(`Erro no Proxy Apps Script (${response.status}): ${errDetail}`);
    }

    const data = await response.json();

    if (data.error === "ACESSO_NEGADO") {
      throw new Error(`🛑 Acesso não autorizado: ${data.message || "Seu e-mail não consta na lista de usuários ativos da planilha."}`);
    } else if (data.error) {
      throw new Error(data.error);
    }

    const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta gerada pelo modelo.";

    // 8. Atualizar UI e Persistir na Sessão Ativa
    removeMessageUI(loadingId);
    appendMessageUI(respostaIA, 'ai-msg', true);

  } catch (error) {
    removeMessageUI(loadingId);
    appendMessageUI(`❌ **Falha na operação:** ${error.message}`, 'ai-msg', false);
    console.error("Gemini Sidepanel Error:", error);
  } finally {
    setUiBusy(false);
  }
}

// UI Helper Functions
function appendMessageUI(text, typeClass, saveToStorage = true) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${typeClass}`;
  
  if (typeClass.includes('user-msg')) {
    msgDiv.textContent = text;
  } else {
    if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
      const rawHtml = marked.parse(text);
      msgDiv.innerHTML = DOMPurify.sanitize(rawHtml);
    } else if (typeof DOMPurify !== 'undefined') {
      const fallbackHtml = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      msgDiv.innerHTML = DOMPurify.sanitize(fallbackHtml);
    } else {
      msgDiv.textContent = text;
    }
  }
  
  const tempId = 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
  msgDiv.id = tempId;

  historyEl.appendChild(msgDiv);
  scrollToBottom();

  if (saveToStorage && !typeClass.includes('loading')) {
    persistMessage(text, typeClass);
  }

  return tempId;
}

function removeMessageUI(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  historyEl.scrollTop = historyEl.scrollHeight;
}

let _persistQueue = Promise.resolve();

function persistMessage(text, type) {
  _persistQueue = _persistQueue.then(async () => {
    let { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    let session = chat_sessions.find(s => s.id === activeChatId);

    if (!session) {
      session = {
        id: activeChatId || ('chat-' + Date.now()),
        title: text.slice(0, 30) || 'Nova Conversa',
        updatedAt: new Date().toISOString(),
        messages: []
      };
      chat_sessions.unshift(session);
    }

    session.messages.push({ text, type });
    session.updatedAt = new Date().toISOString();

    if (session.messages.length === 1 && type.includes('user-msg')) {
      session.title = text.slice(0, 32).trim() + (text.length > 32 ? '...' : '');
    }

    await chrome.storage.local.set({ chat_sessions, active_chat_id: activeChatId });
  }).catch(err => console.error('persistMessage queue error:', err));
  return _persistQueue;
}
