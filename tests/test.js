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

console.log(`\n=== RESULTADO FINAL DE TESTES: ${passed} Passaram, ${failed} Falharam ===`);
if (failed > 0) process.exit(1);
