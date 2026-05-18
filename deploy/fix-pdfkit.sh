#!/bin/bash
# Corrige fontes PDFKit após deploy
set -euo pipefail
cd /var/www/palestras.abrarastro.org

if [[ ! -f node_modules/pdfkit/js/data/Helvetica.afm ]]; then
  echo "Instalando pdfkit..."
  npm install pdfkit
fi

echo "Fontes OK:"
ls node_modules/pdfkit/js/data/Helvetica.afm

grep -q 'serverExternalPackages' next.config.ts && echo "next.config: serverExternalPackages OK" || echo "AVISO: adicione serverExternalPackages: ['pdfkit'] no next.config.ts"

grep -q 'createRequire' src/lib/certificate.ts && echo "certificate.ts: createRequire OK" || echo "AVISO: atualize src/lib/certificate.ts do repositório"

npm run build
systemctl restart palestras
echo "Pronto. Teste:"
echo 'curl -I "https://palestras.abrarastro.org/api/certificado/SEU_CODIGO/pdf"'
