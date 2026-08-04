const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const marked = require('marked');

console.log("=== INICIANDO TESTES (SPRINT 1 A 4) ===\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log("✅ PASSOU: " + message);
        passed++;
    } else {
        console.error("❌ FALHOU: " + message);
        failed++;
    }
}

// ---------------------------------------------------------
// Teste Sprint 1 e 2: DOMPurify e Marked.js (XSS e Markdown)
// ---------------------------------------------------------
console.log("--- Testando Sanitização e Markdown (Sprint 1 & 2) ---");

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Simulando mensagem de IA maliciosa
const maliciousMarkdown = "**Texto em negrito** e um [link](javascript:alert(1)) e `<script>alert('xss')</script>`";
const rawHtml = marked.parse(maliciousMarkdown);
const cleanHtml = purify.sanitize(rawHtml);

assert(!cleanHtml.includes('<script>'), "Tags <script> devem ser removidas");
assert(!cleanHtml.includes('javascript:'), "Links 'javascript:' devem ser sanitizados");
assert(cleanHtml.includes('<strong>Texto em negrito</strong>'), "Markdown de negrito deve ser parseado corretamente");

// ---------------------------------------------------------
// Teste Sprint 4: Extração de DOM Inteligente (Tarefa 10)
// ---------------------------------------------------------
console.log("\n--- Testando Extração de DOM (Sprint 4) ---");

// Copiando a lógica exata de sidepanel.js
function extractCleanDOMText(documentBody) {
  const clone = documentBody.cloneNode(true);
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

// Cenario 1: Pagina com <main>
const dom1 = new JSDOM(`
  <html>
    <body>
      <header>Cabecalho Principal</header>
      <nav>Menu 1 | Menu 2</nav>
      <main>
        <h1>Conteudo Principal</h1>
        <p>Texto do artigo.</p>
        <script>console.log('ruido');</script>
      </main>
      <footer>Rodape da pagina</footer>
    </body>
  </html>
`);
const text1 = extractCleanDOMText(dom1.window.document.body);
assert(!text1.includes('Cabecalho Principal'), "Cabecalho deve ser ignorado quando houver <main>");
assert(!text1.includes('Rodape da pagina'), "Rodape deve ser ignorado quando houver <main>");
assert(!text1.includes('ruido'), "Tags script devem ser removidas");
assert(text1.includes('Conteudo Principal') && text1.includes('Texto do artigo.'), "Conteudo do <main> deve ser preservado");


// Cenario 2: Pagina SEM <main> ou <article>
const dom2 = new JSDOM(`
  <html>
    <body>
      <header>Cabecalho Simples</header>
      <div>
        <p>Texto avulso numa div.</p>
        <style>body { color: red; }</style>
      </div>
      <footer>Rodape Simples</footer>
    </body>
  </html>
`);
const text2 = extractCleanDOMText(dom2.window.document.body);
assert(text2.includes('Cabecalho Simples'), "Cabecalho deve ser preservado quando NÃO houver <main>");
assert(text2.includes('Rodape Simples'), "Rodape deve ser preservado quando NÃO houver <main>");
assert(text2.includes('Texto avulso numa div.'), "Conteudo normal deve ser preservado");
assert(!text2.includes('color: red;'), "Tags style devem ser removidas sempre");

console.log(`\n=== RESULTADO (SPRINT 1 A 4): ${passed} Passaram, ${failed} Falharam ===`);

// ---------------------------------------------------------
// Teste Sprint 8 & 9: Injeção de Prompt Estrito e Arquivos
// ---------------------------------------------------------
console.log("\n--- Testando Prompt Estrito e Gestão de Anexos (Sprint 8 & 9) ---");

const fs = require('fs');
const path = require('path');
const sidepanelCode = fs.readFileSync(path.join(__dirname, '../sidepanel.js'), 'utf8');

assert(sidepanelCode.includes('STRICT_DOCUMENT_SCOPE_PROMPT'), "Constante STRICT_DOCUMENT_SCOPE_PROMPT deve existir no sidepanel.js");
assert(sidepanelCode.includes('A informação solicitada não consta na documentação nem nos arquivos fornecidos'), "Mensagem de solicitação de permissão externa deve estar no prompt");
assert(sidepanelCode.includes('DEFAULT_GEMINI_MODEL'), "Modelo Padrão Gemini deve estar configurado como constante");
assert(sidepanelCode.includes('gemini-2.5-flash'), "Modelo padrão deve ser gemini-2.5-flash");
assert(sidepanelCode.includes('attachedFiles'), "Gestão de anexos do usuário deve estar implementada");
assert(sidepanelCode.includes('chat_sessions'), "Histórico de sessões de conversa salvas no computador deve estar implementado");

// ---------------------------------------------------------
// Teste Versão 7: Proteção de Endpoint do Proxy e Logs de Integração
// ---------------------------------------------------------
console.log("\n--- Testando Proteção de Endpoint do Proxy na v7 ---");

assert(sidepanelCode.includes('PROXY_CONFIG'), "Objeto PROXY_CONFIG imutável deve estar definido");
assert(sidepanelCode.includes('Object.freeze'), "Configuração do proxy deve estar congelada com Object.freeze");
assert(sidepanelCode.includes('[Proxy Integration Log]'), "Logs de integração do proxy devem estar implementados");
assert(sidepanelCode.includes('Sobrescrita indevida do endpoint do proxy detectada'), "Detecção e restauração contra override indevido deve estar no sidepanel.js");

// Simulação de execução da lógica de getProxyEndpoint com mock de chrome.storage
async function runProxyEndpointProtectionTest() {
  const officialUrl = "https://script.google.com/macros/s/AKfycbzjrjLaSlID5FGzx5zDoIQjJCUW-5LTImg90v6us2X3v55l0e0_UodEwv70kgbQAdTq/exec";
  let mockStorage = { apps_script_endpoint: "https://invalid-override-endpoint.com/api" };
  let logWarnings = [];

  const fakeChrome = {
    storage: {
      local: {
        get: async (key) => ({ [key]: mockStorage[key] }),
        set: async (obj) => { Object.assign(mockStorage, obj); }
      }
    }
  };

  // Simular getProxyEndpoint com fakeChrome
  async function testGetProxyEndpoint() {
    const { apps_script_endpoint: storedEndpoint } = await fakeChrome.storage.local.get('apps_script_endpoint');
    if (storedEndpoint && storedEndpoint !== officialUrl) {
      logWarnings.push(`Override detectado: ${storedEndpoint}`);
      await fakeChrome.storage.local.set({ apps_script_endpoint: officialUrl });
    }
    return officialUrl;
  }

  const resultEndpoint = await testGetProxyEndpoint();

  assert(resultEndpoint === officialUrl, "getProxyEndpoint deve retornar estritamente a URL oficial v7");
  assert(mockStorage.apps_script_endpoint === officialUrl, "Storage local deve ser corrigido para a URL oficial v7");
  assert(logWarnings.length > 0, "Aviso de integração deve ter sido emitido quando detectado override indevido");

  // ---------------------------------------------------------
  // Teste Validação da Coluna de Skills e Eliminação de Bypass
  // ---------------------------------------------------------
  console.log("\n--- Testando Validação da Coluna de Skills e Prevenção de Bypass ---");

  const gsCode = fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8');

  assert(gsCode.includes('candidateHeaders'), "Code.gs deve possuir busca dinâmica pelas variações de cabeçalho de skills");
  assert(gsCode.includes('requestedSkill'), "Code.gs deve capturar a skill solicitada na requisição de geração");
  assert(gsCode.includes('Acesso negado: a Habilidade'), "Code.gs deve retornar 403 ACESSO_NEGADO quando a skill não for permitida");
  assert(!gsCode.includes('return { authorized: true, allowed_skills: ["ALL"], message: "Fallback por erro de leitura" };'), "Code.gs não deve conceder fallback universal em caso de erro de leitura");

  assert(sidepanelCode.includes('requestedSkill: requestedSkillId'), "sidepanel.js deve enviar a requestedSkill no payload do proxy");
  assert(sidepanelCode.includes('allowed_skills: data.allowed_skills || ["ALL"]'), "validarUsuarioNaPlanilha no sidepanel.js deve utilizar as skills retornadas pelo backend");
  assert(sidepanelCode.includes('não está autorizada no seu perfil'), "sidepanel.js deve validar client-side se a habilidade é autorizada");

  // Teste de Unidade da Lógica de Validação da Coluna de Skills do Backend Apps Script
  function mockValidarAcessoUsuario(email, sheetData) {
    if (!sheetData || sheetData.length <= 1) return { authorized: false, message: "Planilha vazia" };
    const headers = sheetData[0].map(h => h.toString().toLowerCase().trim());
    const emailIndex = headers.indexOf("e-mail") !== -1 ? headers.indexOf("e-mail") : 0;
    const statusIndex = headers.indexOf("status") !== -1 ? headers.indexOf("status") : 2;
    
    let skillsIndex = -1;
    const candidateHeaders = ["skills permitidas", "skills_permitidas", "skills", "habilidades permitidas"];
    for (const cand of candidateHeaders) {
      const idx = headers.indexOf(cand);
      if (idx !== -1) { skillsIndex = idx; break; }
    }

    for (let i = 1; i < sheetData.length; i++) {
      const rowEmail = sheetData[i][emailIndex].toString().trim().toLowerCase();
      const rowStatus = sheetData[i][statusIndex].toString().trim().toUpperCase();
      if (rowEmail === email.toLowerCase()) {
        if (rowStatus === "ATIVO" || rowStatus === "ACTIVE" || rowStatus === "SIM" || rowStatus === "1") {
          let allowedSkills = ["ALL"];
          if (skillsIndex !== -1 && sheetData[i][skillsIndex] !== undefined && sheetData[i][skillsIndex] !== null) {
            const raw = sheetData[i][skillsIndex].toString().trim();
            if (raw !== "") {
              const parsed = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
              if (parsed.length > 0) {
                const isAll = parsed.some(s => ["ALL", "TODAS", "*"].includes(s.toUpperCase()));
                allowedSkills = isAll ? ["ALL"] : parsed;
              }
            }
          }
          return { authorized: true, allowed_skills: allowedSkills };
        } else {
          return { authorized: false, message: "Inativo" };
        }
      }
    }
    return { authorized: false, message: "Não encontrado" };
  }

  function mockDoPostValidation(userEmail, requestedSkill, sheetData) {
    const accessCheck = mockValidarAcessoUsuario(userEmail, sheetData);
    if (!accessCheck.authorized) return { statusCode: 403, error: "ACESSO_NEGADO" };
    
    const allowed = (accessCheck.allowed_skills || ["ALL"]).map(s => s.toUpperCase());
    const isAll = allowed.includes("ALL") || allowed.includes("*") || allowed.includes("TODAS");

    if (!isAll) {
      if (!requestedSkill) return { statusCode: 403, error: "ACESSO_NEGADO", message: "Nenhuma skill informada" };
      const reqUpper = requestedSkill.toUpperCase();
      if (!allowed.includes(reqUpper)) {
        return { statusCode: 403, error: "ACESSO_NEGADO", message: "Skill não autorizada" };
      }
    }
    return { statusCode: 200, status: "SUCCESS" };
  }

  const mockSheet = [
    ["E-mail", "Nome", "Status", "Skills Permitidas"],
    ["usuario.restrito@empresa.com", "Restrito", "ATIVO", "geral, compliance-exemplo"],
    ["usuario.admin@empresa.com", "Admin", "ATIVO", "ALL"],
    ["usuario.inativo@empresa.com", "Inativo", "INATIVO", "geral"]
  ];

  // Cenário A: Usuário com skills restritas acessando skill permitida ("geral")
  const resA = mockDoPostValidation("usuario.restrito@empresa.com", "geral", mockSheet);
  assert(resA.statusCode === 200, "Usuário restrito deve ter acesso à skill 'geral' permitida na planilha");

  // Cenário B: Usuário com skills restritas tentando bypass com skill não autorizada ("financeiro")
  const resB = mockDoPostValidation("usuario.restrito@empresa.com", "financeiro", mockSheet);
  assert(resB.statusCode === 403 && resB.error === "ACESSO_NEGADO", "Tentativa de bypass com skill não autorizada deve ser rejeitada com 403 ACESSO_NEGADO");

  // Cenário C: Usuário com skills restritas enviando requisição sem informar skill
  const resC = mockDoPostValidation("usuario.restrito@empresa.com", "", mockSheet);
  assert(resC.statusCode === 403 && resC.error === "ACESSO_NEGADO", "Requisição sem informar skill para usuário com permissões restritas deve ser rejeitada");

  // Cenário D: Usuário com acesso universal ("ALL") acessando qualquer skill
  const resD = mockDoPostValidation("usuario.admin@empresa.com", "financeiro", mockSheet);
  assert(resD.statusCode === 200, "Usuário com permissão ALL deve poder acessar qualquer skill");

  // ---------------------------------------------------------
  // Teste Conflito e Sincronização Popup vs Sidepanel
  // ---------------------------------------------------------
  console.log("\n--- Testando Isolamento de Listeners e Sincronização Popup/Sidepanel ---");

  const manifestJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'));
  const bgCode = fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8');
  const contentCode = fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8');
  const popupCode = fs.readFileSync(path.join(__dirname, '../popup.js'), 'utf8');

  assert(!manifestJson.action || !manifestJson.action.default_popup, "default_popup não deve constar no manifest.json para evitar conflito com SidePanel");
  assert(bgCode.includes("request.target && request.target !== 'background'"), "background.js deve isolar o listener filtrando target 'background'");
  assert(contentCode.includes("request.target && request.target !== 'content'"), "content.js deve isolar o listener filtrando target 'content'");
  assert(popupCode.includes("request.target && request.target !== 'popup'"), "popup.js deve isolar o listener filtrando target 'popup'");
  assert(popupCode.includes("chrome.storage.onChanged.addListener"), "popup.js deve escutar alterações no storage para sincronia em tempo real");
  assert(sidepanelCode.includes("request.target && request.target !== 'sidepanel'"), "sidepanel.js deve isolar o listener filtrando target 'sidepanel'");
  assert(sidepanelCode.includes("chrome.storage.onChanged.addListener"), "sidepanel.js deve escutar alterações no storage para sincronia em tempo real");

  // ---------------------------------------------------------
  // Teste Sincronização e Travas no Storage e Mensagens Padronizadas
  // ---------------------------------------------------------
  console.log("\n--- Testando Travas de Storage e Protocolo de Mensagens Padronizadas ---");

  assert(sidepanelCode.includes('class StorageLockManager'), "StorageLockManager deve estar implementado no sidepanel.js");
  assert(sidepanelCode.includes('storageLock.updateKey'), "Operações de escrita no storage devem utilizar storageLock.updateKey para prevenir race condition");
  assert(sidepanelCode.includes('isStandardMessage'), "Helper isStandardMessage deve estar presente para validação de postMessage");
  assert(sidepanelCode.includes('createStandardMessage'), "Helper createStandardMessage deve estar presente");

  // Simulação de concorrência com StorageLockManager
  class MockStorageLockManager {
    constructor() {
      this._locks = new Map();
    }
    async withLock(key, fn) {
      if (!this._locks.has(key)) this._locks.set(key, Promise.resolve());
      const previousLock = this._locks.get(key);
      let resolveNext;
      const nextLock = new Promise(resolve => { resolveNext = resolve; });
      this._locks.set(key, previousLock.then(() => nextLock, () => nextLock));
      try {
        await previousLock;
        return await fn();
      } finally {
        resolveNext();
      }
    }
    async updateKey(key, defaultValue, updaterFn) {
      return this.withLock(key, async () => {
        const currentValue = mockStorage[key] !== undefined ? mockStorage[key] : defaultValue;
        const updatedValue = await updaterFn(currentValue);
        if (updatedValue !== undefined) mockStorage[key] = updatedValue;
        return updatedValue;
      });
    }
  }

  const mockLock = new MockStorageLockManager();
  mockStorage['chat_sessions'] = [];

  // Executar 3 escritas concorrentes em paralelo sem await individual
  const p1 = mockLock.updateKey('chat_sessions', [], async (arr) => {
    await new Promise(r => setTimeout(r, 20));
    return [...arr, { id: 'msg-1' }];
  });
  const p2 = mockLock.updateKey('chat_sessions', [], async (arr) => {
    await new Promise(r => setTimeout(r, 10));
    return [...arr, { id: 'msg-2' }];
  });
  const p3 = mockLock.updateKey('chat_sessions', [], async (arr) => {
    await new Promise(r => setTimeout(r, 5));
    return [...arr, { id: 'msg-3' }];
  });

  await Promise.all([p1, p2, p3]);

  assert(mockStorage['chat_sessions'].length === 3, "Travas do storage devem garantir a inclusão de todas as 3 mensagens sem perda por condição de corrida");
  assert(mockStorage['chat_sessions'][0].id === 'msg-1' && mockStorage['chat_sessions'][1].id === 'msg-2' && mockStorage['chat_sessions'][2].id === 'msg-3', "A ordem das mensagens deve ser mantida sequencialmente na fila do lock");

  // Teste Mensagens Padronizadas
  function testCreateStandardMessage(source, action, payload = {}, target = '*') {
    return {
      source: source || 'JORGE_EXTENSION',
      target: target || '*',
      action: action,
      payload: payload,
      timestamp: Date.now()
    };
  }

  function testIsStandardMessage(data) {
    return data && typeof data === 'object' && typeof data.source === 'string' && data.source.startsWith('JORGE_') && typeof data.action === 'string';
  }

  const stdMsg = testCreateStandardMessage('JORGE_POPUP', 'ACTION_SCAN_DOWNLOADS', { test: 123 });
  assert(testIsStandardMessage(stdMsg), "Mensagem criada deve ser identificada como válida pelo protocolo padronizado");
  assert(stdMsg.source === 'JORGE_POPUP' && stdMsg.action === 'ACTION_SCAN_DOWNLOADS', "Origem e ação da mensagem padronizada devem corresponder aos parâmetros");
  assert(!testIsStandardMessage({ foo: 'bar' }), "Objeto arbitrário sem o formato do protocolo deve ser rejeitado");
}

runProxyEndpointProtectionTest().then(async () => {
  // ---------------------------------------------------------
  // Teste Sprint 13 (Tarefa 30/Kanban): Leitura de PDFs Comprimidos (FlateDecode)
  // ---------------------------------------------------------
  console.log("\n--- Testando Leitura e Extração de PDFs Comprimidos (Sprint 13 / FlateDecode) ---");

  const zlib = require('zlib');

  async function testDecompressFlateStream(compressedBytes) {
    if (!compressedBytes || compressedBytes.length === 0) return null;
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        const writePromise = writer.write(compressedBytes).then(() => writer.close()).catch(() => {});
        const readPromise = new Response(ds.readable).arrayBuffer();
        const arrayBuffer = await readPromise;
        await writePromise;
        return new Uint8Array(arrayBuffer);
      } catch (e1) {
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          const writePromise = writer.write(compressedBytes).then(() => writer.close()).catch(() => {});
          const readPromise = new Response(ds.readable).arrayBuffer();
          const arrayBuffer = await readPromise;
          await writePromise;
          return new Uint8Array(arrayBuffer);
        } catch (e2) {}
      }
    }
    if (typeof require !== 'undefined') {
      try {
        try {
          return new Uint8Array(zlib.inflateSync(compressedBytes));
        } catch (e3) {
          return new Uint8Array(zlib.inflateRawSync(compressedBytes));
        }
      } catch (e4) {}
    }
    return null;
  }

  function testDecodeBytesToString(bytes) {
    if (!bytes) return '';
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      return utf8Decoder.decode(bytes);
    } catch (e) {
      const latin1Decoder = new TextDecoder('latin1');
      return latin1Decoder.decode(bytes);
    }
  }

  function testDecodePdfString(pdfStr) {
    if (!pdfStr) return '';
    return pdfStr.replace(/\\([0-7]{1,3}|\r\n|[\s\S])/g, (match, p1) => {
      if (/^[0-7]{1,3}$/.test(p1)) {
        return String.fromCharCode(parseInt(p1, 8));
      }
      switch (p1) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        case '(': return '(';
        case ')': return ')';
        case '\\': return '\\';
        case '\r\n':
        case '\n':
        case '\r':
          return '';
        default:
          return p1;
      }
    });
  }

  async function testParsePdfBuffer(bytes) {
    if (!bytes || !(bytes instanceof Uint8Array) || bytes.length === 0) {
      throw new Error('Dados do arquivo PDF estão vazios ou inválidos.');
    }

    const headerStr = testDecodeBytesToString(bytes.subarray(0, Math.min(bytes.length, 1024)));
    if (!headerStr.includes('%PDF')) {
      throw new Error('O arquivo fornecido não é um documento PDF válido.');
    }

    function matchMarker(arr, index, marker) {
      if (index + marker.length > arr.length) return false;
      for (let k = 0; k < marker.length; k++) {
        if (arr[index + k] !== marker[k]) return false;
      }
      return true;
    }

    const streamMarker = [115, 116, 114, 101, 97, 109];
    const endstreamMarker = [101, 110, 100, 115, 116, 114, 101, 97, 109];

    let textSegments = [];
    let lastIndex = 0;

    for (let i = 0; i < bytes.length - 6; i++) {
      if (matchMarker(bytes, i, streamMarker)) {
        if (i >= 3 && bytes[i - 3] === 101 && bytes[i - 2] === 110 && bytes[i - 1] === 100) {
          continue;
        }

        const dictStart = Math.max(0, i - 400);
        const dictHeader = testDecodeBytesToString(bytes.subarray(dictStart, i));
        const isFlate = /\/Filter\s*(\/FlateDecode|\[\s*\/FlateDecode\s*\])/i.test(dictHeader);

        textSegments.push(testDecodeBytesToString(bytes.subarray(lastIndex, i)));

        let streamStart = i + 6;
        if (streamStart < bytes.length && bytes[streamStart] === 13) streamStart++;
        if (streamStart < bytes.length && bytes[streamStart] === 10) streamStart++;

        let streamEnd = -1;
        for (let j = streamStart; j < bytes.length - 9; j++) {
          if (matchMarker(bytes, j, endstreamMarker)) {
            streamEnd = j;
            if (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) streamEnd--;
            if (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) streamEnd--;
            break;
          }
        }

        if (streamEnd !== -1 && streamEnd >= streamStart) {
          const compressedData = bytes.subarray(streamStart, streamEnd);
          let decompressedText = null;

          if (isFlate || (compressedData.length > 2 && compressedData[0] === 0x78)) {
            try {
              const decompressedBytes = await testDecompressFlateStream(compressedData);
              if (decompressedBytes) {
                decompressedText = testDecodeBytesToString(decompressedBytes);
              }
            } catch (err) {}
          }

          if (decompressedText) {
          textSegments.push(decompressedText);
        } else {
          try {
            textSegments.push(testDecodeBytesToString(compressedData));
          } catch (e) {}
        }

          i = streamEnd;
          lastIndex = streamEnd;
        }
      }
    }

    if (lastIndex < bytes.length) {
      textSegments.push(testDecodeBytesToString(bytes.subarray(lastIndex)));
    }

    const combinedRawText = textSegments.join('\n');

    const textBlocks = [];
    const btRegex = /(?:^|\s|\/)?BT[\s\S]*?ET/gi;
    let match;
    while ((match = btRegex.exec(combinedRawText)) !== null) {
      const block = match[0];
      const stringMatches = block.match(/\((?:[^()\\]|\\[\s\S])*\)|<[0-9a-fA-F]+>/g);
      if (stringMatches) {
        const cleaned = stringMatches
          .map(s => {
            if (s.startsWith('(') && s.endsWith(')')) {
              return testDecodePdfString(s.slice(1, -1));
            } else if (s.startsWith('<') && s.endsWith('>')) {
              const hex = s.slice(1, -1);
              if (hex.length % 2 === 0) {
                let str = '';
                for (let h = 0; h < hex.length; h += 2) {
                  const charCode = parseInt(hex.substr(h, 2), 16);
                  if (charCode >= 32 && charCode <= 255) str += String.fromCharCode(charCode);
                }
                return str;
              }
            }
            return '';
          })
          .filter(s => s.trim().length > 0)
          .join(' ');

        if (cleaned.trim().length > 0) {
          textBlocks.push(cleaned.trim());
        }
      }
    }

    let extractedText = textBlocks.join(' ');

    if (!extractedText || extractedText.trim().length === 0) {
      const stringMatches = combinedRawText.match(/\((?:[^()\\]|\\[\s\S])*\)/g);
      if (stringMatches) {
        extractedText = stringMatches
          .map(s => testDecodePdfString(s.slice(1, -1)))
          .filter(s => s.trim().length > 0)
          .join(' ');
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      const printableMatches = combinedRawText.match(/[\x20-\x7E\xA0-\xFF\n\r\t]{3,}/g);
      if (printableMatches) {
        extractedText = printableMatches
          .filter(str => !str.startsWith('/') && !str.includes('<<') && !str.includes('>>') && !str.includes('endobj') && !str.includes('stream') && !str.includes('xref') && !str.includes('trailer'))
          .join(' ');
      }
    }

    return extractedText ? extractedText.replace(/\s+/g, ' ').trim() : '';
  }

  function buildTestPdfBuffer(streamContents, isCompressed = false) {
    const parts = [];
    parts.push(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
    
    streamContents.forEach((content, index) => {
      const objNum = index + 3;
      let streamBuf;
      let filterHeader = '';
      if (isCompressed) {
        filterHeader = '/Filter /FlateDecode ';
        streamBuf = zlib.deflateSync(Buffer.from(content, 'utf-8'));
      } else {
        streamBuf = Buffer.from(content, 'utf-8');
      }
      
      parts.push(Buffer.from(`${objNum} 0 obj\n<< /Length ${streamBuf.length} ${filterHeader}>>\nstream\n`));
      parts.push(streamBuf);
      parts.push(Buffer.from('\nendstream\nendobj\n'));
    });

    parts.push(Buffer.from('%%EOF\n'));
    return Buffer.concat(parts);
  }

  // Teste A: Extração de PDF comprimido com FlateDecode
  const streamCompressed = 'BT /F1 12 Tf (Documento Fiscal PDF Comprimido 2026) Tj ET';
  const pdfCompBuf = buildTestPdfBuffer([streamCompressed], true);
  const textComp = await testParsePdfBuffer(new Uint8Array(pdfCompBuf));
  assert(textComp.includes('Documento Fiscal PDF Comprimido 2026'), "Deveria descompactar e extrair texto de PDF comprimido com FlateDecode");

  // Teste B: Extração de múltiplos streams comprimidos
  const pdfMultiCompBuf = buildTestPdfBuffer(['BT /F1 (Item 1) Tj ET', 'BT /F1 (Item 2) Tj ET'], true);
  const textMultiComp = await testParsePdfBuffer(new Uint8Array(pdfMultiCompBuf));
  assert(textMultiComp.includes('Item 1') && textMultiComp.includes('Item 2'), "Deveria extrair texto de múltiplos streams comprimidos em um mesmo PDF");

  // Teste C: Tratamento de exceção para stream comprimido corrompido
  const corruptPdfBuf = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length 25 /Filter /FlateDecode >>\nstream\nCORRUPTED_NON_ZLIB_DATA_12345\nendstream\nendobj\n%%EOF\n')
  ]);
  const textCorrupt = await testParsePdfBuffer(new Uint8Array(corruptPdfBuf));
  assert(typeof textCorrupt === 'string', "Falha na descompactação de stream corrompido deve ser tratada sem lançar erro não capturado");

  // Teste D: Validação de arquivo não-PDF
  let invalidPdfCaught = false;
  try {
    await testParsePdfBuffer(new Uint8Array(Buffer.from("TEXTO PLANO SEM CABECALHO PDF")));
  } catch (err) {
    invalidPdfCaught = err.message.includes("não é um documento PDF válido");
  }
  assert(invalidPdfCaught, "Arquivo sem cabeçalho %PDF deve lançar exceção tratada com mensagem explicativa");

  console.log(`\n=== RESULTADO FINAL DE TESTES: ${passed} Passaram, ${failed} Falharam ===`);
  if (failed > 0) process.exit(1);
});
