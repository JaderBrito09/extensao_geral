# 💡 Guia de Especificação e Criação de Habilidades (Skills)

Este guia orienta usuários e especialistas de domínio sobre como **estruturar e propor Habilidades (Skills)** customizadas para o **Assistente do Jorge**.

> 📌 **Contexto e Propósito deste Documento:**  
> Este guia serve como material de referência (base de conhecimento para **NotebookLM**, **Gems** ou consulta direta de usuários) para auxiliar na criação de habilidades para tarefas diárias.  
> 📩 **Fluxo de Submissão:** Após estruturar a nova Skill segundo as especificações deste documento, o criador envia o pacote/arquivos por **e-mail para o Administrador da Extensão**. O administrador realizará a validação técnica/regulamentar e fará a publicação oficial no repositório de Skills.

---

## 🏗️ Estrutura do Repositório Exclusivo de Skills (`assistente-jorge-skills`)

Todas as habilidades residentes no repositório exclusivo do GitHub [**`JaderBrito09/assistente-jorge-skills`**](https://github.com/JaderBrito09/assistente-jorge-skills) seguem uma estrutura modular. Cada **Skill possui sua própria pasta** e pode conter **subpastas auxiliares** acionáveis (bases de conhecimento, templates em formato `.md` ou `.json`):

```text
assistente-jorge-skills/
├── skills.json                   ⚙️ Catálogo Oficial de Habilidades
└── skills/                       📁 Diretório Principal de Habilidades
    ├── geral/                    💡 Pasta Exclusiva da Skill Geral
    │   └── SKILL.md              📜 Instruções Principais e System Prompt
    ├── compliance-exemplo/        🛡️ Pasta Exclusiva de Skill de Compliance/Validação
    │   ├── SKILL.md              📜 Instruções Principais e System Prompt
    │   ├── references/           📚 Base de conhecimento (.md) para a IA
    │   │   ├── diretriz_exemplo.md
    │   │   └── guia_validacao.md
    │   └── templates/            📑 Moldes de relatórios (.md) ou perguntas (.json)
    │       ├── pergunta_template.json
    │       └── relatorio_template.md
    └── codigo/
        └── SKILL.md
```

---

## 📋 Ficha de Cadastro da Habilidade (Metadados da Skill)

Para que a habilidade possa ser integrada à extensão pelo **Administrador**, o criador deve fornecer os metadados básicos de sua Skill. O administrador utilizará estes dados para registrar a Skill na lista global (`skills.json`).

### 📌 Campos que o Criador deve definir:

```json
{
  "id": "SKILL-COMPLIANCE-001",
  "slug": "compliance-exemplo",
  "name": "Validador de Compliance (Exemplo)",
  "category": "Compliance",
  "file": "skills/compliance-exemplo/SKILL.md",
  "references": [
    "skills/compliance-exemplo/references/diretriz_exemplo.md",
    "skills/compliance-exemplo/references/guia_validacao.md"
  ],
  "templates": [
    "skills/compliance-exemplo/templates/relatorio_template.md",
    "skills/compliance-exemplo/templates/pergunta_template.json"
  ]
}
```

#### 🔍 Descrição dos Campos:
* **`id`**: Identificador único da skill (ex: `SKILL-COMPLIANCE-001`).
* **`slug`**: Nome da pasta da skill em letras minúsculas e sem espaços (ex: `compliance-exemplo`).
* **`name`**: Nome de exibição da Skill que aparecerá no menu dropdown da extensão.
* **`category`**: Categoria temática (ex: `Geral`, `Compliance`, `Jurídico`, `Auditoria`, `Finanças`).
* **`file`**: Caminho do arquivo principal (`skills/{slug}/SKILL.md`).
* **`references`** *(opcional)*: Lista com os caminhos dos arquivos `.md` presentes na pasta `references/` que a IA deve ler como base de conhecimento.
* **`templates`** *(opcional)*: Lista com os caminhos dos arquivos `.md` (modelos de relatórios) ou `.json` (gabaritos de perguntas/action cards) na pasta `templates/`.

> 💡 **Nota para o Criador:** Não se preocupe com configurações globais do sistema. Basta enviar a ficha acima preenchida ou com essas informações indicadas no e-mail ao Administrador.

---

## 📝 Especificação da Skill e do Arquivo Markdown (`SKILL.md`)

Cada habilidade é representada por um diretório modular que contém o arquivo principal `SKILL.md` e subpastas de suporte especializadas:

### 📂 Subpastas Auxiliares da Skill:

* **`references/`**: Armazena arquivos `.md` contendo a base de conhecimento, normas, diretrizes e regras fixas que servem como referência contextual para a IA durante a análise.
* **`templates/`**: Armazena arquivos de modelo para estruturação de dados e relatórios:
  * **`.json`**: Templates para geração de perguntas interativas, formulários ou estruturas JSON dinâmicas.
  * **`.md`**: Templates e layouts predefinidos para a formatação final de relatórios e documentos.

---

### 📜 Estrutura Obrigatória do `SKILL.md`:

O arquivo `SKILL.md` deve conter as 3 seções principais a seguir:

1. **Título / Metadados**: Linha inicial com o nome da skill (`# Skill: <Nome>`).
2. **`## Orientação Inicial ao Usuário`**: Texto exibido no chat assim que a skill é selecionada no dropdown.
3. **`## System Prompt`**: Instrução de sistema enviada ao Gemini.

---

### ❓ Perguntas Interativas, Formulários e Action Cards (Uso da Pasta `templates/`)

As habilidades podem conduzir a conversa de forma dinâmica solicitando informações, confirmações ou decisões do usuário por meio de **Action Cards (Botões/Formulários Clicáveis)** no chat.

#### Como integrar Perguntas Interativas no `SKILL.md`:
1. **Templates JSON (`templates/*.json`)**: O criador pode definir o gabarito das perguntas ou a estrutura do formulário em um arquivo `.json` dentro da pasta `templates/`.
2. **Instrução no `System Prompt`**: O `System Prompt` da Skill deve instruir a IA sobre *quando* e *como* acionar esse questionário, ordenando o retorno em um bloco de código ```json do tipo `"interactive_prompt"`.

> 💡 **Exemplo de fluxo:** Se a skill precisar perguntar o tipo de relatório desejado antes de gerá-lo, o `System Prompt` orienta o modelo:  
> *"Antes de gerar a análise, retorne o formulário interativo de escolha do modelo de relatório."*

---

### ⚠️ Regra de Ouro para o `System Prompt`

O motor do Sidepanel consolida e envia as informações para a IA organizadas sob **Tags Semânticas XML**. Todo `System Prompt` desenvolvido para uma Skill deve instruir o modelo a ler obrigatoriamente a partir dessa estrutura:

* `<regras_e_referencias>`: Contém os textos baixados da pasta `references/` vinculada à Skill.
* `<templates_disponiveis>`: Contém os modelos (.json/.md) baixados da pasta `templates/` vinculada à Skill.
* `<conteudo_pagina url="...">`: Contém o texto limpo e extraído do DOM da aba ativa.
* `<documentos_anexados>`: Contém os arquivos carregados via upload pelo usuário.
* `<mensagem_usuario>`: Contém a pergunta ou resposta interativa do usuário.

---

### Exemplo 1: Skill de Consulta Livre (`skills/geral/SKILL.md`)

```markdown
# Skill: Análise e Consulta Livre (Geral)
**Categoria**: Geral
**Descrição**: Consulta livre permitindo à IA responder com base na página ativa, arquivos anexados e sua base de conhecimento prévia.

## Orientação Inicial ao Usuário
💡 **Consulta Livre:** Você pode fazer perguntas sobre a página ativa, anexar arquivos ou solicitar análises gerais. Se a informação não estiver na página ou nos arquivos anexados, a IA utilizará sua própria base de conhecimento para responder livremente.

## System Prompt
Atue como um Assistente Analítico Inteligente e Consultor Geral.

ANÁLISE DE CONTEXTO:
1. Analise o conteúdo fornecido nas tags XML da mensagem (<conteudo_pagina> e <documentos_anexados>).
2. Se a informação solicitada pelo usuário constar nos anexos ou na página web, responda com base neles.
3. Caso a resposta NÃO constar nos anexos ou na página ativa, ou se nenhum documento for fornecido, você tem AUTORIZAÇÃO EXPLÍCITA para responder utilizando sua própria base de conhecimento geral.
4. Mantenha um tom profissional, claro, objetivo e estruturado em Markdown.
```

---

### Exemplo 2: Skill Estrita de Compliance/Validação (`skills/compliance-exemplo/SKILL.md`)

```markdown
# Skill: Validador de Conformidade
**Categoria**: Compliance
**Descrição**: Analisa e valida a página web ativa e os documentos anexados confrontando-os com as diretrizes e regras fixadas nas referências da skill.

## Orientação Inicial ao Usuário
🛡️ **Validador de Conformidade Ativo:** Certifique-se de que a página a ser analisada está aberta na sua aba do Chrome ou que os documentos para auditoria foram anexados. A validação será executada com base nas diretrizes e guias gravados na base de referências.

## System Prompt
Atue como um Validador Especialista de Conformidade e Compliance Regulatória.

DIRETRIZES RÍGIDAS DE ESCOPO E VALIDAÇÃO:
1. Suas regras de validação estão estritamente contidas no bloco <regras_e_referencias>.
2. Você deve confrontar as informações apresentadas no bloco <conteudo_pagina> e/ou <documentos_anexados> contra as regras do bloco <regras_e_referencias>.
3. Ao solicitar opções de prosseguimento ou decisões do usuário, utilize a estrutura JSON presente no bloco <templates_disponiveis>.
4. Ao gerar o relatório final de conformidade, siga rigorosamente a estrutura Markdown contida no bloco <templates_disponiveis>.
5. NÃO utilize conhecimento prévio externo para supor regras não especificadas nas referências. Se um dado necessário para validar o documento ou a página estiver ausente, declare expressamente: "Dado ausente para validação segundo a regra X".
6. Apresente os resultados em formato de tabela de conformidade (Aprovado / Reprovado / Ausente) acompanhada de justificativas objetivas.
```

> ⚡ **Boas Práticas de Desempenho e Janela de Contexto:**  
> Lembre-se de manter os arquivos gravados em `references/` e `templates/` o mais **enxutos e objetivos possível**. Arquivos muito extensos aumentam o tempo de resposta, o consumo de tokens e a carga cognitiva do modelo, podendo prejudicar a precisão da resposta. Priorize textos sumarizados em Markdown.

---

## ⚙️ Como Funciona a Ingestão e o Parser na Extensão

Quando o usuário seleciona uma habilidade no dropdown da extensão:

1. **Nome na Interface**: O parser extrai a linha `# Skill: <Nome>` para o rótulo do menu `<select>`.
2. **Orientação no Chat**: O parser extrai a seção `## Orientação Inicial ao Usuário` e a exibe no chat como mensagem inicial.
3. **Injeção de Referências e Templates**: A extensão verifica se a Skill possui os arrays `references` e/ou `templates` no `skills.json`. Caso positivo, realiza o download simultâneo de todos os arquivos e os armazena temporariamente na memória.
4. **Envio do Payload**: Ao enviar a mensagem, a extensão insere o `System Prompt` no campo `systemInstruction` e monta a mensagem do usuário englobando os blocos XML `<regras_e_referencias>`, `<templates_disponiveis>`, `<conteudo_pagina>`, `<documentos_anexados>` e `<mensagem_usuario>`.

---

## 🔄 Passo a Passo para Criar, Enviar e Publicar uma Nova Habilidade

### 👤 Para o Criador/Usuário:
1. **Crie a pasta da Skill**: `skills/{slug_da_skill}/`.
2. **Crie o arquivo principal**: `SKILL.md` contendo as 3 seções obrigatórias (`# Skill: <Nome>`, `## Orientação Inicial ao Usuário` e `## System Prompt`).
3. **Adicione os recursos auxiliares nas subpastas (se necessário)**:
   - **`references/`**: Arquivos `.md` com bases de conhecimento ou regras.
   - **`templates/`**: Arquivos `.json` (gabaritos/perguntas) ou `.md` (formatos de relatórios).
4. **Preencha a Ficha de Cadastro da Habilidade**: Monte o bloco JSON da Skill (com `id`, `slug`, `name`, `category`, etc.).
5. **Envie a solicitação**: Compacte a pasta da Skill com a Ficha de Cadastro e envie por **e-mail para o Administrador da Extensão** solicitando a inclusão da nova habilidade.

### 🛡️ Para o Administrador da Extensão:
1. **Validação**: Analise as instruções do `SKILL.md` e a conformidade dos documentos em `references/` e `templates/`.
2. **Atualização do Manifesto (`skills.json`)**: Registre os metadados da nova habilidade no arquivo `skills.json` (ID, Slug, Nome, Categoria e lista de `references`/`templates`).
3. **Publicação**: Faça o commit e push para o repositório oficial de Skills. A nova habilidade ficará disponível para todos os usuários da extensão instantaneamente.

---

## 🎛️ Janelas Interativas de Escolha (Action Cards)

As Skills podem solicitar confirmações ou decisões do usuário durante a conversa exibindo **Action Cards (Botões Clicáveis)** no chat do Sidepanel.

### Como solicitar uma Janela Interativa no `System Prompt`:

Instrua o modelo no `System Prompt` a retornar um bloco de código `json` do tipo `"interactive_prompt"` em momentos de tomada de decisão:

```json
{
  "type": "interactive_prompt",
  "title": "Foram encontradas 3 inconsistências na página em relação ao Guia de Validação. Como deseja prosseguir?",
  "options": [
    {
      "label": "📊 Gerar Relatório de Inconformidades",
      "value": "Gerar relatório completo de inconformidades apontando os itens do guia.",
      "badge": "Recomendado"
    },
    {
      "label": "⚡ Mostrar Apenas Inconsistências Críticas",
      "value": "Filtrar e mostrar apenas falhas de gravidade alta."
    }
  ]
}
```

### Propriedades do JSON Interativo:

* **`type`** *(obrigatório)*: Deve ser rigorosamente `"interactive_prompt"`.
* **`title`** *(opcional)*: Pergunta ou instrução exibida no topo do card.
* **`options`** *(obrigatório)*: Array de opções (botões):
  * **`label`** *(obrigatório)*: Texto exibido no botão.
  * **`value`** *(opcional)*: Texto enviado automaticamente como resposta do usuário ao clicar.
  * **`badge`** *(opcional)*: Destaque visual (ex: `"Recomendado"`, `"Crítico"`, `"Novo"`).
  * **`action`** *(opcional)*: Use `"upload_file"` (ou `"attach_file"`) para que o clique no botão abra diretamente a janela nativa do sistema operacional para seleção/upload de arquivos.
  * **`accept`** *(opcional)*: Filtro de extensões de arquivo ao acionar `"upload_file"` (ex: `".pdf,.docx,.txt"`).

#### Exemplo de Janela Interativa solicitando inclusão de documento:

```json
{
  "type": "interactive_prompt",
  "title": "Para prosseguir com a validação, é necessário incluir a minuta do edital em PDF ou DOCX.",
  "options": [
    {
      "label": "📎 Selecionar e Anexar Documento",
      "action": "upload_file",
      "accept": ".pdf,.docx,.txt",
      "badge": "Upload Direct"
    },
    {
      "label": "⏩ Prosseguir sem documento",
      "value": "Prosseguir com a análise considerando apenas o texto extraído da página web."
    }
  ]
}
```

