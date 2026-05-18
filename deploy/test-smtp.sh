#!/bin/bash
# Testa conexão SMTP a partir do servidor (EC2)
set -euo pipefail
HOST="${SMTP_HOST:-mail.abrarastro.org}"

echo "==> DNS"
getent hosts "$HOST" || host "$HOST"

echo ""
echo "==> Porta 587"
timeout 5 bash -c "echo >/dev/tcp/$HOST/587" && echo "587 OK" || echo "587 FALHOU"

echo ""
echo "==> Porta 465"
timeout 5 bash -c "echo >/dev/tcp/$HOST/465" && echo "465 OK" || echo "465 FALHOU"

echo ""
echo "==> SSL 465 (openssl)"
echo | timeout 8 openssl s_client -connect "$HOST:465" -servername "$HOST" 2>&1 | head -15
