// src/sidepanel/auth.js
import { carregarSkillsDinamicas } from './skills.js';
import { iniciarNovaConversa } from './chat.js';
import { validarUsuarioProxy } from './api.js';
import { 
  mainAppScreen, loginScreen, accessDeniedScreen,
  userAvatar, userName, userEmail, googleLoginBtn, googleLogoutBtn,
  retryAuthBtn, deniedLogoutBtn, deniedUserEmail, loginErrorMsg 
} from './ui.js';

export let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function obterUsuarioAtual() {
  if (currentUser?.email) return currentUser;
  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    try {
      const sess = await chrome.storage.session.get('user_profile');
      if (sess?.user_profile?.email) {
        currentUser = sess.user_profile;
        return currentUser;
      }
    } catch (e) {
      console.warn('[Auth] Erro ao recuperar sessão do storage:', e);
    }
  }
  return currentUser;
}

export function verificarPermissaoSkillUsuario(skillKey, allowedSkills = null) {
  const skillsList = allowedSkills || currentUser?.allowed_skills || ["ALL"];
  const normalizedAllowed = skillsList.map(s => String(s).trim().toUpperCase());
  if (normalizedAllowed.includes("ALL") || normalizedAllowed.includes("*") || normalizedAllowed.includes("TODAS")) {
    return { permitida: true };
  }
  const keyUpper = String(skillKey || "").trim().toUpperCase();
  if (normalizedAllowed.includes(keyUpper)) {
    return { permitida: true };
  }
  return {
    permitida: false,
    mensagem: `A Habilidade '${skillKey}' não está autorizada no seu perfil. Por favor, selecione outra.`
  };
}

const PROXY_CONFIG = Object.freeze({
  DEFAULT_APPS_SCRIPT_ENDPOINT: "https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec"
});

function exibirPerfilLogado(profile) {
  if (userAvatar) userAvatar.src = profile.picture;
  if (userName) userName.textContent = profile.name;
  if (userEmail) userEmail.textContent = profile.email;
  mainAppScreen.classList.remove('hidden');
  loginScreen.classList.add('hidden');
  if (accessDeniedScreen) accessDeniedScreen.classList.add('hidden');
  iniciarNovaConversa(false);
}

function exibirTelaLogin(errorMessage = null) {
  mainAppScreen.classList.add('hidden');
  if (accessDeniedScreen) accessDeniedScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  if (loginErrorMsg) {
    loginErrorMsg.textContent = errorMessage || '';
    loginErrorMsg.classList.toggle('hidden', !errorMessage);
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

async function getProxyEndpoint() {
    const officialEndpoint = PROXY_CONFIG.DEFAULT_APPS_SCRIPT_ENDPOINT;
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return officialEndpoint;
    try {
        const { apps_script_endpoint: storedEndpoint } = await chrome.storage.local.get('apps_script_endpoint');
        if (storedEndpoint && storedEndpoint !== officialEndpoint) {
            await chrome.storage.local.set({ apps_script_endpoint: officialEndpoint });
        } else if (!storedEndpoint) {
            await chrome.storage.local.set({ apps_script_endpoint: officialEndpoint });
        }
    } catch (err) {
        console.warn('[Proxy Auth] Erro ao verificar endpoint:', err);
    }
    return officialEndpoint;
}

async function validarUsuarioNaPlanilha(email) {
  try {
    const proxyEndpoint = await getProxyEndpoint();
    const authToken = currentUser?.token || "";
    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ authToken, userEmail: email, action: "check_user_status" })
    });
    if (!response.ok) return { authorized: false, message: "Falha de conexão com o servidor de validação." };
    const data = await response.json();
    if (data.error) return { authorized: false, message: data.message || "Acesso negado." };
    return { authorized: true, allowed_skills: data.allowed_skills || ["ALL"] };
  } catch (err) {
    return { authorized: false, message: "Erro de conexão ao validar permissões." };
  }
}

async function buscarPerfilUsuario(token) {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Não foi possível obter dados do perfil.');
  const data = await resp.json();
  return { name: data.name || 'Usuário', email: data.email, picture: data.picture || 'icons/icon48.png' };
}

async function realizarLoginGoogle(interactive = true) {
  if (typeof chrome === 'undefined' || !chrome.identity) return false;
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (t) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(t));
    });
    if (!token) {
        if(interactive) exibirTelaLogin();
        return false;
    }
    const profile = await buscarPerfilUsuario(token);
    currentUser = { ...profile, token };
    const validation = await validarUsuarioProxy(profile.email, token);
    if (!validation.authorized) {
      exibirTelaAcessoNegado(profile.email, validation.message);
      currentUser = null;
      return false;
    }
    currentUser.allowed_skills = validation.allowed_skills || ["ALL"];
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ user_profile: currentUser });
    }
    await carregarSkillsDinamicas();
    exibirPerfilLogado(currentUser);
    return true;
  } catch (err) {
    console.warn('Falha no fluxo de login:', err);
    if (interactive) exibirTelaLogin();
    return false;
  }
}

async function realizarLogoutGoogle() {
  if (typeof chrome === 'undefined' || !chrome.identity) return;
  try {
    const { user_profile } = (chrome.storage?.session ? await chrome.storage.session.get('user_profile') : {});
    if (user_profile?.token) {
      await new Promise(r => chrome.identity.removeCachedAuthToken({ token: user_profile.token }, r));
    }
    if (chrome.storage?.session) {
      await chrome.storage.session.remove('user_profile');
    }
    currentUser = null;
    exibirTelaLogin();
  } catch (err) {
    console.error('Erro no logout:', err);
    exibirTelaLogin();
  }
}

async function revalidarPermissaoUsuario() {
    await realizarLoginGoogle(true);
}

async function verificarStatusAuth() {
  if (typeof chrome === 'undefined' || !chrome.storage) {
      exibirTelaLogin();
      return;
  }
  try {
    let user_profile = null;
    if (chrome.storage.session) {
      const sess = await chrome.storage.session.get('user_profile');
      user_profile = sess.user_profile;
    }
    if (user_profile?.email) {
      currentUser = user_profile;
      const validation = await validarUsuarioProxy(currentUser.email, currentUser.token || "");
      if (validation.authorized) {
        currentUser.allowed_skills = validation.allowed_skills || ["ALL"];
        await carregarSkillsDinamicas();
        exibirPerfilLogado(currentUser);
        return;
      }
    }
    const autoLoggedIn = await realizarLoginGoogle(false);
    if (!autoLoggedIn) exibirTelaLogin();
  } catch (err) {
    exibirTelaLogin();
  }
}

export function initAuth() {
  googleLoginBtn?.addEventListener('click', () => realizarLoginGoogle(true));
  googleLogoutBtn?.addEventListener('click', realizarLogoutGoogle);
  retryAuthBtn?.addEventListener('click', revalidarPermissaoUsuario);
  deniedLogoutBtn?.addEventListener('click', realizarLogoutGoogle);
  verificarStatusAuth();
}
