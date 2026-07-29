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
Na aba **Práticas de privacidade**:

1. **Justificativa de Permissões (Single Purpose)**:
   - Declare a finalidade principal: *"Fornecer um assistente interativo no painel lateral para leitura e análise contextualizada de páginas e documentos fornecidos pelo usuário."*
2. **Uso de Dados**:
   - Marque apenas os dados utilizados localmente (`Histórico da web` ou `Conteúdo da página` para fins exclusivos de processamento do prompt no assistente).
   - Confirme que os dados **não são vendidos** nem utilizados para fins de publicidade/crédito.

### Passo 6: Submeter para Revisão
1. Clique no botão **Enviar para análise** (Submit for review) no canto superior direito.
2. A análise automática do Google leva geralmente entre **24 a 48 horas**.
3. Assim que aprovada, o status mudará para **Publicado (Não listado)**.
4. Copie a URL pública gerada na loja e compartilhe diretamente com os usuários autorizados!
