#!/bin/bash
# Atualiza build de produção (use após enviar código novo do PC).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Verificando código-fonte ==="
if grep -q pdfkit package.json 2>/dev/null; then
  echo "ERRO: package.json ainda lista pdfkit. Envie package.json do PC."
  exit 1
fi
if ! grep -q "pdf-lib" src/lib/certificate.ts; then
  echo "ERRO: src/lib/certificate.ts ainda não usa pdf-lib. Envie o arquivo do PC."
  exit 1
fi
if grep -q pdfkit src/lib/certificate.ts; then
  echo "ERRO: certificate.ts ainda importa pdfkit."
  exit 1
fi
echo "OK: fontes usam pdf-lib"

echo "=== npm install ==="
npm install

echo "=== Parando serviço e removendo build antigo ==="
sudo systemctl stop palestras || true
rm -rf .next

echo "=== prisma generate + next build ==="
npm run build
sudo chown -R www-data:www-data .next

echo "=== Reiniciando serviço ==="
sudo systemctl start palestras
sleep 2
sudo systemctl is-active palestras

echo "=== Teste rápido ==="
curl -sI "http://127.0.0.1:3000/api/certificado/cmpbekwdv0004qmokyxk1489t/pdf" | head -5
echo ""
echo "Se HTTP/1.1 200, o PDF está OK. Teste também pela URL pública."
