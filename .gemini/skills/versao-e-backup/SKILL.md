---
name: versao-e-backup
description: Automatiza a gestão de versões (SemVer), geração de pacotes .zip de release e backup de versões anteriores no Git e GitHub Releases para o projeto Assistente Jorge.
---

# Gestão Automatizada de Versões, Pacotes .zip e Backups - Assistente Jorge

Esta skill gerencia a numeração automática de versões (SemVer `MAJOR.MINOR.PATCH`), a criação de pacotes `.zip` de lançamento e o backup histórico das versões anteriores através de **Git Tags** e **GitHub Releases**.

---

## 🎯 Tipos de Incremento de Versão

Ao acionar esta skill, especifique o tipo de versão desejado (ou o agente determinará com base nas alterações):

1. **`patch`** (ex: `1.2.1` -> `1.2.2`): Correções de bugs, pequenas melhorias visuais ou atualizações de documentação.
2. **`minor`** (ex: `1.2.1` -> `1.3.0`): Novas funcionalidades retrocompatíveis (novos recursos no chat, suporte a mídias, etc.).
3. **`major`** (ex: `1.2.1` -> `2.0.0`): Mudanças estruturais grandes ou incompatíveis na arquitetura da extensão.

---

## 🚀 Fluxo de Execução Automática de Versão e Backup

Quando a skill for acionada, o assistente DEVE executar obrigatoriamente o seguinte fluxo:

### 1. Ler e Calcular a Nova Versão
- Ler a versão atual no arquivo [`manifest.json`](file:///Users/jader/Meu%20Drive/extensao_geral/manifest.json).
- Calcular a nova versão incrementada conforme o tipo escolhido (`patch`, `minor` ou `major`).

### 2. Executar Validação de Testes
- Rodar a suíte de testes unitários do projeto:
  ```bash
  node tests/test.js
  ```
  *Se houver falha, a geração de versão é abortada.*

### 3. Atualizar Arquivos do Projeto com a Nova Versão
- **`manifest.json`**: Atualizar a propriedade `"version": "X.Y.Z"`.
- **`README.md`**: Atualizar o comando do pacote `.zip` de produção (`assistente-jorge-extension-vX.Y.Z.zip`).

### 4. Gerar o Pacote `.zip` de Produção (Backup Físico de Release)
- Gerar o pacote empacotado limpo (ignorando `.DS_Store` e arquivos de dev):
  ```bash
  zip -r assistente-jorge-extension-vX.Y.Z.zip manifest.json sidepanel.html sidepanel.js sidepanel.css background.js icons/ lib/ -x "*.DS_Store"
  ```

### 5. Comitar e Taggear no Git (Backup Histórico Permanente)
- Adicionar as alterações de versão ao Git:
  ```bash
  git add manifest.json README.md
  git commit -m "chore(release): bump version to vX.Y.Z"
  ```
- Criar uma **Git Tag anotada** para backup e rastreabilidade da versão:
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z do Assistente do Jorge"
  ```

### 6. Sincronizar com o GitHub
- Enviar os commits e as tags anotadas para o GitHub:
  ```bash
  git push origin main
  git push origin vX.Y.Z
  ```

---

## 🛡️ Melhores Práticas Utilizadas

- **Sincronia SemVer**: A versão em `manifest.json`, `README.md` e Git Tag são mantidas rigorosamente idênticas.
- **Git Tags Anotadas**: Garantem que qualquer versão anterior possa ser restaurada com um simples `git checkout v1.2.1`.
- **Release Isolada**: O arquivo `.zip` permanece ignorado pelo `.gitignore` do repositório principal para não poluir o histórico de código, sendo reservado para publicação na aba de **Releases do GitHub** e submissão na **Chrome Web Store**.
