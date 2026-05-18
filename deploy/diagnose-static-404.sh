#!/bin/bash
# Diagnóstico: 404 em /_next/static (CSS/JS) e favicon
set -euo pipefail
APP="/var/www/palestras.abrarastro.org"
SITE="https://palestras.abrarastro.org"
cd "$APP"

echo "========== 1. Serviço Node =========="
systemctl is-active palestras || true
curl -sI "http://127.0.0.1:3000/" | head -5

echo ""
echo "========== 2. Arquivos .next/static =========="
if [[ ! -d .next/static ]]; then
  echo "ERRO: .next/static não existe. Rode: rm -rf .next && npm run build"
  exit 1
fi
CSS=$(find .next/static/css -name '*.css' 2>/dev/null | head -1)
JS=$(find .next/static/chunks -name 'webpack-*.js' 2>/dev/null | head -1)
echo "CSS local: ${CSS:-nenhum}"
echo "JS local:  ${JS:-nenhum}"

if [[ -n "$CSS" ]]; then
  # Use caminho relativo (find com path absoluto quebra o teste)
  REL="${CSS#.next/}"
  URL="/_next/$REL"
  echo "URL de teste: $URL"
  echo ""
  echo "========== 3. Node :3000 =========="
  curl -sI "http://127.0.0.1:3000$URL" | head -8
  echo ""
  echo "========== 4. HTTPS público (segue redirects) =========="
  curl -sIL "$SITE$URL" | head -12
fi

echo ""
echo "========== 5. Apache sites-enabled =========="
ls -la /etc/apache2/sites-enabled/

echo ""
echo "========== 6. Proxy no vhost HTTPS =========="
grep -h "ProxyPass\|ServerName" /etc/apache2/sites-enabled/* 2>/dev/null | head -20

echo ""
echo "========== Interpretação =========="
echo "- Node 200 + HTTPS 404  => Apache sem ProxyPass (rode: sudo bash deploy/fix-ssl-apache.sh)"
echo "- Node 404               => build desatualizado (rode: sudo bash deploy/reparar-site.sh)"
echo "- Node 200 + HTTPS 200   => cache do navegador (Ctrl+Shift+R)"
