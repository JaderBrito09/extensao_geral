// src/sidepanel/api.js
/**
 * Módulo Centralizado de Comunicação com o Proxy Gateway Google Apps Script
 */

export const PROXY_CONFIG = Object.freeze({
  DEFAULT_APPS_SCRIPT_ENDPOINT: "https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec",
  DEFAULT_GEMINI_MODEL: "gemini-2.5-flash"
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

/**
 * Valida o usuário e obtém status de acesso na Planilha Google Sheets
 */
export async function validarUsuarioProxy(email, authToken = "") {
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
      return { authorized: false, message: "Falha de comunicação com o servidor de validação." };
    }

    const data = await response.json();
    if (data.error === "ACESSO_NEGADO") {
      return { authorized: false, message: data.message || "Usuário não autorizado a acessar o assistente." };
    } else if (data.error) {
      return { authorized: false, message: "Erro na validação: " + data.error };
    }

    return { authorized: true, allowed_skills: data.allowed_skills || ["ALL"] };
  } catch (err) {
    console.error("[Proxy API] Erro na validação do usuário:", err);
    return { authorized: false, message: "Erro de conexão ao validar permissões." };
  }
}

/**
 * Envia prompt estruturado para o Proxy Gateway com autenticação forte e payload canônico
 */
export async function chamarProxyGemini({ authToken, userEmail, requestedSkill, systemInstruction, contents, model }) {
  const proxyEndpoint = await getProxyEndpoint();
  const requestedSkillId = requestedSkill || "gestaogov";

  if (!userEmail) {
    throw new Error("E-mail do usuário não informado no payload. Favor verificar a autenticação com a conta Google.");
  }

  const payloadBody = {
    authToken: authToken || "",
    userEmail: userEmail,
    requestedSkill: requestedSkillId,
    systemInstruction: systemInstruction || "",
    contents: contents || [],
    model: model || PROXY_CONFIG.DEFAULT_GEMINI_MODEL
  };

  const response = await fetch(proxyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payloadBody)
  });

  if (!response.ok) {
    let errDetail = "";
    try {
      const errJson = await response.json();
      errDetail = errJson.message || errJson.error || "";
    } catch (e) {
      const rawText = await response.text().catch(() => "");
      if (rawText) errDetail = rawText.slice(0, 150);
    }
    throw new Error(`Erro no Proxy Apps Script (${response.status}): ${errDetail || "Não foi possível conectar ao servidor."}`);
  }

  const data = await response.json();

  if (data.error === "ACESSO_NEGADO") {
    throw new Error(`Acesso não autorizado: ${data.message || "Usuário ou Habilidade não autorizada na planilha."}`);
  } else if (data.error) {
    const detail = data.message || data.error;
    throw new Error(`Erro da API: ${detail}`);
  }

  const respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || data.response || "Sem resposta gerada pelo modelo.";
  return respostaIA;
}

/**
 * Helpers para o protocolo padronizado de mensagens entre componentes da extensão
 */
export function createStandardMessage(source, action, payload = {}, target = '*') {
  return {
    source: source || 'JORGE_EXTENSION',
    target: target || '*',
    action: action,
    payload: payload,
    timestamp: Date.now()
  };
}

export function isStandardMessage(data) {
  return Boolean(data && typeof data === 'object' && typeof data.source === 'string' && data.source.startsWith('JORGE_') && typeof data.action === 'string');
}
