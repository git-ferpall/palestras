#!/bin/bash
# Corrige Apache após certbot: garante proxy HTTPS para Next.js
set -euo pipefail

SITE="palestras.abrarastro.org"
APP_DIR="/var/www/palestras.abrarastro.org"
CONF="/etc/apache2/sites-available/palestras.conf"
SSL_CONF="/etc/apache2/sites-available/palestras-le-ssl.conf"

echo "==> Habilitando módulos..."
a2enmod proxy proxy_http ssl rewrite headers 2>/dev/null || true

if [[ -f "$(dirname "$0")/apache-palestras.conf" ]]; then
  cp "$(dirname "$0")/apache-palestras.conf" "$CONF"
  echo "==> Config copiada para $CONF"
elif [[ ! -f "$CONF" ]]; then
  echo "ERRO: $CONF não encontrado. Copie deploy/apache-palestras.conf manualmente."
  exit 1
fi

# Certbot costuma criar palestras-le-ssl.conf — desativa para não conflitar
for extra in /etc/apache2/sites-enabled/*; do
  base=$(basename "$extra")
  case "$base" in
    palestras.conf|000-default.conf) ;;
    *palestras*|*le-ssl*)
      a2dissite "$base" 2>/dev/null || true
      echo "==> Desativado: $base"
      ;;
  esac
done

a2ensite palestras.conf

echo "==> Testando Apache..."
apache2ctl configtest

systemctl reload apache2

echo "==> Sites ativos (deve haver apenas palestras.conf) ===="
apache2ctl -S 2>/dev/null | grep -E "palestras|443|80" || true
ls -la /etc/apache2/sites-enabled/

echo "==> Status Node..."
systemctl is-active palestras && curl -sI "http://127.0.0.1:3000/" | head -3 || {
  echo "AVISO: serviço palestras não responde na porta 3000"
  echo "       sudo systemctl restart palestras && sudo systemctl status palestras"
}

if [[ -d "$APP_DIR/.next/static/css" ]]; then
  CSS=$(find "$APP_DIR/.next/static/css" -maxdepth 1 -name '*.css' | head -1)
  if [[ -n "$CSS" ]]; then
    REL="static/css/$(basename "$CSS")"
    echo ""
    echo "==> Teste CSS /_next/$REL ===="
    curl -sI "http://127.0.0.1:3000/_next/$REL" | head -3
    curl -sIL "https://$SITE/_next/$REL" | head -5
  fi
fi

echo ""
echo "Pronto. Teste: https://$SITE/"
echo "No .env use: APP_URL=https://$SITE"
echo "Se CSS der 404 no HTTPS mas 200 no :3000, rode: sudo bash deploy/reparar-site.sh"
