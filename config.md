# 🛠️ Passo a Passo: Configuração do Projeto no Google Cloud Console & Carregamento no Chrome

Este guia detalha a criação e configuração do projeto no **Google Cloud Console** e o carregamento da extensão no **Google Chrome** para habilitar a autenticação **OAuth 2.0** (**Sprint 5**).

---

## 📌 Resumo dos Requisitos
Para conectar o Chrome Extension via `chrome.identity.getAuthToken`, precisamos de:
1. Um **Projeto** no Google Cloud Console (`ext-geral-oauth-2026`).
2. A **Tela de permissão OAuth (OAuth Consent Screen)** configurada.
3. A extensão **carregada em modo desenvolvedor** no Chrome para obter o **Extension ID**.
4. Um **ID do Cliente OAuth 2.0 (OAuth Client ID)** do tipo *Extensão do Chrome*.
5. O bloco `oauth2` atualizado no `manifest.json`.

---

## 🚀 Passo 1: Criar o Projeto no Google Cloud Console

> **Status**: `[x] Concluído via CLI`
> - **Nome do Projeto**: `Extensao Geral OAuth`
> - **ID do Projeto (PROJECT_ID)**: `ext-geral-oauth-2026`
> - **Número do Projeto**: `1030154870179`

Se precisar criar manualmente via interface:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No menu superior de projetos, clique em **Novo Projeto (New Project)**.
3. Nomeie o projeto (ex: `Extensao Geral OAuth`) e clique em **Criar**.

---

## 🎨 Passo 2: Configurar a Tela de Permissão OAuth (OAuth Consent Screen)

1. No console, acesse a **Tela de permissão OAuth**: **[Google Cloud Console — ext-geral-oauth-2026](https://console.cloud.google.com/auth/overview?project=ext-geral-oauth-2026)**.
2. Na aba **Branding**:
   - **Nome do aplicativo**: `Assistente do Jorge`.
   - **E-mail de suporte**: Seu e-mail de administrador.
   - **Dados de contato do desenvolvedor**: Seu e-mail.
   - Clique em **Salvar**.
3. Na aba **Acesso a dados (Data Access)** (onde ficam os escopos):
   - Clique em **Adicionar ou remover escopos (Add or remove scopes)**.
   - Marque os escopos não sensíveis de perfil:
     - `.../auth/userinfo.email` *(verificar e-mail)*
     - `.../auth/userinfo.profile` *(foto e nome do usuário)*
     - `openid`
   - Clique em **Atualizar** / **Salvar**.
4. Na aba **Público-alvo (Audience)** *(se estiver como 'Em teste')*:
   - Clique em **+ Adicionar usuários (+ Add users)**.
   - Insira seu e-mail (`jaderbrito.fernandes@sefaz.mt.gov.br`) e outros e-mails autorizados para teste.
   - Clique em **Salvar**.

---

## 🧩 Passo 3: Carregar a Extensão no Chrome e Obter o Extension ID

Antes de criar a credencial OAuth Client ID no Google Cloud Console, você precisa registrar a extensão localmente no Chrome para obter seu **Extension ID**.

1. Abra o Google Chrome.
2. Digite na barra de endereços: `chrome://extensions/` e pressione **Enter**.
3. No canto superior direito, **ative a chave "Modo do desenvolvedor" (Developer mode)**.
4. No canto superior esquerdo, clique no botão **Carregar sem compactação (Load unpacked)**.
5. Selecione a pasta raiz do projeto no seu computador:
   ` /Users/jader/Meu Drive/extensao_geral `
6. A extensão será carregada no Chrome.
7. Localize o card da extensão ("Assistente Geral" ou similar) e **copie o valor do campo ID**:
   - Exemplo de ID: `abcdefghijklmnopqrstuvwxyz123456`

---

## 🆔 Passo 4: Criar o ID do Cliente OAuth 2.0 (OAuth Client ID)

1. No Google Cloud Console, acesse: **[APIs e Serviços > Credenciais](https://console.cloud.google.com/apis/credentials?project=ext-geral-oauth-2026)**.
2. Clique em **+ Criar credenciais (+ Create Credentials)** no topo e selecione **ID do cliente OAuth (OAuth client ID)**.
3. No campo **Tipo de aplicativo (Application type)**, selecione **Extensão do Chrome (Chrome Extension)**.
4. Preencha os campos:
   - **Nome**: Ex: `Cliente OAuth Extensao Chrome`.
   - **ID do item (Item ID)**: Cole o **Extension ID** copiado no **Passo 3** (ex: `abcdefghijklmnopqrstuvwxyz123456`).
5. Clique em **Criar (Create)**.
6. Copie o **ID do cliente (Client ID)** gerado (ele terá um formato similar a `XXXXX-YYYYY.apps.googleusercontent.com`).

---

## 📝 Passo 5: Atualizar o `manifest.json` da Extensão

Abra o arquivo `manifest.json` da extensão e insira/atualize o bloco `oauth2` com o **Client ID** gerado no Passo 4:

```json
{
  "permissions": [
    "identity",
    "storage",
    "sidePanel",
    "tabs",
    "scripting",
    "downloads"
  ],
  "oauth2": {
    "client_id": "COLE_AQUI_SEU_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

---

## 🔒 Passo 6: Fixar o Extension ID via Chave Pública (Recomendado)

Para evitar que o **Extension ID** mude caso você reinstale a extensão em modo desenvolvedor:

1. Abra o terminal e empacote a chave da extensão ou gere uma chave privada de 2048-bit com OpenSSL:
   ```bash
   openssl genrsa 2048 | openssl rsa -pubout -outform DER | openssl base64 -A
   ```
2. Adicione a chave base64 resultante no campo `"key"` na raiz do `manifest.json`:
   ```json
   {
     "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQE...",
     "manifest_version": 3,
     "name": "Assistente Geral"
   }
   ```

---

## 🔐 Onde Armazenar as Informações Gerais e Credenciais do Projeto

Para guardar com segurança informações do projeto (como Nome do Projeto no GCP, ID do Projeto, Client ID OAuth, arquivos `.json` baixados do Cloud Console e ID da Extensão):

### 1. 📂 No Repositório: Arquivo `env.json` ou `config.env.json` (Protegido pelo `.gitignore`)
Você pode criar um arquivo de configurações locais chamado `env.json` na raiz do projeto para consultar essas referências de desenvolvimento.

**Exemplo de `env.json`:**
```json
{
  "GCP_PROJECT_NAME": "Extensao Geral OAuth",
  "GCP_PROJECT_ID": "ext-geral-oauth-2026",
  "OAUTH_CLIENT_ID": "COLE_AQUI.apps.googleusercontent.com",
  "CHROME_EXTENSION_ID": "abcdefghijklmnopqrstuvwxyz123456",
  "APPS_SCRIPT_ENDPOINT": "https://script.google.com/macros/s/..."
}
```

> ⚠️ **IMPORTANTE**: Esse arquivo `env.json` e os arquivos JSON de credenciais baixados do GCP (ex: `client_secret_*.json`) **JAMAS devem ir para o GitHub**. Adicione no `.gitignore`:
> ```ini
> env.json
> *.json.credentials
> client_secret_*.json
> *.pem
> ```

### 2. 📄 Na Documentação do Projeto: Arquivo `config.md` (Para Metadados Públicos)
Informações **não sensíveis** (como o ID do Projeto no GCP `ext-geral-oauth-2026` e o ID da Extensão `chrome://extensions/`) podem ficar registradas diretamente na tabela de parâmetros do [`config.md`](file:///Users/jader/Meu%20Drive/extensao_geral/config.md).

---

## 📋 Tabela de Registro de Parâmetros do Projeto

Preencha os valores abaixo para referência da equipe de desenvolvimento:

| Parâmetro | Valor Registrado | Descrição |
| :--- | :--- | :--- |
| **Nome do Projeto GCP** | `Extensao Geral OAuth` | Nome exibido no Google Cloud Console |
| **ID do Projeto GCP (PROJECT_ID)** | `ext-geral-oauth-2026` | Identificador único do projeto GCP |
| **Número do Projeto GCP** | `1030154870179` | Número de identificação numérica do GCP |
| **Conta GCP Administradora** | `jaderbrito.fernandes@sefaz.mt.gov.br` | Conta proprietária do projeto GCP |
| **ID da Extensão no Chrome** | `iobhoockjdkooadefbhlolggdlikdoke` | ID alfanumérico em `chrome://extensions/` |
| **OAuth Client ID** | `1030154870179-60e6j1amgkpn2apsj5i0nf6lurs58k54.apps.googleusercontent.com` | ID da credencial para o `manifest.json` |
| **Endpoint do Apps Script Proxy** | `https://script.google.com/macros/s/AKfycbyLfAPyTaKvoSgl7W-OdXrfKRm1rofmRGs_ZD15RzMf1GrvTQAR6DiZrFD6SiZ8HSV4/exec` | URL pública do Web App no Google Apps Script |

---

## ⚙️ Passo 8: Criar e Configurar o Google Apps Script Proxy Gateway (Sprint 6)

O **Google Apps Script** atua como um Proxy serverless gratuito que esconde a `GEMINI_API_KEY` do navegador do cliente e valida se o e-mail do usuário autenticado tem permissão na planilha.

### 1. Criar o Projeto no Google Apps Script
1. Acesse o [Google Apps Script](https://script.google.com/).
2. Clique em **+ Novo projeto (+ New project)**.
3. Altere o título do projeto no topo para `Assistente-Jorge-Proxy`.

### 2. Inserir o Código `Code.gs`
1. Apague todo o conteúdo padrão da função no editor.
2. Abra o arquivo [`apps-script/Code.gs`](file:///Users/jader/Meu%20Drive/extensao_geral/apps-script/Code.gs) do seu repositório.
3. Copie todo o código e cole no editor do Apps Script.
4. Clique no ícone de **Salvar 💾** (`Cmd + S` ou `Ctrl + S`).

### 3. Salvar a `GEMINI_API_KEY` com Segurança
1. No menu lateral esquerdo do Apps Script, clique em ⚙️ **Configurações do projeto**.
2. Role até **Propriedades do script (Script Properties)**.
3. Clique em **Adicionar propriedade do script**.
   - **Propriedade**: `GEMINI_API_KEY`
   - **Valor**: *(Cole sua chave de API do Google AI Studio - ex: `AIzaSy...`)*
4. Clique em **Salvar propriedades do script**.

### 4. Fazer o Deploy como Web App
1. No canto superior direito, clique no botão azul **Implantar (Deploy)** > **Nova implantação (New deployment)**.
2. Em ⚙️ *Selecione o tipo*, escolha **App da Web (Web App)**.
3. Configure os privilégios:
   - **Descrição**: `V1 - Gateway Proxy`
   - **Executar como**: **`Eu`** (Sua conta Google)
   - **Quem tem acesso**: **`Qualquer pessoa (Anyone)`**
4. Clique em **Implantar (Deploy)** e conceda as permissões de acesso solicitadas.
5. Copie a **URL do app da Web (Web app URL)** gerada (exemplo: `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## ✅ Passo 9: Recarregar e Testar a Extensão

1. Volte para `chrome://extensions/`.
2. Clique no ícone de **Recarregar (Reload 🔄)** no card da extensão.
3. A partir de agora, todas as requisições da extensão utilizarão o Proxy Gateway com chave oculta e validação de permissões!

