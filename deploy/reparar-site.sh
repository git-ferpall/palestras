#!/bin/bash
# Repara 404 em /_next/static — build limpo + permissões + reinício
set -euo pipefail
APP="/var/www/palestras.abrarastro.org"
cd "$APP"

echo "========== 1. Parar Node (evita servir .next antigo) =========="
systemctl stop palestras || true
sleep 2
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

echo ""
echo "========== 2. Logos em public/logos =========="
mkdir -p public/logos
node scripts/copy-logos.mjs 2>/dev/null || true
if [[ ! -f public/logos/abrarastro.png ]]; then
  if [[ -f src/logos/logo-abrarastro-vertical.png ]]; then
    cp -f src/logos/logo-abrarastro-vertical.png public/logos/abrarastro.png
  elif [[ -f src/logos/abrarastro.png ]]; then
    cp -f src/logos/abrarastro.png public/logos/abrarastro.png
  else
    echo "ERRO: coloque logo em src/logos/"
    exit 1
  fi
fi
echo "OK public/logos/abrarastro.png"

echo ""
echo "========== 3. Build limpo =========="
rm -rf .next
npm run build

echo ""
echo "========== 4. Permissões (serviço roda como www-data) =========="
chown -R www-data:www-data .next
chown -R www-data:www-data public/logos 2>/dev/null || true
mkdir -p data/uploads/palestras
chown -R www-data:www-data data/uploads
chown www-data:www-data .env 2>/dev/null || true

echo ""
echo "========== 5. Reiniciar Node =========="
cp -f deploy/palestras.service /etc/systemd/system/palestras.service
systemctl daemon-reload
systemctl enable palestras
systemctl start palestras
sleep 5
systemctl is-active palestras

echo ""
echo "========== 6. Teste arquivos estáticos no Node :3000 =========="
CSS=$(find .next/static/css -maxdepth 1 -name '*.css' 2>/dev/null | head -1)
if [[ -z "$CSS" ]]; then
  echo "ERRO: nenhum CSS gerado em .next/static/css"
  exit 1
fi
REL="${CSS#.next/}"
echo "Arquivo: $CSS"
echo "URL: /_next/$REL"

STATUS=$(curl -sI "http://127.0.0.1:3000/_next/$REL" | head -1)
echo "Node: $STATUS"
if ! echo "$STATUS" | grep -q "200"; then
  echo ""
  echo "ERRO: Next.js não serve o CSS após build limpo."
  echo "Verifique: journalctl -u palestras -n 50 --no-pager"
  exit 1
fi

echo ""
echo "========== 7. Apache proxy =========="
bash deploy/fix-ssl-apache.sh

HTTPS_STATUS=$(curl -sI "https://palestras.abrarastro.org/_next/$REL" | head -1)
echo "HTTPS: $HTTPS_STATUS"

echo ""
echo "Pronto. No navegador: Ctrl+Shift+R (limpar cache)."
