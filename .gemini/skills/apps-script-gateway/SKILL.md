---
name: apps-script-gateway
description: Orienta o desenvolvimento, depuração, segurança e deploy do servidor Proxy Gateway no Google Apps Script (Code.gs) e integração com Google Sheets e Gemini API.
---

# Google Apps Script Proxy Gateway — Assistente do Jorge

Esta skill orienta a manutenção e atualização do código backend residente na pasta `apps-script/Code.gs` e o seu deploy como Web App no Google Apps Script.

---

## 🏛️ Arquitetura do Proxy Gateway

O Proxy no Apps Script atua como uma ponte segura entre a extensão Chrome e a API do Gemini:
- **Autenticação**: Recebe o e-mail do usuário autenticado no Google e valida o status na Planilha Google Sheets.
- **Segurança de Chave**: A chave da API do Gemini (`GEMINI_API_KEY`) fica armazenada com segurança no Apps Script (Script Properties) e NUNCA é enviada à extensão client-side.
- **Filtragem de Skills**: Retorna apenas as habilidades permitidas para o e-mail cadastrado.

---

## 🛡️ Checklist de Manutenção e Deploy

1. **Alterações no `apps-script/Code.gs`**:
   - Sempre tratar erros e retornar objetos JSON padronizados `{ "error": "MENSAGEM" }`.
   - Garantir suporte a requisições HTTP `POST` e preflight `OPTIONS` (CORS).
2. **Atualização da Planilha de Permissões**:
   - Manter as colunas `Email`, `Status` (`ATIVO`/`INATIVO`) e `Skills Permitidas`.
3. **Novo Deploy (Web App)**:
   - Ao alterar o `Code.gs`, publicar uma **Nova Versão** no painel do Apps Script (`Implantar > Gerenciar Implantações > Editar > Nova Versão`).
