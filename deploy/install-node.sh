#!/bin/bash
# Instala Node.js 20 LTS no Ubuntu/Debian (EC2, etc.)
# Uso: sudo ./deploy/install-node.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute com sudo: sudo ./deploy/install-node.sh"
  exit 1
fi

if command -v node >/dev/null 2>&1; then
  echo "Node já instalado: $(node -v) / npm $(npm -v)"
  exit 0
fi

echo "==> Instalando Node.js 20 LTS (NodeSource)..."

apt-get update
apt-get install -y ca-certificates curl gnupg

mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list

apt-get update
apt-get install -y nodejs

echo ""
echo "Instalado com sucesso:"
node -v
npm -v
