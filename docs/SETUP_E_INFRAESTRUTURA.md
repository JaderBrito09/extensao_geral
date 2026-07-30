# 🛠️ Guia Completo de Setup, Configuração e Infraestrutura

Este documento consolida todas as informações necessárias para registrar, configurar, implantar e replicar o ecossistema do **Assistente do Jorge** do zero.

---

## 📋 Tabela de Registro de Parâmetros do Projeto

Preencha os valores abaixo para referência da equipe de desenvolvimento:

| Parâmetro | Valor Registrado | Descrição |
| :--- | :--- | :--- |
| **Nome do Projeto GCP** | `Extensao Geral OAuth` | Nome exibido no Google Cloud Console |
| **ID do Projeto GCP (PROJECT_ID)** | `ext-geral-oauth-2026` | Identificador único do projeto GCP |
| **Número do Projeto GCP** | `1030154870179` | Número de identificação numérica do GCP |
| **Conta GCP Administradora** | `jaderbrito.fernandes@sefaz.mt.gov.br` | Conta proprietária do projeto GCP |
| **ID da Extensão (Loja Oficial)** | `hjgeabliemiejipphdibnclofjiifnna` | ID oficial atribuído pela Chrome Web Store |
| **OAuth Client ID (Loja Oficial)** | `1030154870179-60e6j1amgkpn2apsj5i0nf6lurs58k54.apps.googleusercontent.com` | Credencial vinculada à publicação oficial na Web Store |
| **ID da Extensão (Dev Local)** | `iobhoockjdkooadefbhlolggdlikdoke` | ID provisório gerado em `chrome://extensions` |
| **OAuth Client ID (Dev Local)** | `1030154870179-c8ri4egjl3o6hiigec84c8aou3g5lo3p.apps.googleusercontent.com` | Credencial vinculada ao desenvolvimento local |
| **Endpoint do Apps Script Proxy** | `https://script.google.com/macros/s/AKfycbxB0r52U-lcIIZQKslhDBaROeVz-aqNmD1j1RrzUzFUDzxGJyZWwmJK8pjaARBc0u3s/exec` | URL pública do Web App no Google Apps Script |
| **Repositório do Código-Fonte** | `JaderBrito09/extensao_geral` | Repositório exclusivo do código da extensão, Apps Script e testes |
| **Repositório Exclusivo de Skills** | `JaderBrito09/assistente-jorge-skills` | Repositório dedicado para arquivos Markdown (`.md`) e `skills.json` |

---

## 🐙 Arquitetura de Repositórios no GitHub

Para manter a segurança e facilitar a gestão contínua de conteúdo sem a necessidade de re-compilar a extensão, o projeto utiliza **dois repositórios independentes**:

### 1. **Repositório do Código-Fonte (`JaderBrito09/extensao_geral`)**
- **Objetivo**: Armazenar o código da aplicação Chrome (Manifest V3), componentes de interface (`sidepanel.*`), manipuladores de eventos do navegador, servidor intermediário `apps-script/Code.gs`, testes unitários e documentação técnica.

### 2. **Repositório Exclusivo de Skills (`JaderBrito09/assistente-jorge-skills`)**
- **Objetivo**: Repositório público/dedicado onde especialistas de domínio registram e atualizam os arquivos Markdown (`.md`) e o catálogo `skills.json`.
- **Endpoints Consumidos**:  
  - Catálogo JSON: `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills.json`  
  - Habilidades Markdown: `https://raw.githubusercontent.com/JaderBrito09/assistente-jorge-skills/main/skills/{skillId}.md`

---

## 📊 Planilha de Controle de Acesso (Google Sheets)

O controle de usuários e permissões é gerenciado via Google Sheets:
* **ID Padrão da Planilha**: `1VbXL-23CimrbmoEThgPRSepOfzmgRtTXrIyftwXBRGE`
* **Nome da Aba Obrigatório**: `Usuarios`

### 📐 Estrutura da Tabela (Linha 1):
| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E |
| :--- | :--- | :--- | :--- | :--- |
| **E-mail** | **Nome** | **Status** | **Skills Permitidas** | **Observações** |

### 📝 Exemplo de Preenchimento:
| E-mail | Nome | Status | Skills Permitidas | Observações |
| :--- | :--- | :---: | :--- | :--- |
| `jaderbrito.fernandes@sefaz.mt.gov.br` | Jader Brito | `ATIVO` | `ALL` | Administrador principal |
| `joao.silva@sefaz.mt.gov.br` | João Silva | `ATIVO` | `CAT:Jurídico, SKILL-GERAL-001` | Acesso à categoria Jurídico + Geral |
| `maria.souza@empresa.com` | Maria Souza | `ATIVO` | `SKILL-GERAL-001` | Acesso exclusivo por ID de skill |
| `pedro.lima@empresa.com` | Pedro Lima | `INATIVO` | `ALL` | Conta inativa (bloqueado) |

### 🛡️ Sintaxe Suportada na Coluna `Skills Permitidas`:
- **`ALL` ou `*`**: Concede acesso a 100% das habilidades cadastradas no manifesto `skills.json`.
- **`SKILL-ID`** (ex: `SKILL-GERAL-001`): Liberação específica pelo ID imutável da habilidade.
- **`CAT:<Nome>`** (ex: `CAT:Jurídico`, `CAT:Dev`): Liberação por Categoria/Grupo de habilidades.

---

## ⚡ Deploy do Google Apps Script Proxy Gateway

O Proxy no Google Apps Script faz a ponte segura entre a extensão Chrome e a API do Gemini.

### 📝 Passo a Passo de Implantação:

1. **Acessar a Planilha**:
   - Abra a planilha `Assistente do Jorge - Controle de Acesso`.
2. **Abrir o Editor do Apps Script**:
   - Clique no menu superior em **Extensões > Apps Script**.
3. **Inserir o Código**:
   - Substitua todo o conteúdo do arquivo `Code.gs` pelo código fonte contido em [`apps-script/Code.gs`](file:///Users/jader/Meu%20Drive/extensao_geral/apps-script/Code.gs).
4. **Configurar a Chave de API do Gemini**:
   - No menu lateral do Apps Script, clique no ícone de engrenagem **Configurações do Projeto** (⚙️).
   - Role até a seção **Propriedades do script** e clique em **Adicionar propriedade do script**.
   - Propriedade: `GEMINI_API_KEY`  
   - Valor: Insira sua chave da API do Google AI Studio (obtida em `https://aistudio.google.com/app/apikey`).
   - Clique em **Salvar propriedades do script**.
5. **Realizar o Implantação (Deploy)**:
   - No canto superior direito, clique no botão azul **Implantar > Nova implantação**.
   - Clique no ícone de engrenagem ao lado de *Selecione o tipo* e escolha **App da Web**.
   - Preencha a configuração:
     - **Descrição**: `Proxy Gateway Gemini API`
     - **Executar como**: `Eu (seu e-mail)`
     - **Quem tem acesso**: `Qualquer pessoa` (opção *Anyone*)
   - Clique no botão **Implantar**.
6. **Autorizar Permissões**:
   - Na janela pop-up, clique em **Autorizar acesso**, selecione sua conta Google, clique em *Avançado* e depois em *Acessar projeto (não seguro)* para conceder a permissão de leitura na planilha.
7. **Copiar a URL do Web App**:
   - Copie a URL do Web App gerada (`https://script.google.com/macros/s/.../exec`).

---

## 🚀 Passo a Passo de Replicação do Zero

1. **Configurar a Planilha**: Crie a planilha com a aba `Usuarios` conforme a seção acima.
2. **Criar o Google Cloud Project & OAuth 2.0**:
   - Acesse o Google Cloud Console (`ext-geral-oauth-2026`).
   - Ative a **Google Sheets API**.
   - Na **Tela de Permissão OAuth** (OAuth consent screen), altere o status de publicação clicando em **Publicar aplicativo** (Publish App) para definir o status como `Em Produção`.
   - Crie a Credencial OAuth do tipo **Extensão do Chrome** e configure o ID oficial da extensão (`hjgeabliemiejipphdibnclofjiifnna`).
3. **Instalar a Extensão no Chrome**:
   - Acesse `chrome://extensions/`.
   - Ative o *Modo do desenvolvedor* no canto superior direito.
   - Clique em **Carregar sem compactação** e selecione a pasta raiz da extensão.
4. **Gerar Pacote para Deploy na Chrome Web Store**:
   - O arquivo de distribuição `assistente-jorge-extension-v1.2.1.zip` pode ser gerado executando na raiz do projeto:
     ```bash
     zip -r assistente-jorge-extension-v1.2.1.zip manifest.json sidepanel.html sidepanel.js sidepanel.css background.js icons/ lib/ -x "*.DS_Store"
     ```

