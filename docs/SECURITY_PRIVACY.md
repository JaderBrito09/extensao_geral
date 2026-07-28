# 🔒 Segurança, Permissões V3 e Privacidade: Assistente do Jorge

Este documento detalha a política de privacidade, tratamento de dados de navegação e as justificativas técnicas para as permissões declaradas no `manifest.json` da extensão.

---

## 🛡️ Princípios de Privacidade de Dados

1. **Processamento Local**: O texto da página e os arquivos baixados pelo usuário são processados localmente no navegador e enviados diretamente via HTTPS para a API do Google Gemini.
2. **Sem Servidores Intermediários**: Não há servidor backend de terceiros interceptando, armazenando ou redirecionando as perguntas ou arquivos do usuário.
3. **Escopo Mínimo de Permissões**: A leitura na Planilha Google utiliza a permissão somente-leitura (`spreadsheets.readonly`).

---

## 📜 Justificativa de Permissões (`manifest.json`)

| Permissão | Finalidade e Justificativa Técnica |
| :--- | :--- |
| `"sidePanel"` | Necessária para exibir a interface analítica do assistente no painel lateral nativo do Chrome. |
| `"tabs"` | Necessária para identificar a URL e o título da aba ativa que o usuário deseja analisar. |
| `"scripting"` | Necessária para injetar o script de extração sanitizada de texto e detecção de links de download no DOM da aba ativa. |
| `"storage"` | Necessária para salvar o histórico de chat localmente no navegador e armazenar o cache offline de skills. |
| `"identity"` | Necessária para autenticar o usuário via OAuth 2.0 com a conta Google para verificação de permissão na planilha. |
| `"downloads"` | Necessária para realizar o download automático dos arquivos da página (.pdf, .txt, .csv, .json) para a máquina do usuário. |

---

## 🌐 Domínios Autorizados (`host_permissions`)

* `<all_urls>`: Permite a extração de texto em páginas web acessadas voluntariamente pelo usuário.
* `https://sheets.googleapis.com/*`: Acesso à API do Google Sheets para consulta de e-mails autorizados.
* `https://api.github.com/*`: Acesso à API do GitHub para download dos arquivos de skills em Markdown.
* `https://raw.githubusercontent.com/*`: Acesso ao conteúdo bruto das skills em formato Markdown.
