#!/usr/bin/env bash
#
# Script de Empacotamento Oficial da Extensão Chrome (Manifest V3)
# Segue as diretrizes da Chrome Web Store para builds de distribuição limpos.
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Lê a versão atual do manifest.json
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])" 2>/dev/null || grep -o '"version": *"[^"]*"' manifest.json | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
  echo "❌ Erro: Não foi possível determinar a versão no manifest.json"
  exit 1
fi

OUTPUT_DIR="$PROJECT_ROOT/backups"
mkdir -p "$OUTPUT_DIR"
ZIP_NAME="assistente-jorge-extension-v${VERSION}.zip"
DEST_ZIP="$OUTPUT_DIR/$ZIP_NAME"

echo "📦 Empacotando Assistente do Jorge (v${VERSION})..."

# Remove pacote anterior se existir no destino
rm -f "$DEST_ZIP"

# Cria o pacote zip apenas com os arquivos essenciais de runtime
zip -r "$DEST_ZIP" \
  manifest.json \
  background.js \
  content.js \
  sidepanel.html \
  sidepanel.css \
  sidepanel.js \
  icons/ \
  lib/ \
  -x "*.DS_Store" \
  -x "*__MACOSX*" \
  -x "*.git*" \
  -q

echo "✅ Pacote gerado com sucesso em: $DEST_ZIP"
echo "📊 Tamanho do arquivo: $(du -h "$DEST_ZIP" | cut -f1)"
