---
name: versao-e-backup
description: Automatiza a gestão de versões (SemVer), geração de pacotes .zip de release e backup de versões anteriores no Git e GitHub Releases para o projeto Assistente Jorge.
---

# Gestão Automatizada de Versões, Pacotes .zip e Backups - Assistente Jorge

Esta skill gerencia a numeração automática de versões (SemVer `MAJOR.MINOR.PATCH`), a criação de pacotes `.zip` de lançamento e o backup histórico das versões anteriores através de **Git Tags** e **GitHub Releases**.

---

## 🎯 Tipos de Incremento de Versão (SemVer)

1. **`patch`** (ex: `1.2.1` -> `1.2.2`): Correções de bugs, pequenas melhorias visuais ou ajustes na documentação.
2. **`minor`** (ex: `1.2.1` -> `1.3.0`): Novas funcionalidades retrocompatíveis (ex: suporte a mídias, histórico de sessões, novas abas).
3. **`major`** (ex: `1.2.1` -> `2.0.0`): Reformulações grandes da arquitetura ou mudanças incompatíveis com a versão anterior.

---

## 🚀 Fluxo de Execução Automática de Versão e Backup

Ao ser acionada, se o tipo de incremento (`patch`, `minor` ou `major`) **não tiver sido especificado explicitamente na chamada**, o assistente DEVE obrigatoriamente fazer a pergunta interativa ao usuário primeiro.

### ❓ Passo 0: Pergunta Interativa de Tipo de Incremento (Obrigatória se não especificado)

O assistente apresentará as opções ao usuário antes de alterar qualquer código:

> **Qual o tipo de atualização que está sendo lançada para o Assistente do Jorge?**
> 1. **Patch (1.2.2)** — Correção de bugs, refatoração interna ou ajustes na documentação.
> 2. **Minor (1.3.0)** — Novas funcionalidades e recursos adicionados à extensão.
> 3. **Major (2.0.0)** — Grandes mudanças de arquitetura ou breaking changes.

Assim que o usuário responder ou selecionar a opção, o assistente prosseguirá automaticamente com as etapas abaixo:

---

### 1. Ler a Versão Atual e Calcular o Incremento
- Ler a versão atual no arquivo [`manifest.json`](file:///Users/jader/Meu%20Drive/extensao_geral/manifest.json) (propriedade `"version"`).
- Aplicar o incremento SemVer escolhido pelo usuário (`patch`, `minor` ou `major`).

### 2. Executar Validação de Testes Unitários
- Rodar a suíte de testes do projeto:
  ```bash
  node tests/test.js
  ```
  *Se qualquer teste falhar, a geração de versão é imediatamente abortada.*

### 3. Atualizar a Versão nos Arquivos do Projeto
- **`manifest.json`**: Atualizar a propriedade `"version": "X.Y.Z"`.
- **`README.md`**: Atualizar o comando do pacote `.zip` de produção (`assistente-jorge-extension-vX.Y.Z.zip`).

### 4. Gerar o Pacote `.zip` de Produção (Backup Físico de Release)
- Gerar o arquivo `.zip` limpo (ignorando `.DS_Store` e arquivos de desenvolvimento):
  ```bash
  zip -r assistente-jorge-extension-vX.Y.Z.zip manifest.json sidepanel.html sidepanel.js sidepanel.css background.js icons/ lib/ -x "*.DS_Store"
  ```

### 5. Comitar e Criar Tag no Git (Backup Histórico Permanente)
- Comitar a alteração de versão:
  ```bash
  git add manifest.json README.md
  git commit -m "chore(release): bump version to vX.Y.Z"
  ```
- Criar a **Git Tag anotada** para congelar o estado exato desta versão:
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z do Assistente do Jorge"
  ```

### 6. Sincronizar com o GitHub
- Enviar os commits e as tags anotadas para o GitHub remoto:
  ```bash
  git push origin main
  git push origin vX.Y.Z
  ```

---

## 🛡️ Melhores Práticas Utilizadas

- **Interatividade & Controle**: Garante que nenhuma versão seja incrementada sem o consentimento e a classificação explícita do usuário.
- **Sincronia SemVer**: A versão em `manifest.json`, `README.md` e Git Tag são mantidas rigorosamente idênticas.
- **Git Tags Anotadas**: Qualquer versão anterior pode ser restaurada ou inspecionada a qualquer momento com `git checkout vX.Y.Z`.
- **Release Isolada**: Os arquivos `.zip` permanecem ignorados pelo repositório principal e são utilizados para publicação nas **Releases do GitHub** e na **Chrome Web Store**.
