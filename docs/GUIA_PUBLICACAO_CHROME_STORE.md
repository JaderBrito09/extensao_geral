# 🚀 Guia Oficial de Publicação na Chrome Web Store (Acesso Restrito / Não Listado)

Este guia orienta o processo de publicação da extensão **Assistente do Jorge** no **Chrome Web Store Developer Dashboard** sob o modo de visibilidade restrita/não listada (para disponibilização exclusiva a usuários autorizados).

---

## 📋 Pré-requisitos
1. **Arquivo `.zip` de Produção**: [`assistente-jorge-extension-v1.0.0.zip`](file:///Users/jader/Meu%20Drive/extensao_geral/assistente-jorge-extension-v1.0.0.zip) gerado na raiz do projeto.
2. **Conta de Desenvolvedor Chrome**: Registro único no [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (taxa de cadastro única do Google de US$ 5).
3. **Conta GCP e OAuth**: ID da extensão configurado nas credenciais de OAuth do Google Cloud Console.

---

## 🛠️ Passo a Passo de Publicação Restrita

### Passo 1: Acessar o Dashboard de Desenvolvedor
1. Acesse a [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
2. Faça login com a conta Google responsável pela gestão da extensão.

### Passo 2: Enviar o Pacote `.zip`
1. Clique no botão **+ Adicionar novo item** (Add new item).
2. Arraste ou selecione o arquivo `assistente-jorge-extension-v1.0.0.zip`.
3. Aguarde o upload e o processamento inicial do manifesto.

### Passo 3: Configurar a Visibilidade (Restrita / Não Listada)
Para garantir que a extensão não fique visível para qualquer pessoa na busca pública da loja:

1. No menu lateral do item, acesse **Distribuição** (Distribution).
2. Na seção **Visibilidade**:
   - **Opção A: Não Listada (Unlisted)** *(Recomendada)*:
     - A extensão **não aparece nas pesquisas** da Chrome Web Store.
     - Somente pessoas com o **link direto** da página da extensão poderão acessá-la e instalá-la.
     - *Nota*: A validação das permissões de uso do assistente continua sendo garantida no servidor via Planilha Google Sheets.
   - **Opção B: Privada / Testadores (Private / Trusted Testers)**:
     - Permite restringir a instalação exclusivamente para uma **lista cadastrada de e-mails ou Grupo do Google** (Google Group).
     - Insira os e-mails dos usuários autorizados ou a URL do grupo na seção de testadores.

### Passo 4: Preencher Detalhes da Loja (Store Listing)
No menu lateral **Listagem da loja** (Store listing), preencha os campos obrigatórios:

* **Nome**: `Assistente do Jorge`
* **Descrição Curta**: `Assistente analítico inteligente de governança e gestão integrado ao painel lateral do Chrome.`
* **Descrição Detalhada**:
  ```markdown
  O Assistente do Jorge é uma extensão analítica corporativa que opera diretamente no painel lateral (Side Panel) do navegador.
  
  Recursos Principais:
  - Análise de páginas web e formulários em tempo real.
  - Carregamento dinâmico de Habilidades e Normativos.
  - Suporte a leitura de documentos (.pdf, .txt, .csv, .json).
  - Histórico de conversas salvas no computador do usuário.
  ```
* **Categoria**: `Produtividade` ou `Ferramentas de desenvolvedor`.
* **Capturas de Tela (Screenshots)**:
  - Envie ao menos 1 screenshot no formato `1280x800` ou `640x400` mostrando o painel lateral em funcionamento.
* **Ícone do Item**:
  - Envie uma imagem `128`x`128` px (arquivo `icons/icon128.png`).

### Passo 5: Práticas de Privacidade (Privacy Practices)
Na aba **Práticas de privacidade** (Privacy practices) do console, você deve preencher os campos de **Link da Política de Privacidade** e colar as **Justificativas de Permissões** abaixo:

#### 🔗 Link da Política de Privacidade:
Cole a URL do raw do arquivo no GitHub (ou link do seu site/repositório):
`https://raw.githubusercontent.com/JaderBrito09/extensao_geral/main/docs/POLITICA_DE_PRIVACIDADE.md`

---

#### 📝 Justificativas de Permissões (Copie e Cole cada texto no campo correspondente):

* **`sidePanel`**:
  > `Utilizada para exibir a interface de chat do assistente analítico no painel lateral nativo do navegador Chrome, garantindo navegação contínua sem cobrir o conteúdo da página ativa.`

* **`identity`**:
  > `Utilizada exclusivamente para autenticar o usuário via OAuth 2.0 com a Conta Google e verificar se o e-mail possui autorização ativa na planilha de controle de acesso do sistema.`

* **`scripting`**:
  > `Utilizada para injetar o script de extração de texto sanitizado e leitura de dados de formulários na aba ativa somente quando o usuário solicita uma análise.`

* **`tabs`**:
  > `Utilizada para identificar a URL e o título da aba ativa atual que o usuário deseja analisar com o assistente.`

* **`storage`**:
  > `Utilizada para salvar o histórico de conversas e preferências do assistente localmente no dispositivo do usuário, além de armazenar o cache temporário das habilidades.`

* **`downloads`**:
  > `Utilizada para realizar o download automático de documentos anexados na página ativa (.pdf, .txt, .csv, .json) para leitura e análise a pedido do usuário.`

* **Permissão de Host (`host_permissions` / `<all_urls>`, `script.google.com`, `github.com`)**:
  > `Necessária para extrair o texto de páginas web acessadas voluntariamente pelo usuário, comunicar-se com o gateway proxy do servidor no Google Apps Script e baixar o catálogo de habilidades do GitHub.`

---

#### 🔒 Coleta e Uso de Dados (Data Usage):
* Marque apenas que os dados da página/navegação são processados exclusivamente para a funcionalidade principal da extensão.
* Marque **NÃO** para todas as perguntas referentes a venda de dados, publicidade ou avaliação de crédito.

### Passo 6: Submeter para Revisão
1. Clique no botão **Enviar para análise** (Submit for review) no canto superior direito.
2. A análise automática do Google leva geralmente entre **24 a 48 horas**.
3. Assim que aprovada, o status mudará para **Publicado (Não listado)**.
4. Copie a URL pública gerada na loja e compartilhe diretamente com os usuários autorizados!
