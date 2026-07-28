/**
 * Google Apps Script - Web App Proxy Gateway
 * Projeto: Assistente do Jorge
 * 
 * Função: 
 * 1. Receber requisições da extensão do Chrome via HTTP POST (doPost)
 * 2. Validar o e-mail do usuário autenticado na Planilha Google Sheets de permissões
 * 3. Recuperar a GEMINI_API_KEY armazenada com segurança nas Script Properties
 * 4. Chamar a API do Gemini (gemini-2.5-flash) via UrlFetchApp
 * 5. Retornar a resposta sanitizada ou mensagens de erro de permissão
 */

// ID da Planilha Google de Controle de Usuários (Substitua se necessário)
const SPREADSHEET_ID = "1VbXL-23CimrbmoEThgPRSepOfzmgRtTXrIyftwXBRGE";
const SHEET_NAME = "Usuarios";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ error: "Payload inválido ou corpo da requisição vazio." }, 400);
    }

    const data = JSON.parse(e.postData.contents);
    const userEmail = (data.userEmail || "").trim().toLowerCase();
    const promptConsolidado = data.promptConsolidado || "";
    const systemInstruction = data.systemInstruction || "";
    const model = data.model || "gemini-2.5-flash";

    if (!userEmail) {
      return jsonResponse({ error: "E-mail do usuário não informado no payload." }, 401);
    }

    // 1. Validar Acesso na Planilha Google Sheets
    const accessCheck = validarAcessoUsuario(userEmail);
    if (!accessCheck.authorized) {
      return jsonResponse({ 
        error: "ACESSO_NEGADO", 
        message: accessCheck.message || "Seu e-mail não possui autorização para utilizar a extensão." 
      }, 403);
    }

    // 2. Recuperar a Chave da API do Gemini das Script Properties
    const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "GEMINI_API_KEY não configurada nas Propriedades do Script." }, 500);
    }

    // 3. Montar Payload para a API do Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contentsPayload = [];
    if (data.contents && Array.isArray(data.contents)) {
      contentsPayload.push(...data.contents);
    } else if (promptConsolidado) {
      contentsPayload.push({
        role: "user",
        parts: [{ text: promptConsolidado }]
      });
    }

    const payload = {
      contents: contentsPayload
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    // 4. Fazer Chamada à API do Gemini via UrlFetchApp
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      return jsonResponse({ 
        error: `Erro na API do Gemini (HTTP ${responseCode})`, 
        details: responseText 
      }, responseCode);
    }

    const geminiData = JSON.parse(responseText);
    return jsonResponse(geminiData, 200);

  } catch (err) {
    return jsonResponse({ error: "Erro interno no servidor Proxy: " + err.toString() }, 500);
  }
}

/**
 * Consulta a Planilha Google Sheets para verificar se o e-mail está ATIVO
 */
function validarAcessoUsuario(email) {
  try {
    let sheet;
    try {
      sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    } catch (e) {
      // Se não encontrar por ID, tenta usar a planilha ativa
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    }

    if (!sheet) {
      // Se a planilha ainda não existir ou não estiver vinculada, permite em modo fallback/dev
      return { authorized: true, message: "Modo dev: planilha não encontrada" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { authorized: false, message: "A planilha de usuários está vazia." };
    }

    // Assumindo Coluna A = E-mail, Coluna C = Status (ou busca por colunas)
    const headers = data[0].map(h => h.toString().toLowerCase().trim());
    const emailIndex = headers.indexOf("e-mail") !== -1 ? headers.indexOf("e-mail") : 0;
    const statusIndex = headers.indexOf("status") !== -1 ? headers.indexOf("status") : 2;

    for (let i = 1; i < data.length; i++) {
      const rowEmail = data[i][emailIndex].toString().trim().toLowerCase();
      const rowStatus = data[i][statusIndex].toString().trim().toUpperCase();

      if (rowEmail === email) {
        if (rowStatus === "ATIVO" || rowStatus === "ACTIVE" || rowStatus === "SIM" || rowStatus === "1") {
          return { authorized: true };
        } else {
          return { authorized: false, message: "Sua conta está inativa na planilha de acesso." };
        }
      }
    }

    return { authorized: false, message: "E-mail não cadastrado na lista de acesso permitido." };

  } catch (err) {
    // Em caso de falha de acesso à planilha, autoriza em fallback para não travar desenvolvimento
    console.warn("Aviso na validação de usuário:", err);
    return { authorized: true, message: "Fallback por erro de leitura" };
  }
}

/**
 * Helper para retornar respostas em formato JSON com MIME Type correto
 */
function jsonResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "online", message: "Google Apps Script Proxy Gateway - Assistente do Jorge" }))
    .setMimeType(ContentService.MimeType.JSON);
}
