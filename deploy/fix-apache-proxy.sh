#!/bin/bash
# Corrige Apache: proxy para Next.js em vez do index.html estático
set -euo pipefail

SITE="palestras.abrarastro.org"
APP_DIR="/var/www/palestras.abrarastro.org"
CONF="/etc/apache2/sites-available/palestras.conf"

a2enmod proxy proxy_http ssl rewrite headers 2>/dev/null || true

# Evita que o Apache sirva index.html estático
if [[ -f "$APP_DIR/index.html" && ! -f "$APP_DIR/index.html.bak" ]]; then
  mv "$APP_DIR/index.html" "$APP_DIR/index.html.bak"
  echo "index.html renomeado para index.html.bak"
fi

cat > "$CONF" << EOF
<VirtualHost *:80>
    ServerName $SITE
    RewriteEngine On
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $SITE
    DocumentRoot $APP_DIR

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/$SITE/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$SITE/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"

    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog \${APACHE_LOG_DIR}/palestras_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/palestras_ssl_access.log combined
</VirtualHost>
EOF

# Desativa vhost duplicado do certbot (se existir)
for f in /etc/apache2/sites-enabled/*; do
  base=$(basename "$f")
  if [[ "$base" == *le-ssl* ]] || [[ "$base" == *palestras* && "$base" != "palestras.conf" ]]; then
    a2dissite "$base" 2>/dev/null || true
  fi
done

a2ensite palestras.conf
apache2ctl configtest
systemctl reload apache2

echo ""
echo "Teste:"
curl -sI "https://$SITE/" | head -5
echo ""
echo "Deve mostrar headers do Next.js (x-powered-by: Next.js), não só text/html estático."
