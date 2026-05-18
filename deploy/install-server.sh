#!/bin/bash
# Executar NO SERVIDOR, dentro de /var/www/palestras.abrarastro.org
set -euo pipefail

APP_DIR="/var/www/palestras.abrarastro.org"
cd "$APP_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERRO: npm não encontrado. Instale o Node.js primeiro:"
  echo ""
  echo "  sudo ./deploy/install-node.sh"
  echo ""
  echo "Ou manualmente (Ubuntu/Debian):"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  echo ""
  exit 1
fi

echo "==> Node $(node -v) / npm $(npm -v)"

if [[ ! -f .env ]]; then
  echo "AVISO: arquivo .env não encontrado. Copie e edite:"
  echo "  cp .env.example .env && nano .env"
  echo ""
fi

echo "==> Instalando dependências..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  echo "    (package-lock.json ausente — usando npm install)"
  npm install
fi

echo "==> Configurando banco..."
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

echo "==> Build de produção..."
npm run build

echo "==> Ajustando permissões (SQLite)..."
mkdir -p prisma
chown -R www-data:www-data prisma .env 2>/dev/null || true

echo ""
echo "==> Concluído!"
echo "    sudo cp deploy/palestras.service /etc/systemd/system/"
echo "    sudo systemctl daemon-reload"
echo "    sudo systemctl enable --now palestras"
