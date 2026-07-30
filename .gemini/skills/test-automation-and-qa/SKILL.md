---
name: test-automation-and-qa
description: Orienta e executa a suíte de testes de regressão automatizados (Node.js) do projeto Assistente Jorge. Deve ser acionada antes de commits ou lançamentos de versão.
---

# Automação de Testes e Garantia de Qualidade (QA) — Assistente do Jorge

Esta skill é responsável por executar a suíte de testes automatizados unitários e de integração, garantindo que novas alterações não quebrem a extensão.

---

## 🚀 Fluxo de Execução Automática (Quando acionada)

1. **Executar a Suíte Principais**:
   ```bash
   node tests/test.js
   ```
2. **Validar Resultados**:
   - Verificar se todas as suítes (Sanitização XSS, Renderização Markdown, Extração de DOM, Prompts Estritos e Gestão de Anexos) passaram com 100% de sucesso.
   - Se algum teste falhar: **Interromper imediatamente o processo de commit ou lançamento de versão** e exibir a falha.

---

## 🧪 Cobertura Atual de Testes

- **Sanitização XSS**: Remoção de tags `<script>` e links maliciosos `javascript:`.
- **Markdown**: Parser correto de formatações em negrito, listas e código.
- **Extração de DOM**: Isolamento de conteúdo em `<main>` e `<article>`, ignorando elementos de navegação e scripts.
- **Prompts Estritos**: Presença do prompt obrigatório `STRICT_DOCUMENT_SCOPE_PROMPT`.
- **Gestão de Anexos & Sessões**: Validação das estruturas de dados de histórico local e mídias.
