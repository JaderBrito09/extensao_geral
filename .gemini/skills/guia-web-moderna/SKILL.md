---
name: guia-web-moderna
description: Guia de busca e auditoria de boas práticas para desenvolvimento web moderno (HTML, CSS e JavaScript client-side). Utilizar obrigatoriamente antes de criar novos componentes ou implementar recursos de interface na extensão.
---

# Guia de Desenvolvimento Web Moderno — Assistente do Jorge

Esta skill fornece um catálogo e guia de boas práticas para o desenvolvimento do frontend da extensão **Assistente do Jorge** (Side Panel, Popup e injeções no DOM).

## 🎯 Quando Utilizar

Esta skill deve ser consultada ao:
- Criar ou refatorar componentes da interface do painel lateral (`sidepanel.html`, `sidepanel.css`, `sidepanel.js`).
- Implementar novas animações, efeitos de carregamento (spinners/skeletons) ou componentes visuais.
- Otimizar o desempenho de renderização das mensagens de chat formatadas em Markdown e tabelas.
- Evitar a adição de bibliotecas pesadas de terceiros quando APIs nativas do navegador já resolvem o problema.

---

## 📐 Diretrizes Técnicas para o Projeto

### 1. Estilização e CSS Nativo (Vanilla CSS)
- **Design System com Variáveis CSS (Tokens)**: Centralizar cores, fontes, espaçamentos e sombras em `:root` no arquivo `sidepanel.css`.
- **Efeitos de Interface (Glassmorphism & Modos)**: Utilizar `backdrop-filter`, `blur()` e transições de cor suaves.
- **Scroll e Estouro de Conteúdo**: Aplicar `overflow-y: auto` estilizado com scrollbars modernas e finas no container do chat `#chatContainer`.

### 2. Manipulação do DOM e Performance
- **Evitar Reflows Excessivos**: Quando a IA responder via streaming ou blocos de texto, utilize `DocumentFragment` ou atualizações em lote via `requestAnimationFrame`.
- **Sanitização de HTML**: Todo HTML gerado a partir do Markdown da IA DEVE passar obrigatoriamente pelo `DOMPurify.sanitize()` antes de ser inserido no DOM via `innerHTML` ([`lib/purify.min.js`](file:///Users/jader/Meu%20Drive/extensao_geral/lib/purify.min.js)).

### 3. Componentes e Formulários Nativos
- Utilizar elementos semânticos (`<main>`, `<section>`, `<article>`, `<header>`, `<nav>`).
- Utilizar validação nativa de formulários (`:user-valid`, `:user-invalid`) para feedbacks visuais imediatos na caixa de mensagem.

---

## 🛠️ Comando de Busca no CLI (Opcional via `npx`)

Para buscar guias detalhados de padrões modernos diretamente no repositório npm:

```sh
npx -y modern-web-guidance@latest search "<termo-de-busca>"
```
