#!/bin/bash
# Executar NO SERVIDOR, dentro de /var/www/palestras.abrarastro.org
set -euo pipefail

cd /var/www/palestras.abrarastro.org

echo "==> Instalando dependências..."
npm ci

echo "==> Configurando banco..."
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

echo "==> Build de produção..."
npm run build

echo "==> Ajustando permissões (SQLite)..."
mkdir -p prisma
chown -R www-data:www-data prisma .env 2>/dev/null || true

echo "==> Concluído. Inicie: sudo systemctl enable --now palestras"
