# 📊 Template e Guia da Planilha de Controle de Acesso

Este documento instrui a criação e configuração da **Planilha Google Sheets** utilizada pelo **Google Apps Script Proxy** para autorizar ou bloquear o acesso dos usuários à extensão **Assistente do Jorge**.

---

## 📌 ID Padrão da Planilha no Projeto
* **ID da Planilha Configurado**: `1VbXL-23CimrbmoEThgPRSepOfzmgRtTXrIyftwXBRGE`
* **Nome da Aba Obrigatório**: `Usuarios`

---

## 📐 Estrutura da Tabela (Aba `Usuarios`)

Crie uma aba com o nome **`Usuarios`** e insira o cabeçalho exatamente na **Linha 1**:

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E |
| :--- | :--- | :--- | :--- | :--- |
| **E-mail** | **Nome** | **Status** | **Skills Permitidas** | **Observações** |

### 📝 Exemplo de Preenchimento das Linhas:

| E-mail | Nome | Status | Skills Permitidas | Observações |
| :--- | :--- | :---: | :--- | :--- |
| `jaderbrito.fernandes@sefaz.mt.gov.br` | Jader Brito | `ATIVO` | `ALL` | Administrador principal |
| `joao.silva@sefaz.mt.gov.br` | João Silva | `ATIVO` | `geral, juridico` | Acesso parcial |
| `maria.souza@empresa.com` | Maria Souza | `INATIVO` | `ALL` | Conta temporariamente inativa |

---

## ⚙️ Regras de Validação do Servidor (`Code.gs`)

1. **Combinação de E-mail e Status**:
   - O e-mail autenticado pelo Google OAuth é comparado em letras minúsculas (sem diferenciar maiúsculas/minúsculas).
   - O sistema considera como **AUTORIZADO** apenas se a coluna **Status** for igual a `ATIVO`, `ACTIVE`, `SIM` ou `1`.
2. **E-mails Inativos ou Não Cadastrados**:
   - Se o e-mail não constar na lista ou estiver marcado como `INATIVO`, o Apps Script Proxy responde com erro `ACESSO_NEGADO`.
3. **Bloqueio no Cliente**:
   - A extensão captura a negação e exibe a tela de bloqueio com a mensagem:
     > *"Usuário não autorizado a acessar o assistente. Favor contatar o administrador"*
