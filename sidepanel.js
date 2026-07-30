// Configuration of Specialized Skills dynamically loaded from Markdown files (.md)
let skillsConfig = {};

const MAX_PAGE_CHARS = 30000; // Limite de caracteres para prevenção de estouro de tokens
const MAX_HISTORY_TURNS = 10; // Número máximo de mensagens do histórico enviadas ao Gemini
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'; // Modelo padrão do Gemini (facilita troca futura)
const DEFAULT_APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbxB0r52U-lcIIZQKslhDBaROeVz-aqNmD1j1RrzUzFUDzxGJyZWwmJK8pjaARBc0u3s/exec";

/**
 * Obtém a URL do Apps Script Proxy Gateway com migração automática de endpoints antigos
 */
async function getProxyEndpoint() {
  if (typeof chrome === 'undefined' || !chrome.storage) return DEFAULT_APPS_SCRIPT_ENDPOINT;
  const { apps_script_endpoint: storedEndpoint } = await chrome.storage.local.get('apps_script_endpoint');
  if (!storedEndpoint || storedEndpoint.includes('AKfycbyLfAPyTaKvoSgl7W-OdXrfKRm1rofmRGs_ZD15RzMf1GrvTQAR6DiZrFD6SiZ8HSV4')) {
    await chrome.storage.local.set({ apps_script_endpoint: DEFAULT_APPS_SCRIPT_ENDPOINT });
    return DEFAULT_APPS_SCRIPT_ENDPOINT;
  }
  return storedEndpoint;
}

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
const pageReadingIndicator = document.getElementById('page-reading-indicator');
const pageReadingText = document.getElementById('page-reading-text');

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

// Elements - Autenticação Google OAuth & Tela de Bloqueio
const loginScreen = document.getElementById('login-screen');
const mainAppScreen = document.getElementById('main-app-screen');
const accessDeniedScreen = document.getElementById('access-denied-screen');
const deniedUserEmail = document.getElementById('denied-user-email');
const retryAuthBtn = document.getElementById('retry-auth-btn');
const deniedLogoutBtn = document.getElementById('denied-logout-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const googleLogoutBtn = document.getElementById('google-logout-btn');
const loginErrorMsg = document.getElementById('login-error-msg');
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
// Ajuste automático de altura da textarea ao digitar (Estilo Gemini)
userInputEl.addEventListener('input', () => {
  userInputEl.style.height = '57px';
  userInputEl.style.height = Math.max(57, Math.min(userInputEl.scrollHeight, 140)) + 'px';
});

userInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    processarRequisicao();
    userInputEl.style.height = '57px';
  }
});
clearHistoryBtn.addEventListener('click', limparConversaAtual);

// Listeners de Autenticação OAuth 2.0 e Tela de Bloqueio
googleLoginBtn.addEventListener('click', () => realizarLoginGoogle(true));
googleLogoutBtn.addEventListener('click', realizarLogoutGoogle);
if (retryAuthBtn) retryAuthBtn.addEventListener('click', revalidarPermissaoUsuario);
if (deniedLogoutBtn) deniedLogoutBtn.addEventListener('click', realizarLogoutGoogle);

// Listeners de Ações de Topo e Gaveta de Histórico
newChatBtn.addEventListener('click', () => iniciarNovaConversa(true));
historyDrawerBtn.addEventListener('click', toggleHistoryDrawer);
closeHistoryDrawerBtn.addEventListener('click', () => historyDrawer.classList.add('hidden'));

// Listeners para Anexo de Arquivos (Menu Estilo Gemini) e Downloads
const attachDropdown = document.getElementById('attach-dropdown');
const optUploadFile = document.getElementById('opt-upload-file');
const optGoogleDrive = document.getElementById('opt-google-drive');
const optInsertLink = document.getElementById('opt-insert-link');

if (attachBtn && attachDropdown) {
  attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (attachDropdown && !attachDropdown.contains(e.target) && e.target !== attachBtn) {
      attachDropdown.classList.add('hidden');
    }
  });
}

if (optUploadFile) {
  optUploadFile.addEventListener('click', () => {
    if (attachDropdown) attachDropdown.classList.add('hidden');
    fileInput.click();
  });
}

if (optGoogleDrive) {
  optGoogleDrive.addEventListener('click', () => {
    if (attachDropdown) attachDropdown.classList.add('hidden');
    const driveUrl = prompt("Insira a URL do arquivo ou pasta do Google Drive:");
    if (driveUrl && driveUrl.trim()) {
      attachedFiles.push({
        name: "Google Drive Document",
        type: "google-drive",
        content: `[LINK RECURSO GOOGLE DRIVE]: ${driveUrl.trim()}`
      });
      renderAttachedFilesUI();
    }
  });
}

if (optInsertLink) {
  optInsertLink.addEventListener('click', () => {
    if (attachDropdown) attachDropdown.classList.add('hidden');
    const linkUrl = prompt("Insira a URL do documento ou página externa:");
    if (linkUrl && linkUrl.trim()) {
      attachedFiles.push({
        name: "Link Externo",
        type: "url-link",
        content: `[LINK EXTERNO FORNECIDO]: ${linkUrl.trim()}`
      });
      renderAttachedFilesUI();
    }
  });
}

fileInput.addEventListener('change', handleFileSelection);
downloadAllBtn.addEventListener('click', baixarTodosArquivos);

// Monitorar troca de abas para atualizar lista de arquivos da página
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.onActivated?.addListener(carregarArquivosPagina);
  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') carregarArquivosPagina();
  });
}

// Listener para exibição de orientação ao alterar a Habilidade selecionada
if (selectEl) {
  selectEl.addEventListener('change', async () => {
    // Atualiza o estado habilitado/desabilitado dos botões de download da página
    renderPageFilesUI();

    const selectedKey = selectEl.value;
    if (!selectedKey) {
      appendMessageUI('⚠️ **Nenhuma Habilidade selecionada.**\nPor favor, selecione uma Habilidade no menu superior para orientar a análise do assistente.', 'ai-msg', false);
      return;
    }

    // Se o histórico contiver apenas a mensagem de boas-vindas inicial, limpa para retirar a mensagem de boas-vindas
    const welcomeMsg = historyEl.querySelector('.message.ai-msg');
    if (welcomeMsg && historyEl.children.length === 1 && welcomeMsg.innerHTML.includes('Selecione uma Habilidade')) {
      historyEl.innerHTML = '';
    }

    const skill = await buscarSkillNoGithub(selectedKey);
    if (skill && skill.userGuidance) {
      appendMessageUI(`💡 **Habilidade Selecionada: ${skill.label}**\n\n${skill.userGuidance}`, 'ai-msg', false);
    } else if (skill) {
      appendMessageUI(`💡 **Habilidade Selecionada: ${skill.label}**\n\nHabilidade pronta para uso. Envie sua pergunta ou anexos.`, 'ai-msg', false);
    }
  });
}

/**
 * Busca uma skill específica no GitHub com suporte a fallback e cache local
 */
async function buscarSkillNoGithub(skillKey) {
  if (!skillKey) return null;

  if (skillsConfig[skillKey] && skillsConfig[skillKey].systemPrompt && skillsConfig[skillKey].userGuidance) {
    return skillsConfig[skillKey];
  }

  try {
    let url = `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills/${skillKey}/SKILL.md`;
    let resp = await fetch(url);
    if (!resp.ok) {
      url = `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills/${skillKey}.md`;
      resp = await fetch(url);
    }

    if (resp.ok) {
      const mdText = await resp.text();
      const parsedSkill = parseSkillMarkdown(mdText, skillKey);
      skillsConfig[skillKey] = parsedSkill;

      const { cached_skills = {} } = await chrome.storage.local.get('cached_skills');
      cached_skills[skillKey] = parsedSkill;
      await chrome.storage.local.set({ cached_skills, skills_cache_timestamp: Date.now() });

      return parsedSkill;
    }
  } catch (err) {
    console.warn(`Falha ao buscar a skill ${skillKey} no GitHub, utilizando versão local:`, err);
  }

  return skillsConfig[skillKey] || null;
}

const SKILLS_CACHE_TTL_MS = 3600 * 1000; // Cache TTL de 1 hora (Sprint 21)

/**
 * Função para parsear o conteúdo Markdown (.md) das Habilidades
 */
function parseSkillMarkdown(mdText, skillId) {
  let label = skillId;
  let category = "Geral";
  let description = "";
  let userGuidance = "";
  let systemPrompt = "";

  const titleMatch = mdText.match(/^#\s*Skill:\s*(.+)$/m);
  if (titleMatch) label = titleMatch[1].trim();

  const catMatch = mdText.match(/^\*\*Categoria\*\*:\s*(.+)$/m);
  if (catMatch) category = catMatch[1].trim();

  const descMatch = mdText.match(/^\*\*Descrição\*\*:\s*(.+)$/m);
  if (descMatch) description = descMatch[1].trim();

  const guidanceSection = mdText.split(/##\s*Orientação Inicial ao Usuário/i)[1];
  if (guidanceSection) {
    const guidanceContent = guidanceSection.split(/##\s*System Prompt/i)[0];
    userGuidance = guidanceContent.trim();
  }

  const systemSection = mdText.split(/##\s*System Prompt/i)[1];
  if (systemSection) {
    systemPrompt = systemSection.trim();
  } else {
    systemPrompt = mdText;
  }

  return {
    label: label,
    category: category,
    description: description,
    userGuidance: userGuidance,
    systemPrompt: systemPrompt
  };
}

/**
 * Carrega habilidades dinamicamente do manifesto skills.json no GitHub ou do Cache (Sprint 8)
 */
async function carregarSkillsDinamicas(allowedSkills = ["ALL"]) {
  if (typeof chrome === 'undefined' || !chrome.storage) return;

  try {
    const now = Date.now();

    // 1. Tentar ler o catálogo skills.json no repositório exclusivo assistente-jorge-skills
    let catalogUrl = "https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills.json";
    let catResp = await fetch(catalogUrl);

    if (!catResp.ok) {
      // Fallback local do manifesto skills.json
      catalogUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL) 
        ? chrome.runtime.getURL('skills-repo/skills.json') 
        : './skills-repo/skills.json';
      catResp = await fetch(catalogUrl);
    }

    if (catResp.ok) {
      const catalogData = await catResp.json();
      const downloadedSkills = {};

      if (catalogData && catalogData.skills && Array.isArray(catalogData.skills)) {
        for (const item of catalogData.skills) {
          const skillId = item.id || item.slug || item.file.replace(/^.*[\\\/]/, '').replace('.md', '');

          // Tenta carregar primeiro o arquivo local do pacote da extensão durante o desenvolvimento
          const localPath = 'skills-repo/' + item.file;
          const localMdUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL) 
            ? chrome.runtime.getURL(localPath) 
            : './' + localPath;
          let mdResp = await fetch(localMdUrl);

          if (!mdResp.ok) {
            const rawMdUrl = `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/${item.file}`;
            mdResp = await fetch(rawMdUrl);
          }

          if (mdResp.ok) {
            const mdText = await mdResp.text();
            const parsed = parseSkillMarkdown(mdText, skillId);
            parsed.id = skillId;
            parsed.slug = item.slug || skillId;
            parsed.label = item.name || parsed.label || skillId;
            parsed.category = item.category || parsed.category || "Geral";
            downloadedSkills[skillId] = parsed;
          } else {
            // Se o arquivo .md ainda não existir remotamente/localmente, registra a skill usando os metadados do manifesto
            downloadedSkills[skillId] = {
              id: skillId,
              slug: item.slug || skillId,
              label: item.name || skillId,
              category: item.category || "Geral",
              description: item.name || "",
              userGuidance: `💡 **${item.name}:** Habilidade pronta para uso.`,
              systemPrompt: `Atue como um assistente especializado na habilidade ${item.name}.`
            };
          }
        }
      }

      if (Object.keys(downloadedSkills).length > 0) {
        skillsConfig = { ...skillsConfig, ...downloadedSkills };
        await chrome.storage.local.set({
          cached_skills: downloadedSkills,
          skills_cache_timestamp: now
        });
      }
    }

    // Se nenhuma skill foi baixada remotamente, lê o catálogo local skills.json
    if (Object.keys(skillsConfig).length === 0) {
      try {
        const catalogLocalUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL) 
          ? chrome.runtime.getURL('skills-repo/skills.json') 
          : './skills-repo/skills.json';
        const catalogResp = await fetch(catalogLocalUrl);
        if (catalogResp.ok) {
          const catalogLocalData = await catalogResp.json();
          if (catalogLocalData && catalogLocalData.skills && catalogLocalData.skills.length > 0) {
            const firstItem = catalogLocalData.skills[0];
            const localSkillUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL) 
              ? chrome.runtime.getURL('skills-repo/' + firstItem.file) 
              : './skills-repo/' + firstItem.file;
            const localResp = await fetch(localSkillUrl);
            if (localResp.ok) {
              const mdText = await localResp.text();
              const skillId = firstItem.id || firstItem.slug;
              const parsed = parseSkillMarkdown(mdText, skillId);
              parsed.id = skillId;
              parsed.slug = firstItem.slug || skillId;
              parsed.label = firstItem.name || parsed.label || skillId;
              parsed.category = firstItem.category || parsed.category || "Geral";
              skillsConfig[skillId] = parsed;
            }
          }
        }
      } catch (e) {
        console.warn("Aviso na leitura do manifesto local de fallback:", e);
      }
    }
  } catch (err) {
    console.warn("Aviso: Carregamento dinâmico de skills usou o conjunto local de fallback.", err);
  }

  popularSelectSkills(allowedSkills);
}

/**
 * Popula o <select> filtrando as skills pelo ID exato (ex: "SKILL-GERAL-001") ou "ALL" / "*".
 * Valores separados por vírgula na planilha são aceitos (ex: "SKILL-GERAL-001, SKILL-GESTAOGOV-001").
 * Match por slug ou categoria não é suportado nesta versão.
 */
function popularSelectSkills(allowedSkills = ["ALL"]) {
  if (!selectEl) return;
  const currentVal = selectEl.value;
  selectEl.innerHTML = '<option value="" disabled selected>💡 Selecione uma Habilidade...</option>';

  const normalizedAllowed = allowedSkills.map(s => s.trim().toUpperCase());
  const isAllAllowed = normalizedAllowed.includes("ALL") || normalizedAllowed.includes("*");

  // Rastreia IDs já adicionados para evitar duplicatas
  const addedIds = new Set();

  for (const [key, skill] of Object.entries(skillsConfig)) {
    const skillIdUpper = (skill.id || key).toUpperCase();
    const skillSlugUpper = (skill.slug || key).toUpperCase();
    const skillCatUpper = (skill.category || "").toUpperCase();

    // Só exibe a skill se for ALL/* ou se o ID, Slug ou Categoria estiver na lista de permissões da planilha
    const hasPermission = isAllAllowed || 
      normalizedAllowed.includes(skillIdUpper) || 
      normalizedAllowed.includes(skillSlugUpper) ||
      normalizedAllowed.includes(skillCatUpper);

    if (hasPermission && !addedIds.has(skillIdUpper)) {
      addedIds.add(skillIdUpper);
      const option = document.createElement('option');
      option.value = key;
      option.textContent = skill.label;
      selectEl.appendChild(option);
    }
  }

  if (currentVal && skillsConfig[currentVal]) {
    selectEl.value = currentVal;
  }
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
 */
async function verificarStatusAuth() {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      exibirTelaLogin();
      return;
    }

    // 1. Tentar carregar a sessão já salva e validada no armazenamento da extensão
    const data = await chrome.storage.session.get(['user_profile']);
    if (data.user_profile && data.user_profile.email) {
      currentUser = data.user_profile;
      exibirPerfilLogado(currentUser);
      
      // Revalida a planilha para garantir o filtro atualizado de skills permitidas
      const validation = await validarUsuarioNaPlanilha(currentUser.email);
      if (validation.authorized) {
        currentUser.allowed_skills = validation.allowed_skills || ["ALL"];
        await carregarSkillsDinamicas(currentUser.allowed_skills);
      }
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
 * Consulta o Apps Script Proxy Gateway para validar se o e-mail está cadastrado e com status ATIVO na planilha.
 * Retorna também a lista de skills permitidas (allowed_skills) configurada para o usuário.
 */
async function validarUsuarioNaPlanilha(email) {
  try {
    const proxyEndpoint = await getProxyEndpoint();

    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        userEmail: email,
        action: "check_user_status"
      })
    });

    if (!response.ok) {
      return { authorized: false, message: "Não foi possível conectar ao servidor de validação de acesso." };
    }

    const data = await response.json();
    if (data.error === "ACESSO_NEGADO") {
      return { authorized: false, message: data.message || "Usuário não autorizado a acessar o assistente. Favor contatar o administrador." };
    } else if (data.error) {
      return { authorized: false, message: "Erro na validação: " + data.error };
    }

    // Retorna a lista de skills enviada pela planilha. Se a coluna estiver vazia, libera a habilidade principal/geral por padrão
    let allowedSkills = Array.isArray(data.allowed_skills)
      ? data.allowed_skills.map(s => s.trim().toUpperCase()).filter(Boolean)
      : [];

    if (allowedSkills.length === 0) {
      // Se não houver skills na planilha, libera por padrão a primeira skill cadastrada no manifesto (ex: SKILL-GERAL-001 ou geral)
      allowedSkills = ["SKILL-GERAL-001", "GERAL"];
    }

    return { authorized: true, allowed_skills: allowedSkills };
  } catch (err) {
    console.warn("Aviso na validação de permissão:", err);
    // Em caso de falha de conexão, libera a primeira skill padrão
    return { authorized: true, allowed_skills: ["SKILL-GERAL-001", "GERAL"] };
  }
}

/**
 * Tenta autenticar silenciosamente com a conta do perfil do Chrome e valida a planilha
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
          
          // Validação obrigatória na Planilha Google Sheets
          const validation = await validarUsuarioNaPlanilha(profile.email);
          if (!validation.authorized) {
            const errorMsg = validation.message || "Usuário não autorizado a acessar o assistente. Favor contatar o administrador.";
            exibirTelaAcessoNegado(profile.email, errorMsg);
            resolve(false);
            return;
          }

          profile.token = token;
          currentUser = profile;
          await chrome.storage.session.set({ user_profile: profile });
          exibirPerfilLogado(profile);
          await carregarSkillsDinamicas(validation.allowed_skills || ["ALL"]);
          resolve(true);
        } catch (err) {
          resolve(false);
        }
      }
    });
  });
}

/**
 * Força uma nova verificação na planilha Google Sheets sem reabrir a janela de login do Google
 */
async function revalidarPermissaoUsuario() {
  if (typeof chrome === 'undefined' || !chrome.identity) return;

  try {
    if (retryAuthBtn) {
      retryAuthBtn.disabled = true;
      retryAuthBtn.textContent = "⏳ Verificando...";
    }

    // 1. Resgatar token silencioso
    const token = await new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (t) => resolve(t));
    });

    if (!token) {
      // Se não houver token silencioso, chama o fluxo interativo normal
      await realizarLoginGoogle(true);
      return;
    }

    // 2. Resgatar perfil do usuário com o token ativo
    const profile = await buscarPerfilUsuario(token);

    // 3. Consultar a Planilha Google Sheets para checar se o status mudou para ATIVO
    const validation = await validarUsuarioNaPlanilha(profile.email);

    if (validation.authorized) {
      profile.token = token;
      currentUser = profile;
      await chrome.storage.session.set({ user_profile: profile });
      exibirPerfilLogado(profile);
      await carregarSkillsDinamicas(validation.allowed_skills || ["ALL"]);
    } else {
      const errorMsg = validation.message || "Usuário não autorizado a acessar o assistente. Favor contatar o administrador.";
      exibirTelaAcessoNegado(profile.email, errorMsg);
    }
  } catch (err) {
    console.error("Erro ao revalidar permissão:", err);
    await realizarLoginGoogle(true);
  } finally {
    if (retryAuthBtn) {
      retryAuthBtn.disabled = false;
      retryAuthBtn.textContent = "🔄 Tentar Novamente";
    }
  }
}

/**
 * Executa o fluxo de autenticação com chrome.identity.getAuthToken e validação na planilha
 */
async function realizarLoginGoogle(interactive = true) {
  if (typeof chrome === 'undefined' || !chrome.identity) {
    console.warn('API chrome.identity indisponível.');
    return;
  }

  const isInteractive = Boolean(interactive);

  try {
    if (loginErrorMsg) loginErrorMsg.classList.add('hidden');

    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: isInteractive }, (authToken) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(authToken);
        }
      });
    });

    if (token) {
      const profile = await buscarPerfilUsuario(token);
      
      // Validação obrigatória na Planilha Google Sheets
      const validation = await validarUsuarioNaPlanilha(profile.email);
      if (!validation.authorized) {
        const errorMsg = "Usuário não autorizado a acessar o assistente. Favor contatar o administrador.";
        exibirTelaAcessoNegado(profile.email, errorMsg);
        return;
      }

      profile.token = token;
      currentUser = profile;

      await chrome.storage.session.set({ user_profile: profile });
      exibirPerfilLogado(profile);
      await carregarSkillsDinamicas(validation.allowed_skills || ["ALL"]);
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
  if (userAvatar) userAvatar.src = profile.picture;
  if (userName) userName.textContent = profile.name;
  if (userEmail) userEmail.textContent = profile.email;
  mainAppScreen.classList.remove('hidden');
  loginScreen.classList.add('hidden');
  if (accessDeniedScreen) accessDeniedScreen.classList.add('hidden');

  // Sempre que o usuário loga ou entra na tela principal, inicie com uma nova conversa
  iniciarNovaConversa(false);
}

function exibirTelaLogin(errorMessage = null) {
  mainAppScreen.classList.add('hidden');
  if (accessDeniedScreen) accessDeniedScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');

  if (loginErrorMsg) {
    if (errorMessage) {
      loginErrorMsg.textContent = errorMessage;
      loginErrorMsg.classList.remove('hidden');
    } else {
      loginErrorMsg.classList.add('hidden');
      loginErrorMsg.textContent = '';
    }
  }
}

function exibirTelaAcessoNegado(email, reason = null) {
  mainAppScreen.classList.add('hidden');
  loginScreen.classList.add('hidden');
  if (accessDeniedScreen) {
    accessDeniedScreen.classList.remove('hidden');
    if (deniedUserEmail) deniedUserEmail.textContent = email || "e-mail não identificado";
    const reasonEl = document.getElementById('access-denied-reason');
    if (reasonEl && reason) reasonEl.textContent = reason;
  }
}

async function iniciarNovaConversa(shouldNotify = true) {
  attachedFiles = [];
  renderAttachedFilesUI();
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

  if (currentUser && currentUser.allowed_skills) {
    popularSelectSkills(currentUser.allowed_skills);
  }

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

// Função injetada no DOM para extrair links e anexos de download na aba ativa (incluindo Gmail e webmails)
function extractPageFilesFromDOM() {
  const supportedExts = ['.pdf', '.txt', '.csv', '.json', '.docx', '.xlsx', '.doc', '.xls', '.zip', '.rar', '.7z', '.xml', '.md', '.ods', '.odt', '.png', '.jpg', '.jpeg'];
  const fileMap = new Map();

  // 1. Detecção de links e elementos padrão com Href/Src/Data
  const standardElements = Array.from(document.querySelectorAll('a[href], [download], [data-href], embed[src], object[data], iframe[src]'));
  standardElements.forEach(el => {
    const rawUrl = el.href || el.getAttribute('download') || el.getAttribute('data-href') || el.src || el.data;
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.startsWith('javascript:') || rawUrl.startsWith('#')) return;

    try {
      const urlObj = new URL(rawUrl, document.baseURI);
      const fullUrl = urlObj.href;
      const pathname = urlObj.pathname.toLowerCase();
      const searchParams = urlObj.search.toLowerCase();
      
      const hasExtension = supportedExts.some(ext => pathname.endsWith(ext) || searchParams.includes(ext));
      const hasDownloadAttr = el.hasAttribute('download') || el.getAttribute('rel')?.includes('download');
      const isSupported = hasExtension || hasDownloadAttr;
      
      if (isSupported) {
        let filename = el.getAttribute('download') || pathname.split('/').pop() || 'arquivo';
        try {
          filename = decodeURIComponent(filename).trim();
        } catch (err) {}

        if (!filename || filename === '/' || filename.length < 2) {
          filename = 'documento_download';
        }

        const extFound = supportedExts.find(ext => pathname.endsWith(ext) || searchParams.includes(ext));
        if (extFound && !filename.toLowerCase().endsWith(extFound)) {
          filename += extFound;
        }

        if (!fileMap.has(fullUrl)) {
          fileMap.set(fullUrl, { name: filename, url: fullUrl, isDomClick: false });
        }
      }
    } catch (e) {}
  });

  // 2. Detecção Especializada para Gmail & Webmails (Anexos protegidos sem URL estática)
  // O Gmail utiliza elementos com atributos como download-url, data-tooltip="Fazer o download", seletores .a6S, [aria-label*="Download"], etc.
  const gmailAttachments = Array.from(document.querySelectorAll('[download-url], .a6S, [aria-label*="Download"], [aria-label*="download"], [aria-label*="Baixar"], [data-tooltip*="Baixar"], [data-tooltip*="Download"]'));
  
  gmailAttachments.forEach((el, index) => {
    let filename = '';
    let rawUrl = '';

    const downloadUrlAttr = el.getAttribute('download-url');
    if (downloadUrlAttr) {
      // O formato do atributo no Gmail é: mime:filename:url
      const parts = downloadUrlAttr.split(':');
      if (parts.length >= 3) {
        filename = decodeURIComponent(parts[1]);
        rawUrl = parts.slice(2).join(':');
      }
    }

    if (!filename) {
      filename = el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || el.textContent || '';
      filename = filename.replace(/^Baixar\s+/i, '').replace(/^Download\s+/i, '').trim();
    }

    // Se o elemento pai contiver um nome de arquivo visível (ex: cartão de anexo do Gmail)
    const cardParent = el.closest('.azo, .a6S, .br5, [role="listitem"]');
    if (cardParent) {
      const nameEl = cardParent.querySelector('.aV3, .aqN, .aqP, span');
      if (nameEl && nameEl.textContent) {
        filename = nameEl.textContent.trim();
      }
    }

    if (filename && filename.length > 2) {
      const key = rawUrl || `gmail-attach-${index}-${filename}`;
      if (!fileMap.has(key)) {
        // Marca que este elemento exige um evento de clique real no DOM
        fileMap.set(key, { 
          name: filename, 
          url: rawUrl || '#', 
          isDomClick: true,
          selector: downloadUrlAttr ? `[download-url="${CSS.escape(downloadUrlAttr)}"]` : null,
          index: index
        });
      }
    }
  });

  return Array.from(fileMap.values());
}

async function carregarArquivosPagina() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
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

  const hasSkillSelected = Boolean(selectEl && selectEl.value);
  pageFilesCount.textContent = detectedPageFiles.length;
  pageFilesPanel.classList.remove('hidden');

  if (downloadAllBtn) {
    downloadAllBtn.disabled = !hasSkillSelected;
    downloadAllBtn.title = hasSkillSelected ? "Baixar todos os arquivos da página" : "Selecione uma Habilidade no menu superior para habilitar os downloads";
  }

  detectedPageFiles.forEach((file) => {
    const li = document.createElement('li');
    li.className = 'page-file-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'page-file-name';
    nameSpan.textContent = file.name;
    nameSpan.title = file.url !== '#' ? file.url : file.name;

    const dlBtn = document.createElement('button');
    dlBtn.className = 'download-file-btn';
    dlBtn.innerHTML = '⬇️';
    dlBtn.disabled = !hasSkillSelected;
    dlBtn.title = hasSkillSelected ? `Baixar ${file.name}` : "Selecione uma Habilidade no menu superior para habilitar o download";
    dlBtn.addEventListener('click', () => {
      if (!selectEl || !selectEl.value) {
        appendMessageUI('⚠️ **Nenhuma Habilidade selecionada.**\nPor favor, selecione uma Habilidade no menu superior para habilitar o download de arquivos.', 'ai-msg', false);
        return;
      }
      baixarArquivoUnitario(file);
    });

    li.appendChild(nameSpan);
    li.appendChild(dlBtn);
    pageFilesList.appendChild(li);
  });
}

function triggerDomDownloadInPage(fileInfo) {
  try {
    let targetEl = null;
    if (fileInfo.selector) {
      targetEl = document.querySelector(fileInfo.selector);
    }
    if (!targetEl) {
      const candidates = Array.from(document.querySelectorAll('[download-url], .a6S, [aria-label*="Download"], [aria-label*="download"], [aria-label*="Baixar"], [data-tooltip*="Baixar"], [data-tooltip*="Download"]'));
      targetEl = candidates[fileInfo.index] || candidates.find(c => {
        const text = (c.getAttribute('aria-label') || c.getAttribute('data-tooltip') || c.textContent || '').toLowerCase();
        return text.includes(fileInfo.name.toLowerCase());
      });
    }

    if (targetEl) {
      // Dispara uma sequência completa de eventos para garantir o clique em elementos dinâmicos do Gmail/React/Angular
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
        const event = new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });
        targetEl.dispatchEvent(event);
      });

      // Se for um link <a> dentro ou no próprio elemento
      const linkEl = targetEl.tagName === 'A' ? targetEl : targetEl.querySelector('a') || targetEl.closest('a');
      if (linkEl && linkEl.href) {
        window.open(linkEl.href, '_blank');
      }
    }
  } catch (e) {
    console.error("Erro no script de clique do DOM:", e);
  }
}

async function fetchAndAttachFile(url, filename) {
  if (!url || url === '#' || url.startsWith('javascript:')) return;
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const text = await resp.text();
      // Adiciona aos anexos se o conteúdo textual for aproveitável
      if (text && text.length > 5) {
        attachedFiles.push({
          name: filename,
          type: resp.headers.get('content-type') || 'text/plain',
          content: text
        });
        renderAttachedFilesUI();
      }
    }
  } catch (e) {
    console.warn("Não foi possível carregar o texto diretamente da URL do anexo:", e);
  }
}

async function baixarArquivoUnitario(file) {
  const url = typeof file === 'object' ? file.url : file;
  const filename = typeof file === 'object' ? file.name : 'arquivo_download';
  const isDomClick = typeof file === 'object' ? file.isDomClick : false;

  // Emitir orientação amigável no chat para instruir o usuário
  appendMessageUI(
    `📄 **Arquivo Selecionado: ${filename}**\n\n` +
    `A página aberta não permite o download direto de arquivos através da extensão por restrições de segurança ou sessão.\n\n` +
    `💡 **Como prosseguir:**\n` +
    `1. Baixe o arquivo **${filename}** diretamente na página aberta no navegador.\n` +
    `2. Clique no botão de **📎 Anexo (+)** abaixo no chat (ou arraste o arquivo) para enviá-lo ao assistente.`,
    'ai-msg',
    false
  );

  // 1. Se houver URL válida diferente de '#', tenta usar a API de downloads com 'saveAs'
  if (url && url !== '#' && !url.startsWith('javascript:')) {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.download({ 
        url: url, 
        filename: filename || undefined,
        saveAs: true 
      }, async (downloadId) => {
        if (chrome.runtime.lastError) {
          if (isDomClick) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: triggerDomDownloadInPage,
                  args: [file]
                });
              } catch (e) {}
            }
          }
        }
      });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || '';
      a.click();
    }

    // Tentar ler e carregar o arquivo diretamente nos anexos da conversa
    await fetchAndAttachFile(url, filename);
  } else if (isDomClick) {
    // 2. Se for um anexo dinâmico do Gmail sem URL estática pública
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: triggerDomDownloadInPage,
          args: [file]
        });
      }
    } catch (e) {
      console.warn("Erro ao simular clique no DOM para download:", e);
    }
  }
}

function baixarTodosArquivos() {
  if (!selectEl || !selectEl.value) {
    appendMessageUI('⚠️ **Nenhuma Habilidade selecionada.**\nPor favor, selecione uma Habilidade no menu superior para habilitar o download de arquivos.', 'ai-msg', false);
    return;
  }
  if (!detectedPageFiles || detectedPageFiles.length === 0) return;
  detectedPageFiles.forEach(file => {
    baixarArquivoUnitario(file);
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

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      reader.onload = (evt) => {
        try {
          const buffer = evt.target.result;
          const bytes = new Uint8Array(buffer);
          let rawText = '';
          
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            rawText += String.fromCharCode.apply(null, chunk);
          }

          // 1. Extração de blocos de texto PDF /BT ... /ET e strings (Tj / TJ / td / TD)
          const textBlocks = [];
          const btRegex = /\/BT[\s\S]*?\/ET/gi;
          let match;
          while ((match = btRegex.exec(rawText)) !== null) {
            const block = match[0];
            const stringMatches = block.match(/\(([^()\\]|\\[\s\S])*\)|\[([\s\S]*?)\]/g);
            if (stringMatches) {
              const cleaned = stringMatches
                .map(s => s.replace(/[\(\)\[\]]/g, '').replace(/\\([()])/g, '$1'))
                .join(' ');
              if (cleaned.trim().length > 0) {
                textBlocks.push(cleaned.trim());
              }
            }
          }

          let extractedText = textBlocks.join(' ');

          // 2. Extração via regex de sequências de texto em streams descompactadas
          if (!extractedText || extractedText.trim().length < 20) {
            const streamMatches = rawText.match(/\/Text[\s\S]*?endstream|stream[\s\S]*?endstream/gi);
            if (streamMatches) {
              streamMatches.forEach(st => {
                const subStr = st.match(/\(([^()\\]|\\[\s\S])*\)/g);
                if (subStr) {
                  textBlocks.push(subStr.map(s => s.slice(1, -1)).join(' '));
                }
              });
              extractedText = textBlocks.join(' ');
            }
          }

          // 3. Fallback estendido: extração de qualquer sequência de caracteres de texto imprimíveis (UTF-8/Latin1)
          if (!extractedText || extractedText.trim().length < 20) {
            const printableMatches = rawText.match(/[\x20-\x7E\xA0-\xFF\n\r\t]{3,}/g);
            if (printableMatches) {
              extractedText = printableMatches
                .filter(str => !str.startsWith('/') && !str.includes('<<') && !str.includes('>>') && !str.includes('endobj') && !str.includes('stream') && !str.includes('xref') && !str.includes('trailer'))
                .join(' ');
            }
          }

          if (extractedText && extractedText.trim().length > 10) {
            // Limpa múltiplos espaços excessivos
            const cleanFinalText = extractedText.replace(/\s+/g, ' ').trim();
            resolve(`[DOCUMENTO PDF: ${file.name}]\n${cleanFinalText}`);
          } else {
            // Se for PDF puramente escaneado ou binário codificado, gera aviso legível
            resolve(`[DOCUMENTO PDF: ${file.name}]\n(Nota: Este arquivo PDF contém imagens digitalizadas sem camada de texto nativa extraível. O conteúdo extraído das streams foi: ${rawText.slice(0, 500).replace(/[^\x20-\x7E]/g, ' ')})`);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => resolve(evt.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    }
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

// Função de diagnósticos de limitações de leitura da página (ex: Google Sheets/Canvas/CSP)
function detectPageAccessStatus(tab, pageContentRaw) {
  const url = tab?.url || "";
  const isProtectedSystemPage = url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:');
  
  if (isProtectedSystemPage) {
    return {
      restricted: true,
      reason: 'system_page',
      badgeText: "Aba de sistema (foco nos anexos)",
      serviceName: "Página interna do navegador"
    };
  }

  // Identificação de serviços baseados em Canvas ou com restrições conhecidas
  const isSheets = url.includes('docs.google.com/spreadsheets');
  const isFigma = url.includes('figma.com');
  const isCanva = url.includes('canva.com');
  const isGoogleDocs = url.includes('docs.google.com/document');
  const isGoogleSlides = url.includes('docs.google.com/presentation');

  if (isSheets) {
    return {
      restricted: true,
      reason: 'sheets_canvas',
      badgeText: "⚠️ Leitura limitada: Google Sheets (Canvas)",
      serviceName: "Google Sheets"
    };
  }

  if (isFigma || isCanva || isGoogleSlides) {
    const service = isFigma ? "Figma" : isCanva ? "Canva" : "Google Apresentações";
    return {
      restricted: true,
      reason: 'canvas_app',
      badgeText: `⚠️ Leitura limitada: ${service} (Canvas)`,
      serviceName: service
    };
  }

  // Avaliação por densidade de texto do DOM extraído
  const cleanedLength = (pageContentRaw || "").trim().length;
  if (cleanedLength < 80) {
    return {
      restricted: true,
      reason: 'empty_dom',
      badgeText: "⚠️ Leitura limitada: Conteúdo de tela protegido/vazio",
      serviceName: "Página com proteção CSP/DOM restrito"
    };
  }

  return {
    restricted: false,
    reason: null,
    badgeText: `${Math.min(cleanedLength, MAX_PAGE_CHARS)} chars lidos da página`,
    serviceName: null
  };
}

// Extraction Script injected into Active Tab (suporta SPAs, TreeWalker, Shadow DOM, limitação de ruídos de UI e polling dinâmico)
async function extractCleanDOMText() {
  function getDeepText(node) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName ? node.tagName.toLowerCase() : '';
    if (['script', 'style', 'noscript', 'iframe', 'svg', 'button'].includes(tagName)) {
      return '';
    }

    let text = '';
    if (node.shadowRoot) {
      for (const child of node.shadowRoot.childNodes) {
        text += ' ' + getDeepText(child);
      }
    }

    for (const child of node.childNodes) {
      text += ' ' + getDeepText(child);
    }

    return text;
  }

  function getSnapshotText() {
    const rootElement = document.body;
    if (!rootElement) return '';

    // Clonar para manipulação limpa sem alterar o DOM real da página
    const clone = rootElement.cloneNode(true);

    // Seletores de ruído de interface (botões, cabeçalhos de usuário, navs, footers, elementos de ação)
    const excludeSelectors = [
      'script', 'style', 'noscript', 'svg',
      'button', 'input[type="button"]', 'input[type="submit"]',
      '.btn', '.button', '.menu', '.nav', '.navbar', '.header-usuario',
      'header', 'footer', 'nav'
    ];

    // Remove elementos indesejados no clone
    excludeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Preserva links úteis inserindo a URL entre parênteses ao lado do texto
    clone.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        const text = a.textContent.trim();
        if (text) {
          a.textContent = `${text} (${href})`;
        }
      }
    });

    // Varredura via TreeWalker para preservar separação adequada de termos e evitar termos colados
    const textParts = [];
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_ACCEPT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'button'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      const text = currentNode.nodeValue ? currentNode.nodeValue.trim() : '';
      if (text.length > 0) {
        textParts.push(text);
      }
    }

    let rawText = textParts.join(' ');

    // Varredura recursiva de iFrames acessíveis (Same-Origin) dentro do contexto atual
    try {
      const iframes = clone.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            const iframeText = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
            if (iframeText.trim().length > 0) {
              rawText += '\n\n--- [CONTEÚDO DE IFRAME EMBUTIDO] ---\n\n' + iframeText.replace(/\s+/g, ' ').trim();
            }
          }
        } catch (e) {
          // Ignora se for restrição Cross-Origin (trado via allFrames: true pelo Chrome API)
        }
      });
    } catch (err) {
      // Ignora falhas ao listar iFrames
    }

    // Fallback: se TreeWalker retornar pouco texto e houver Shadow DOM, realiza varredura profunda
    if (rawText.trim().length < 50) {
      const deepText = getDeepText(rootElement);
      if (deepText.trim().length > rawText.trim().length) {
        rawText = deepText;
      }
    }

    return rawText.replace(/\s+/g, ' ').trim();
  }

  // Tenta extração imediata
  let currentText = getSnapshotText();
  if (currentText.length >= 100) {
    return currentText;
  }

  // Polling dinâmico para SPAs (React/Vue/Angular) que carregam dados via AJAX/Fetch
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 6; // 6 x 500ms = 3 segundos
    const interval = setInterval(() => {
      attempts++;
      const newText = getSnapshotText();
      if (newText.length >= 100 || attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(newText.length > currentText.length ? newText : currentText);
      }
    }, 500);
  });
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

  if (!selectedSkillKey) {
    appendMessageUI('⚠️ **Por favor, selecione uma Habilidade no topo antes de enviar a pergunta.**', 'ai-msg', false);
    return;
  }

  // 1. Obter API Key (do storage ou fallback)
  const { gemini_api_key: storedKey } = await chrome.storage.local.get('gemini_api_key');
  const apiKey = storedKey || "";

  // Snapshot dos anexos atuais para esta requisição (permanecem ativos para perguntas subsequentes)
  const currentAttachedFiles = [...attachedFiles];

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

    // Exibe o indicador visual de carregamento/leitura da página no HTML
    if (pageReadingIndicator) {
      pageReadingIndicator.classList.remove('hidden');
      if (pageReadingText) pageReadingText.textContent = "Lendo e aguardando renderização da página ativa...";
    }

    // 4. Executar injeção no DOM da aba ativa com allFrames: true para capturar iFrames e SPAs
    let pageContentRaw = "";
    const isProtectedChromePage = tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:');

    if (!isProtectedChromePage) {
      try {
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          func: extractCleanDOMText
        });

        // Agrupa os resultados do frame principal e de eventuais iFrames
        if (injectionResults && injectionResults.length > 0) {
          const frameTexts = injectionResults
            .map(r => r.result)
            .filter(txt => txt && txt.trim().length > 0);
          
          if (frameTexts.length > 1) {
            pageContentRaw = frameTexts.join("\n\n--- [CONTEÚDO EXTRAÍDO DE IFRAME / QUADRO ADICIONAL] ---\n\n");
          } else {
            pageContentRaw = frameTexts[0] || "";
          }
        }
      } catch (err) {
        console.warn("Aviso ao extrair DOM da página:", err);
      }
    }

    // 5. Diagnóstico de Restrição de Acesso da Página
    const accessStatus = detectPageAccessStatus(tab, pageContentRaw);
    pageInfoBadge.textContent = accessStatus.badgeText;

    // 6. Truncamento Seguro e Montagem dos Prompts
    const pageContentTruncated = pageContentRaw.slice(0, MAX_PAGE_CHARS);

    let attachedContentText = "";
    if (currentAttachedFiles.length > 0) {
      attachedContentText = "\n\n[ARQUIVOS ANEXADOS PELO USUÁRIO PARA ANÁLISE]:\n" +
        currentAttachedFiles.map(f => `--- INÍCIO DO ARQUIVO: ${f.name} ---\n${f.content}\n--- FIM DO ARQUIVO: ${f.name} ---`).join("\n\n");
    }

    // Passa o conteúdo lido (mesmo que parco/escasso) com dados de diagnóstico para que a IA possa auditar o que foi lido
    let pageContextNote = pageContentTruncated || "Nenhum texto extraído da página.";
    if (accessStatus.restricted) {
      pageContextNote = `[DIAGNÓSTICO DE LEITURA DA PÁGINA ATIVA - ABA: ${tab.url || 'Webapp'}]\n- Status de Acesso: Restrito/Escasso (${accessStatus.badgeText})\n- Caracteres lidos: ${pageContentRaw.length}\n- CONTEÚDO BRUTO EXTRAÍDO DO DOM:\n"""\n${pageContentTruncated}\n"""\n\n[INSTRUÇÃO PARA A IA]: Analise o conteúdo bruto extraído acima para responder ao usuário. Identifique o que foi lido com sucesso e o que não foi capturado.`;
    }

    // 7. Montagem do Prompt Consolidado e Chamada via Google Apps Script Proxy Gateway
    const currentSkill = await buscarSkillNoGithub(selectedSkillKey);
    if (!currentSkill || !currentSkill.systemPrompt) {
      throw new Error("Não foi possível carregar as diretrizes da Habilidade selecionada.");
    }
    
    // Obter URL do endpoint do Apps Script das configurações (ou fallback padrão oficial)
    const proxyEndpoint = await getProxyEndpoint();

    // Recorrer ao histórico da sessão ativa
    const { chat_sessions = [] } = await chrome.storage.local.get('chat_sessions');
    const activeSession = chat_sessions.find(s => s.id === activeChatId);
    const historyMessages = (activeSession?.messages || []).slice(-MAX_HISTORY_TURNS);

    const systemInstructionText = `[DIRETRIZ DA SKILL / SYSTEM INSTRUCTION]:\n${currentSkill.systemPrompt}\n\n${STRICT_DOCUMENT_SCOPE_PROMPT}\n\n[BASE DE CONHECIMENTO - CONTEÚDO EXTRAÍDO DA PÁGINA ATUAL]:\n${pageContextNote}${attachedContentText}`;

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
      let errDetail = response.statusText;
      try {
        const errData = await response.json();
        errDetail = errData.message || errData.error || errDetail;
      } catch (e) {
        const rawText = await response.text().catch(() => "");
        if (rawText) errDetail = rawText.slice(0, 150);
      }
      throw new Error(`Erro no Proxy Apps Script (${response.status}): ${errDetail || "Não foi possível conectar ao servidor."}`);
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
    if (pageReadingIndicator) pageReadingIndicator.classList.add('hidden');
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
    // Se a mensagem contiver um bloco de código de prompt interativo em JSON (interactive_prompt), renderiza o card interativo
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || [null, text];
    let isInteractive = false;
    try {
      const parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (parsedData && parsedData.type === 'interactive_prompt' && Array.isArray(parsedData.options)) {
        isInteractive = true;
        renderizarCardInterativo(msgDiv, parsedData);
      }
    } catch (e) {
      // Não é um JSON interativo, segue renderização normal
    }

    if (!isInteractive) {
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

    // Se for uma resposta da IA e for longa (> 500 caracteres), adicionar link/botão para baixar o arquivo .md
    if (!typeClass.includes('loading') && text.length > 500) {
      const downloadFooter = document.createElement('div');
      downloadFooter.className = 'md-download-footer';
      
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'md-download-btn';
      downloadBtn.title = 'Baixar esta resposta em formato Markdown (.md)';
      downloadBtn.innerHTML = '📥 <span>Baixar resposta (.md)</span>';
      
      downloadBtn.addEventListener('click', () => {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        a.download = `resposta_assistente_${timestamp}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      downloadFooter.appendChild(downloadBtn);
      msgDiv.appendChild(downloadFooter);
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

/**
 * Renderiza um card interativo com botões de seleção de opção no chat do sidepanel
 */
function renderizarCardInterativo(containerEl, dadosPrompt) {
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

  dadosPrompt.options.forEach((opcao, idx) => {
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
      // Desabilita todos os botões do card após seleção
      optionsGroup.querySelectorAll('.interactive-option-btn').forEach(b => {
        b.disabled = true;
        b.classList.add('disabled');
      });
      btn.classList.add('selected');

      // Preenche o input e envia a resposta selecionada
      const textoParaEnviar = opcao.value || opcao.label || opcao.text;
      if (userInputEl) {
        userInputEl.value = textoParaEnviar;
        processarRequisicao();
      }
    });

    optionsGroup.appendChild(btn);
  });

  cardDiv.appendChild(optionsGroup);
  containerEl.appendChild(cardDiv);
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
