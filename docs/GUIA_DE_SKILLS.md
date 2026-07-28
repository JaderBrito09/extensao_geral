# 💡 Guia de Especificação e Desenvolvimento de Habilidades (Skills)

Este guia orienta especialistas de domínio e desenvolvedores sobre como criar, estruturar, publicar e atualizar **Habilidades (Skills)** para o **Assistente do Jorge**.

---

## 🏗️ Estrutura do Repositório Exclusivo de Skills (`assistente-jorge-skills`)

Todas as habilidades especialistas residem no repositório exclusivo do GitHub **`JaderBrito09/assistente-jorge-skills`**.

```
assistente-jorge-skills/
├── skills.json             ⚙️ Catálogo Oficial de Habilidades
└── skills/                 📁 Arquivos Markdown de Habilidades
    ├── geral.md            💡 Análise e Consulta Livre
    ├── juridico.md         ⚖️ Análise Contratual e Riscos Legais
    ├── codigo.md           💻 Auditoria de Código e Arquitetura
    ├── seo.md              🚀 Análise de SEO e Conteúdo
    └── traducao.md         🌐 Tradução e Adaptação Cultural
```

---

## 📜 Formato do Manifesto Catálogo (`skills.json`)

O arquivo `skills.json` registra os metadados de cada habilidade disponível:

```json
{
  "version": "1.0",
  "description": "Catálogo Oficial de Habilidades do Assistente do Jorge",
  "skills": [
    {
      "id": "SKILL-GERAL-001",
      "slug": "geral",
      "name": "Análise e Consulta Livre (Geral)",
      "category": "Geral",
      "file": "skills/geral.md"
    },
    {
      "id": "SKILL-JURIDICO-001",
      "slug": "juridico",
      "name": "Revisão de Termos e Riscos (Jurídico)",
      "category": "Jurídico",
      "file": "skills/juridico.md"
    }
  ]
}
```

---

## 📝 Especificação do Arquivo Markdown (`.md`)

Cada habilidade deve conter exatamente as 3 seções obrigatórias estruturadas abaixo:

### Exemplo Completo ([skills/geral.md](file:///Users/jader/Meu%20Drive/extensao_geral/skills-repo/skills/geral.md)):

```markdown
# Skill: Análise e Consulta Livre (Geral)
**Categoria**: Geral
**Descrição**: Consulta livre permitindo à IA responder com base na página ativa, arquivos anexados e sua base de conhecimento prévia.

## Orientação Inicial ao Usuário
💡 **Consulta Livre:** Você pode fazer perguntas sobre a página ativa, anexar arquivos ou solicitar análises gerais. Se a informação não estiver na página ou nos arquivos anexados, a IA utilizará sua própria base de conhecimento para responder livremente.

## System Prompt
Atue como um Assistente Analítico Inteligente e Consultor Geral.
Sua função é auxiliar o usuário analisando o conteúdo da página web ativa e quaisquer arquivos e mídias anexados pelo usuário.

AUTORIZAÇÃO DE ESCOPO E BUSCA EXTERNA:
1. Priorize as informações contidas na página ativa e nos arquivos anexados pelo usuário.
2. Caso a resposta para a dúvida do usuário NÃO constar na página ativa ou nos anexos, ou caso nenhum documento tenha sido fornecido, você tem AUTORIZAÇÃO EXPLÍCITA para responder utilizando sua própria base de conhecimento prévia e geral de forma direta e fluida.
3. Mantenha um tom profissional, claro, objetivo e estruturado em Markdown.
```

---

## ⚙️ Como Funciona o Parser na Extensão

Quando o usuário seleciona uma habilidade no dropdown:
1. **Nome na Interface**: O parser extrai a linha `# Skill: <Nome>` para o rótulo do menu `<select>`.
2. **Orientação no Chat**: O parser extrai a seção `## Orientação Inicial ao Usuário` e exibe imediatamente no chat para orientar o usuário sobre quais documentos/dados fornecer.
3. **System Prompt em Segundo Plano**: O parser extrai a seção `## System Prompt` e a transmite no campo `systemInstruction` em segundo plano para o Gemini 2.5 Flash.

---

## 🔄 Como Adicionar uma Nova Habilidade

1. Crie o novo arquivo Markdown em `skills/{nome_habilidade}.md`.
2. Adicione a entrada no arquivo `skills.json` com um `id` imutável (ex: `SKILL-FINANCEIRO-001`).
3. Faça commit e push para o repositório `assistente-jorge-skills` no GitHub.
4. A nova habilidade ficará automaticamente disponível para todos os usuários autorizados!
