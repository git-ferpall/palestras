#!/bin/bash
# Atualiza email.ts (SMTP 465) e remove standalone do next.config
set -euo pipefail
cd /var/www/palestras.abrarastro.org

curl -fsSL -o src/lib/email.ts "https://raw.githubusercontent.com/placeholder" 2>/dev/null || true

# Patch mínimo se o arquivo antigo existir
if grep -q 'secure: false' src/lib/email.ts 2>/dev/null; then
  sed -i 's/secure: false/secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT ?? 587) === 465/' src/lib/email.ts || \
  python3 << 'PY'
from pathlib import Path
p = Path("src/lib/email.ts")
text = p.read_text()
old = """  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });"""
new = """  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });"""
if old in text:
    p.write_text(text.replace(old, new))
    print("email.ts patched")
else:
    print("email.ts already updated or format unknown")
PY
fi

sed -i '/output: "standalone",/d' next.config.ts 2>/dev/null || true

npm run build
systemctl restart palestras
grep -n "secure" src/lib/email.ts | head -3
