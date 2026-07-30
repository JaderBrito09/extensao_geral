# 📖 Manual do Usuário — Assistente do Jorge

Bem-vindo ao **Assistente do Jorge**, sua extensão analítica inteligente integrada ao painel lateral do Google Chrome. Este manual orienta a instalação, o primeiro acesso e a utilização de todos os recursos do sistema.

---

## 📌 Índice
1. [Instalação & Primeiro Acesso](#-1-instalação--primeiro-acesso)
2. [Visão Geral da Interface](#-2-visão-geral-da-interface)
3. [Como Selecionar e Utilizar Habilidades](#-3-como-selecionar-e-utilizar-habilidades)
4. [Análise de Páginas Web e Formulários](#-4-análise-de-páginas-web-e-formulários)
5. [Gestão de Arquivos & Documentos Anexados](#-5-gestão-de-arquivos--documentos-anexados)
6. [Gerenciamento do Histórico de Conversas](#-6-gerenciamento-do-histórico-de-conversas)
7. [Dúvidas Frequentes & Resolução de Problemas](#-7-dúvidas-frequentes--resolução-de-problemas)

---

## 🚀 1. Instalação & Primeiro Acesso

### Passo 1: Instalação via Chrome Web Store
1. Acesse o link oficial fornecido pelo seu administrador (ex: `https://chromewebstore.google.com/detail/assistente-do-jorge/hjgeabliemiejipphdibnclofjiifnna`).
2. Clique no botão azul **Usar no Chrome** (Add to Chrome).
3. Confirme a instalação clicando em **Adicionar extensão**.

### Passo 2: Fixar a Extensão na Barra de Ferramentas
1. No canto superior direito do Chrome, clique no ícone de quebra-cabeça (🧩 **Extensões**).
2. Localize o **Assistente do Jorge** e clique no ícone do pino (📌 **Fixar**).

### Passo 3: Login Único via Conta Google
1. Clique no ícone do **Assistente do Jorge** na sua barra do navegador. O painel lateral (Side Panel) será aberto.
2. Na tela inicial, clique no botão **Entrar com o Google**.
3. Selecione sua Conta Google autorizada.
4. O sistema validará suas permissões e liberará a interface de chat.

---

## 🎨 2. Visão Geral da Interface

A interface do assistente é organizada de forma intuitiva:

* **Cabeçalho (Header)**:
  - **Perfil do Usuário**: Exibe sua foto de perfil, e-mail e botão de logout.
  - **Nova Conversa**: Botão `+` para iniciar um chat limpo.
  - **Histórico**: Ícone de relógio `🕒` para navegar por conversas anteriores.
* **Seletor de Habilidade (Select)**: Menu suspenso para escolher o especialista/instrução desejada.
* **Área de Conversa (Chat Window)**: Exibe a troca de mensagens formatada em Markdown, com tabelas, destaques de código e citações.
* **Painel de Arquivos da Página**: Exibe automaticamente os documentos identificados na aba aberta (`.pdf`, `.txt`, `.csv`, `.json`, etc.).
* **Campo de Entrada (Input Box)**:
  - Botão de Anexo (`📎`): Permite anexar arquivos do seu computador.
  - Caixa de Texto: Para digitar sua pergunta ou comando.
  - Botão Enviar (`⬆`): Envia a mensagem para processamento.

---

## 💡 3. Como Selecionar e Utilizar Habilidades

O Assistente possui **Habilidades Especiais (Skills)** catalogadas e mantidas no repositório oficial [`JaderBrito09/assistente-jorge-skills`](https://github.com/JaderBrito09/assistente-jorge-skills):

1. No menu suspenso **"Selecione uma habilidade"**, escolha a instrução desejada:
   - **Consulta Livre**: Para perguntas gerais, resumos de páginas e análises livres.
   - **Validador IMGG 100 Pontos** *(GestãoGov)*: Para validação técnica de relatórios de governança e gestão.
2. Ao selecionar uma habilidade, um **Card de Orientação Inicial** será exibido com dicas de uso específicas para aquela tarefa.
3. Novas habilidades disponibilizadas pela equipe no repositório do GitHub aparecerão automaticamente no seu menu suspenso sem necessidade de atualizar a extensão no Chrome!

---

## 📄 4. Análise de Páginas Web e Formulários

O assistente possui captura viva e contextualizada da aba ativa do seu navegador:

1. Navegue até a página ou sistema web que você deseja analisar (ex: portal de notícias, relatório, formulário de cadastro).
2. Abra o **Assistente do Jorge** no painel lateral.
3. Digite sua pergunta (ex: *"Resuma os pontos principais desta página"* ou *"Valide as informações inseridas neste formulário"*).
4. O assistente lerá o conteúdo sanitizado da página ativa em tempo real e responderá com base nele.

---

## 📎 5. Gestão de Arquivos & Documentos Anexados

### A. Leitura de Arquivos da Página
Quando você navega em uma página que contém links para documentos (`.pdf`, `.txt`, `.csv`, `.json`), a seção **Arquivos da Página** exibirá os itens encontrados:
- Clique no botão **Baixar** ao lado de qualquer arquivo para salvá-lo na máquina.
- Clique em **Baixar Todos** para baixar o lote completo de anexos da página.

### B. Anexar Arquivos Locais no Chat
1. Clique no botão de clipe `📎` no campo de digitação.
2. Escolha um arquivo do seu computador.
3. O arquivo será anexado e o texto contido nele será processado e enviado juntamente com sua pergunta para a IA.

---

## 🕒 6. Gerenciamento do Histórico de Conversas

Suas conversas não são perdidas e ficam salvas com segurança no seu computador:

* **Iniciar Nova Conversa**: Clique no botão `+ Nova Conversa` no topo da tela para limpar o chat atual.
* **Retomar Conversa Anterior**: Clique no ícone de relógio `🕒` no cabeçalho. Uma lista com o histórico de sessões anteriores será exibida. Clique sobre qualquer sessão para recarregar todas as mensagens.
* **Limpar Histórico**: Na lista de histórico, você pode remover sessões antigas a qualquer momento.

---

## ❓ 7. Dúvidas Frequentes & Resolução de Problemas

### 🔴 Tela de "Acesso Negado" ao fazer Login
* **Causa**: Seu e-mail não está cadastrado ou está inativo na planilha de controle de acessos do sistema.
* **Solução**: Solicite ao administrador da equipe a inclusão ou ativação do seu e-mail na aba `Usuarios`.

### 🔴 O assistente não lê o conteúdo da aba
* **Causa**: Algumas páginas internas de extensões (`chrome://`) ou da própria Chrome Web Store possuem bloqueio de segurança nativo do navegador.
* **Solução**: Navegue até uma página web normal (`https://...`) antes de solicitar a leitura.

### 🔴 Erro de Conexão ou Servidor
* Certifique-se de que sua conexão com a internet esteja ativa. O assistente re-tentará automaticamente em caso de oscilações pontuais.
