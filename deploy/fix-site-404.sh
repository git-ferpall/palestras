#!/bin/bash
# Corrige 404 em /_next/static e /logos (build + proxy + logos)
set -euo pipefail
APP_DIR="/var/www/palestras.abrarastro.org"
cd "$APP_DIR"

echo "=== 1. Logos em public/logos ==="
node scripts/copy-logos.mjs || true
ls -la public/logos/ 2>/dev/null || echo "Crie src/logos/logo-abrarastro-vertical.png"

echo ""
echo "=== 2. Build Next.js ==="
npm run build

echo ""
echo "=== 3. Reiniciar Node ==="
systemctl restart palestras
sleep 3
systemctl is-active palestras

echo ""
echo "=== 4. Teste direto no Node (porta 3000) ==="
curl -sI "http://127.0.0.1:3000/" | head -3
curl -sI "http://127.0.0.1:3000/logos/abrarastro.png" | head -3

CSS=$(find .next/static/css -name '*.css' 2>/dev/null | head -1)
if [[ -n "$CSS" ]]; then
  REL="${CSS#.next/}"
  echo "Testando /_next/$REL"
  curl -sI "http://127.0.0.1:3000/_next/$REL" | head -3
else
  echo "AVISO: nenhum CSS em .next/static/css"
fi

echo ""
echo "=== 5. Apache: um unico vhost com ProxyPass ==="
ENABLED=$(ls /etc/apache2/sites-enabled/)
echo "$ENABLED"
if echo "$ENABLED" | grep -q le-ssl; then
  echo "AVISO: existe *-le-ssl.conf do certbot sem proxy. Rode:"
  echo "  sudo bash deploy/fix-apache-proxy.sh"
fi

echo ""
echo "=== 6. Teste HTTPS publico ==="
curl -sI "https://palestras.abrarastro.org/logos/abrarastro.png" | head -5

echo ""
echo "Se localhost:3000 OK mas HTTPS 404 em /_next: problema no Apache (proxy)."
echo "Se localhost:3000 tambem 404: rode npm run build e systemctl restart palestras."
