# 📜 Política de Privacidade — Assistente do Jorge

**Última atualização:** 29 de julho de 2026

A presente Política de Privacidade descreve como a extensão para navegador **Assistente do Jorge** coleta, utiliza, armazena e protege os dados dos usuários.

---

## 1. Informações Coletadas e Finalidade

O **Assistente do Jorge** é um assistente analítico de produtividade que opera exclusivamente mediante solicitação ativa do usuário no painel lateral do Chrome.

* **Identificação do Usuário (E-mail e Perfil Google)**: A permissão `identity` é utilizada exclusivamente para autenticação OAuth 2.0 via Conta Google. O e-mail do usuário é enviado ao servidor proxy seguro para validar se a conta está cadastrada e com status `ATIVO` na planilha de controle de acessos da instituição.
* **Conteúdo da Aba Ativa e Formulários**: Ao enviar uma pergunta, o script de leitura (`scripting` / `tabs`) extrai o texto sanitizado da página ativa visível para que o modelo de inteligência artificial (Gemini API) responda contextualizadamente ao usuário.
* **Anexos e Documentos**: Os documentos baixados ou anexados voluntariamente (`downloads`) são processados para extração de texto analítico no momento da consulta.
* **Histórico de Conversas e Preferências**: Armazenados **localmente no navegador do usuário** (`storage`) para permitir a funcionalidade de "Nova Conversa" ou "Retomar Conversa".

---

## 2. Compartilhamento e Venda de Dados

* **Não Venda de Dados**: Nós **não vendemos, alugamos ou comercializamos** quaisquer dados pessoais ou de navegação dos usuários sob nenhuma hipótese.
* **Sem Uso Publicitário**: Os dados coletados não são utilizados para exibição de anúncios, rastreamento comportamental, perfilamento publicitário ou avaliação de crédito.
* **Processamento de IA**: As consultas enviadas pelo usuário são encaminhadas ao modelo Google Gemini através de um gateway seguro no Google Apps Script de posse do próprio desenvolvedor/instituição.

---

## 3. Armazenamento e Segurança dos Dados

* **Processamento Local & Criptografia**: As conversas e caches de habilidades são salvos localmente na API `chrome.storage.local` no dispositivo do usuário.
* O tráfego de dados entre a extensão e o servidor proxy é realizado exclusivamente sob o protocolo criptografado `HTTPS`.

---

## 4. Retenção e Exclusão de Dados

* O usuário pode excluir todo o seu histórico de conversas a qualquer momento clicando no botão **Limpar Histórico** ou reinstalando a extensão.

---

## 5. Contato

Para dúvidas relativas a esta política ou ao tratamento de dados, entre em contato pelo e-mail do desenvolvedor cadastrado na Chrome Web Store.
