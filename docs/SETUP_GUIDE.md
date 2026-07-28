# 🛠️ Guia de Setup e Replicação: Assistente do Jorge

Este guia prático fornece o passo a passo detalhado para duplicar ou replicar o projeto **Assistente do Jorge** do zero em qualquer ambiente ou conta Google Workspace.

---

## 📋 Pré-requisitos

1. Uma conta Google com acesso ao **Google Cloud Console**.
2. Uma conta no **GitHub** (para hospedagem do repositório de skills em Markdown).
3. Navegador **Google Chrome** (versão 114+ com suporte a Manifest V3 Side Panel).

---

## 🚀 Passo a Passo de Replicação

### Passo 1: Configurar a Planilha de Controle no Google Sheets
1. Crie uma nova Planilha Google nomeada `Assistente do Jorge - Controle de Acesso`.
2. Renomeie a primeira aba para **`Usuarios`**.
3. Adicione o cabeçalho exato na Linha 1:
   - `A1`: `E-mail`
   - `B1`: `Nome`
   - `C1`: `Status` (`ATIVO` ou `INATIVO`)
   - `D1`: `Skills Permitidas` (`ALL` ou lista separada por vírgulas, ex: `juridico, seo`)
   - `E1`: `Observações`
4. Insira seu e-mail do Google com Status `ATIVO` e Skills Permitidas `ALL`.
5. Copie o **Spreadsheet ID** da URL:
   `https://docs.google.com/spreadsheets/d/`**`{SEU_SPREADSHEET_ID}`**`/edit`

---

### Passo 2: Criar o Repositório de Skills no GitHub
1. Crie um repositório no GitHub chamado `assistente-jorge-skills`.
2. Crie uma pasta chamada **`skills/`** no repositório.
3. Adicione arquivos Markdown iniciais na pasta `skills/`:
   - `skills/geral.md`
   - `skills/juridico.md`
   - `skills/codigo.md`
   - `skills/seo.md`
4. Anote a URL da API do GitHub para listar o conteúdo:
   `https://api.github.com/repos/{dono}/assistente-jorge-skills/contents/skills`

---

### Passo 3: Configurar o Google Cloud Console & OAuth 2.0
1. Acesse o [Google Cloud Console](https://console.cloud.google.com) e crie um novo Projeto.
2. Vá em **APIs e Serviços > Biblioteca**, pesquise por **Google Sheets API** e clique em **Ativar**.
3. Vá em **APIs e Serviços > Tela de Permissão OAuth**:
   - Tipo: **Externo** (ou Interno para Workspace).
   - Preencha Nome (`Assistente do Jorge`) e e-mail de contato.
   - Adicione o Escopo: `https://www.googleapis.com/auth/spreadsheets.readonly`.
4. Vá em **APIs e Serviços > Credenciais > Criar Credenciais > ID do Cliente OAuth**:
   - Tipo: **Extensão do Chrome**.
   - ID da Extensão: Obtenha o ID de 32 letras em `chrome://extensions` ao carregar a pasta não compactada.
5. Copie o **Client ID** gerado (ex: `1234567890-xyz.apps.googleusercontent.com`).

---

### Passo 4: Atualizar Arquivos do Projeto
1. No arquivo `manifest.json`:
   - Insira o Client ID gerado no campo `"oauth2": { "client_id": "SEU_CLIENT_ID" }`.
2. No arquivo `sidepanel.js`:
   - Insira o `SPREADSHEET_ID` da sua planilha.
   - Insira a URL do seu repositório de skills do GitHub.
