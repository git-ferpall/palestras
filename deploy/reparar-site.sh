#!/bin/bash
# Repara logo 404 + _next/static 404 — rode como root no servidor
set -euo pipefail
APP="/var/www/palestras.abrarastro.org"
cd "$APP"

echo "========== 1. Logos em public/logos =========="
mkdir -p public/logos
if [[ -f src/logos/logo-abrarastro-vertical.png ]]; then
  cp -f src/logos/logo-abrarastro-vertical.png public/logos/abrarastro.png
  echo "OK abrarastro.png"
elif [[ -f src/logos/abrarastro.png ]]; then
  cp -f src/logos/abrarastro.png public/logos/abrarastro.png
  echo "OK abrarastro.png"
else
  echo "ERRO: coloque logo-abrarastro-vertical.png em src/logos/"
  exit 1
fi
[[ -f src/logos/frutag.png ]] && cp -f src/logos/frutag.png public/logos/frutag.png

echo ""
echo "========== 2. Build (limpa .next antigo) =========="
rm -rf .next
npm run build

echo ""
echo "========== 3. Servico Node =========="
cp -f deploy/palestras.service /etc/systemd/system/palestras.service
systemctl daemon-reload
systemctl enable palestras
systemctl restart palestras
sleep 4
systemctl is-active palestras

echo ""
echo "========== 4. Teste Node :3000 =========="
curl -sfI "http://127.0.0.1:3000/logos/abrarastro.png" | head -2
curl -sfI "http://127.0.0.1:3000/" | head -2
CSS=$(find .next/static/css -name '*.css' 2>/dev/null | head -1 || true)
if [[ -n "$CSS" ]]; then
  REL="${CSS#.next/}"
  echo "CSS: /_next/$REL"
  curl -sfI "http://127.0.0.1:3000/_next/$REL" | head -2
fi

echo ""
echo "========== 5. Apache proxy =========="
bash deploy/fix-ssl-apache.sh

echo ""
echo "========== 6. Teste HTTPS =========="
curl -sI "https://palestras.abrarastro.org/logos/abrarastro.png" | head -3
curl -sI "https://palestras.abrarastro.org/" | head -3

echo ""
echo "Pronto. No navegador: Ctrl+Shift+R (limpar cache)."
