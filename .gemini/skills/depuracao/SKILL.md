---
name: a11y-debugging
description: Utiliza o Chrome DevTools MCP para depuração e auditoria de acessibilidade (a11y) com base nas diretrizes do web.dev e nos componentes da extensão Assistente do Jorge (sidepanel, popup e mensagens em Markdown).
---

# Depuração de Acessibilidade (a11y) — Assistente do Jorge

Esta skill orienta a auditoria e correção de acessibilidade na interface do **Assistente do Jorge** (Side Panel, Popup e mensagens de chat em Markdown) e nas páginas analisadas pela extensão.

## 🎯 Conceitos Chave

- **Árvore de Acessibilidade vs DOM**: Ocultar um elemento apenas visualmente (`opacity: 0`) se comporta de forma diferente para leitores de tela do que `display: none` ou `aria-hidden="true"`. O snapshot de acessibilidade retorna o que as tecnologias assistivas realmente "enxergam".
- **Acessibilidade no Side Panel**: O painel lateral (`sidepanel.html`) precisa ter contraste adequado, áreas de toque claras para botões (`#sendBtn`, `#loginBtn`, `#newChatBtn`), navegabilidade por teclado e leitores de tela compatíveis.
- **Mensagens Formatadas em Markdown**: As respostas da IA renderizadas na janela de chat devem utilizar marcações semânticas corretas (`<h1>`-`<h6>`, listas `<ul>`/`<ol>`, blocos de código `<pre><code>` com leitibilidade de contraste).

---

## 🔄 Fluxos de Trabalho de Auditoria

### 1. Auditoria Automatizada (Lighthouse)

Inicie rodando uma auditoria de acessibilidade com o Lighthouse para obter uma linha de base:

1. Executar a auditoria:
   - Defina `mode` como `"navigation"` para recarregar e capturar problemas de carregamento inicial.
   - Defina `outputDirPath` (ex: `/tmp/lh-report`) para salvar o relatório JSON completo.
2. **Analisar o Resumo**:
   - Verifique `scores` (escala de 0 a 1). Pontuações menores que 1 indicam violações.
   - Revise a contagem em `audits.failed`.
3. **Análise do Relatório**:
   - Utilize Node.js para extrair apenas as falhas sem carregar o arquivo inteiro na memória:
     ```bash
     node -e "const r=require('./report.json'); Object.values(r.audits).filter(a=>a.score!==null && a.score<1).forEach(a=>console.log(JSON.stringify({id:a.id, title:a.title, items:a.details?.items})))"
     ```

### 2. Inspeção de Rótulos, Botões e Controles do Chat

No `sidepanel.html` e `popup.html`:
1. **Botões de Ação**: Certifique-se de que botões com ícones (ex: botão de anexo `📎`, botão enviar `⬆`, histórico `🕒`, nova conversa `+`) possuem atributos `aria-label` ou `title` descritivos para leitores de tela.
2. **Seletor de Habilidades (`<select id="skillSelect">`)**: Deve possuir um rótulo `<label>` associado ou `aria-label="Selecione uma habilidade especialista"`.
3. **Campo de Entrada (`<textarea id="userInput">`)**: Deve conter `aria-label` apropriado.

### 3. Navegação por Teclado e Foco Visual

1. Teste a navegação usando a tecla `Tab` e `Shift+Tab` entre os elementos interativos do painel lateral.
2. **Indicadores de Foco**: Garanta que os elementos focados possuam destaque visual claro (`outline` ou `box-shadow` visível).
3. **Fechamento de Modais**: Caso modais ou dropdowns sejam abertos (ex: lista de histórico de chats), o foco deve ser movido para o modal e retornado ao botão disparador quando fechado.

### 4. Contraste de Cores e Temas

1. Verifique se a paleta de cores do tema (modo claro/escuro) atende à taxa de contraste mínima da WCAG (4.5:1 para texto normal, 3:1 para texto grande).
2. Verifique o contraste dos cartões de mensagem (`.user-message`, `.bot-message`) e dos blocos de código formatados pelo `marked.js` e `purify.js`.

---

## 🛠️ Checklist para o Projeto Assistente do Jorge

- [ ] Todos os botões sem texto visível possuem `aria-label` descritivo.
- [ ] O seletor de habilidades é totalmente acessível via teclado.
- [ ] Os links renderizados no chat abrem em nova aba com `target="_blank" rel="noopener noreferrer"`.
- [ ] O contraste do texto do painel lateral em relação ao fundo atende ao padrão WCAG AA.
