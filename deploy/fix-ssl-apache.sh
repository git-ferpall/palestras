#!/bin/bash
# Corrige Apache após certbot: garante proxy HTTPS para Next.js
set -euo pipefail

SITE="palestras.abrarastro.org"
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
if [[ -f "$SSL_CONF" ]]; then
  a2dissite "$(basename "$SSL_CONF")" 2>/dev/null || true
  echo "==> Site extra $SSL_CONF desativado (usa palestras.conf unificado)"
fi

a2ensite palestras.conf

echo "==> Testando Apache..."
apache2ctl configtest

systemctl reload apache2

echo "==> Status Node..."
systemctl is-active palestras && curl -sI "http://127.0.0.1:3000/" | head -3 || {
  echo "AVISO: serviço palestras não responde na porta 3000"
  echo "       sudo systemctl restart palestras && sudo systemctl status palestras"
}

echo ""
echo "Pronto. Teste: https://$SITE/"
echo "No .env use: APP_URL=https://$SITE"
