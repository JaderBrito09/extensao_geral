# ✍️ Guia do Construtor de Habilidades (Skills) em Markdown: Assistente do Jorge

Este guia ensina como criar, formatar e publicar novas **Habilidades em arquivos Markdown (`.md`)** no repositório GitHub do Assistente do Jorge.

---

## 📝 O que é uma Habilidade (Skill)?

Uma **Habilidade** é um arquivo de texto formatado em Markdown (`.md`) armazenado no GitHub. Ela define:
1. **Orientação Inicial ao Usuário**: Instrução preliminar exibida no chat no momento da seleção da habilidade (ex: solicitar anexo do contrato original em PDF).
2. **Diretriz do Sistema (*System Prompt*)**: O papel profissional especialista que a IA (Gemini) deve assumir.
3. **Bases de Conhecimento Complementares**: Links para outros arquivos no GitHub (leis, normas, manuais, checklists) que devem ser lidos e injetados como contexto de referência.
4. **Regra de Ouro de Restrição de Escopo**: Obrigação de responder **estritamente com base nos documentos/anexos fornecidos**.

---

## 🛡️ Regra Obrigatória de Restrição de Escopo & Conhecimento Externo

Todas as Habilidades devem obrigatoriamente incluir a seguinte diretriz de restrição no seu *System Prompt*:

> **REGRAS ESTRITAS DE RESPOSTA:**
> 1. Responda **exclusivamente com base no conteúdo da página web ativa, dos arquivos anexados e da base de conhecimento da Habilidade fornecida**.
> 2. **Informação Ausente:** Se a resposta para a dúvida do usuário **NÃO constar** nos documentos/anexos fornecidos:
>    - **NÃO** responda imediatamente usando seu conhecimento geral prévio.
>    - Responda perguntando explicitamente ao usuário:  
>      *"A informação solicitada não consta na documentação nem nos arquivos fornecidos. Deseja que eu busque essa informação fora da documentação fornecida?"*
> 3. **Autorização Concedida:** Se o usuário responder que **SIM** (permitindo a busca fora da documentação):
>    - Forneça a resposta com base em conhecimento geral, mas inclua **obrigatoriamente um destaque/alerta em negrito no início e no fim da resposta**, enfatizando:  
>      > ⚠️ **ATENÇÃO:** Esta resposta foi gerada com base em conhecimento externo e **NÃO CONSTA** na documentação ou arquivos fornecidos nesta análise.

---

## 📄 Estrutura Padrão de um Arquivo de Habilidade (`.md`)

Todo arquivo de Habilidade no repositório GitHub deve seguir a estrutura abaixo:

```markdown
# Skill: [Nome Amigável da Habilidade]
**Categoria**: [Geral / Jurídico / Dev / SEO / Imóveis / Financeiro]
**Descrição**: [Breve resumo da utilidade para exibição]
**Bases de Conhecimento**: [conhecimento/leis_contratos.md, conhecimento/manual_auditoria.md]

## Orientação Inicial ao Usuário
> 💡 **Instrução ao Usuário:** Para realizar a análise comparativa deste contrato lançado na página, por favor clique no botão de anexo (📎) e inclua o arquivo PDF do contrato original.

## System Prompt
Atue como um advogado especialista em Direito Contratual e LGPD. Analise o conteúdo lançado na página web ativa e compare rigorosamente com o contrato em PDF anexado pelo usuário e com a base de legislação em anexo.

### Regras de Restrição ao Conteúdo:
1. Responda exclusivamente com base no conteúdo da página web ativa, dos arquivos anexados e das bases de conhecimento fornecidas.
2. Se a informação não constar nos arquivos ou na página, NÃO a forneça imediatamente. Pergunte ao usuário: "A informação solicitada não consta na documentação fornecida. Deseja que eu busque essa informação fora da documentação fornecida?"
3. Se o usuário responder SIM, forneça a resposta enfatizando em destaque que a informação NÃO consta nos documentos fornecidos.
```

---

## 📚 1. Orientação Inicial Dinâmica ao Usuário

Ao selecionar uma Habilidade no seletor da extensão:
- A extensão lê a seção `## Orientação Inicial ao Usuário` do arquivo no GitHub.
- Exibe essa orientação no chat **antes que o usuário faça qualquer pergunta**, instruindo-o sobre procedimentos preliminares (ex: baixar arquivos da página, anexar o documento PDF de comparação, etc.).

---

## 🏛️ 2. Inclusão de Bases de Conhecimento Complementares (GitHub)

Uma Habilidade pode requerer materiais normativos de apoio. No campo `**Bases de Conhecimento**`, informe o caminho de arquivos Markdown adicionais armazenados no repositório GitHub:
- `conhecimento/lgpd_resumo.md`
- `conhecimento/normas_tecnicas_iso.md`
- `manuais/checklist_compliance.md`

---

## 💡 Exemplo de Habilidade Completa (`skills/auditoria_contratos.md`)

```markdown
# Skill: Auditoria de Contratos de Aluguel
**Categoria**: Jurídico
**Descrição**: Comparação entre dados do contrato preenchidos na página e a cópia original em PDF.
**Bases de Conhecimento**: conhecimento/lei_inquilinato.md

## Orientação Inicial ao Usuário
Para que a auditoria seja precisa, por favor:
1. Verifique se o formulário do contrato está visível na página ativa.
2. Clique no ícone de anexo (📎) e envie o arquivo PDF do contrato original assinado.

## System Prompt
Atue como um auditor jurídico sênior especializado em contratos imobiliários. 
Analise os dados extraídos da página web ativa e compare-os com o arquivo PDF enviado pelo usuário e com a Lei do Inquilinato (`conhecimento/lei_inquilinato.md`).

IMPORTANTE: Responda EXCLUSIVAMENTE com base na página, nos anexos e na legislação fornecida. Se a informação não constar nos documentos, pergunte se o usuário deseja buscar fora da documentação. Caso autorizado (resposta "sim"), forneça a resposta com destaque explícito de que ela NÃO consta na documentação fornecida.
```

---

## 🚀 Como Publicar uma Nova Habilidade no GitHub

1. Acesse a pasta `/skills/` no seu repositório no GitHub.
2. Clique em **Add file > Create new file**.
3. Nomeie o arquivo em letras minúsculas (ex: `auditoria_contratos.md`).
4. Cole o conteúdo com as seções de **Orientação Inicial**, **Bases de Conhecimento** e **System Prompt** (incluindo as regras de restrição de escopo).
5. Faça o **Commit**. A extensão lerá a nova Habilidade e aplicará as regras de resposta restrita automaticamente!
