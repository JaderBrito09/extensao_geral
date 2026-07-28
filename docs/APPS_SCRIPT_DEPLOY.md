# 📑 Guia de Deploy do Google Apps Script Proxy Gateway

Este documento é o guia oficial de implantação do backend intermediário serverless (**Google Apps Script Web App**) para o projeto **Assistente do Jorge**.

---

## 🎯 Objetivo da Arquitetura
Proteger a chave de API do Gemini (`GEMINI_API_KEY`) para que **nunca fique exposta no código da extensão nem trafegue para o navegador do cliente**, validando simultaneamente o acesso do usuário na **Planilha Google Sheets**.

---

## 🚀 Passo a Passo de Implantação

### 1. Criar o Projeto no Google Apps Script
1. Acesse o [Google Apps Script](https://script.google.com/).
2. Clique no botão **+ Novo projeto (+ New project)** no canto superior esquerdo.
3. No topo, renomeie o projeto de *Projeto sem título* para **`Assistente-Jorge-Proxy`**.

---

### 2. Inserir o Código `Code.gs`
1. No editor de código principal, apague o conteúdo padrão `function myFunction() {}`.
2. Abra o arquivo de referência [`apps-script/Code.gs`](file:///Users/jader/Meu%20Drive/extensao_geral/apps-script/Code.gs) criado no repositório do projeto.
3. Copie todo o conteúdo do `Code.gs` e cole no editor do Apps Script.
4. Clique no ícone de **Salvar 💾** (ou pressione `Ctrl + S` / `Cmd + S`).

---

### 3. Configurar a Chave da API do Gemini (`GEMINI_API_KEY`)
1. No menu lateral esquerdo do Apps Script, clique no ícone de engrenagem ⚙️ (**Configurações do projeto / Project Settings**).
2. Role a página até a seção **Propriedades do script (Script Properties)**.
3. Clique no botão **Adicionar propriedade do script (Add script property)**.
4. Preencha os campos exatamente como abaixo:
   - **Propriedade (Property)**: `GEMINI_API_KEY`
   - **Valor (Value)**: *(Cole a sua chave de API do Google AI Studio - ex: `AIzaSy...`)*
5. Clique em **Salvar propriedades do script (Save script properties)**.

---

### 4. Realizar o Deploy como Web App (Executável Web)
1. No canto superior direito da tela do Apps Script, clique no botão azul **Implantação (Deploy)** > **Nova implantação (New deployment)**.
2. No menu suspenso de engrenagem ⚙️ *Selecione o tipo*, escolha **App da Web (Web App)**.
3. Preencha os campos de configuração:
   - **Descrição**: `Versão 1.0 - Proxy Gateway`
   - **Executar como (Execute as)**: **`Eu (Seu E-mail)`** *(Importante: Executar como você garante acesso às propriedades salvas e à leitura da planilha)*.
   - **Quem tem acesso (Who has access)**: **`Qualquer pessoa (Anyone)`** *(Permite que as requisições da extensão alcancem o endpoint)*.
4. Clique em **Implantar (Deploy)**.
5. Se o Google solicitar autorização de acesso ao Drive/Sheets, clique em **Autorizar acesso (Authorize access)** e confirme com sua conta Google.

---

### 5. Copiar a URL do Endpoint Gerada
Após concluir o deploy, o Google exibirá a caixa de diálogo com o título *Implantação concluída*.
1. Copie o valor do campo **URL do app da Web (Web app URL)**.
   - Formato da URL: `https://script.google.com/macros/s/AKfycbx.../exec`
2. Essa URL será utilizada na configuração da extensão Chrome (**Sprint 6**).
