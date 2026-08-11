/**
 * src/services/geminiProxy.js
 * Módulo de comunicação com o Proxy Gateway Google Apps Script
 */

export const PROXY_CONFIG = Object.freeze({
  DEFAULT_APPS_SCRIPT_ENDPOINT: "https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec"
});

export async function getProxyEndpoint() {
  const officialEndpoint = PROXY_CONFIG.DEFAULT_APPS_SCRIPT_ENDPOINT;
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return officialEndpoint;
  }

  try {
    const { apps_script_endpoint: storedEndpoint } = await chrome.storage.local.get('apps_script_endpoint');
    if (storedEndpoint && storedEndpoint !== officialEndpoint) {
      console.warn(`[Proxy Integration Log] Sobrescrita indevida do endpoint do proxy detectada (${storedEndpoint}). Restaurando e forçando o endpoint oficial v7: ${officialEndpoint}`);
      await chrome.storage.local.set({ apps_script_endpoint: officialEndpoint });
    } else if (!storedEndpoint) {
      await chrome.storage.local.set({ apps_script_endpoint: officialEndpoint });
    }
  } catch (err) {
    console.warn('[Proxy Integration Log] Erro ao verificar storage local para o endpoint do proxy:', err);
  }

  return officialEndpoint;
}

export async function validarUsuarioNaPlanilha(email, authToken = "") {
  try {
    const proxyEndpoint = await getProxyEndpoint();
    console.log('[Proxy Integration Log] Endpoint proxy validado para verificação de usuário v7:', proxyEndpoint);

    const response = await fetch(proxyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        authToken: authToken,
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

    return { authorized: true, allowed_skills: data.allowed_skills || ["ALL"] };
  } catch (err) {
    console.warn("Aviso na validação de permissão:", err);
    return { authorized: false, message: "Erro de conexão ao validar permissões de acesso do usuário." };
  }
}
