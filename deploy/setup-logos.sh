#!/bin/bash
# Cria atalhos em public/logos/ apontando para src/logos/ (opcional).
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/logos
SRC="src/logos"

link_if() {
  local src="$1" dest="$2"
  if [[ -f "$src" ]]; then
    ln -sf "../../$src" "public/logos/$dest"
    echo "OK: public/logos/$dest -> $src"
  fi
}

link_if "$SRC/logo-abrarastro-vertical.png" "abrarastro.png"
link_if "$SRC/abrarastro.png" "abrarastro.png"
link_if "$SRC/frutag.png" "frutag.png"

echo "Teste:"
npx tsx -e "
import { resolveLogoPath } from './src/lib/certificate-utils.ts';
console.log('abrarastro:', resolveLogoPath('abrarastro'));
console.log('frutag:', resolveLogoPath('frutag'));
"
