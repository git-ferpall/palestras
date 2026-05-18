/**
 * Testa SMTP no servidor: node deploy/test-smtp.mjs
 * Rode em /var/www/palestras.abrarastro.org
 */
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const root = process.cwd();
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.argv[2] || user;

if (!host || !user || !pass) {
  console.error("Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env");
  process.exit(1);
}

const port = Number(process.env.SMTP_PORT ?? 587);
const secure =
  process.env.SMTP_SECURE === "true" ||
  (process.env.SMTP_SECURE !== "false" && port === 465);

console.log("Config:", { host, port, secure, user, to });

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: !secure && port === 587,
  auth: { user, pass },
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
  socketTimeout: 20_000,
  tls: {
    servername: host,
    minVersion: "TLSv1.2",
    ...(process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : {}),
  },
});

try {
  await transporter.verify();
  console.log("verify() OK — login SMTP aceito");

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to,
    subject: "Teste Palestras SMTP",
    text: "Se recebeu, o envio de certificados deve funcionar.",
  });

  console.log("E-mail de teste enviado:", info.messageId);
  console.log("Para:", to);
} catch (err) {
  console.error("FALHA:", err.message);
  if (port === 465) {
    console.error("\nTente no .env: SMTP_PORT=587 e SMTP_SECURE=false");
  } else {
    console.error("\nTente no .env: SMTP_PORT=465 e SMTP_SECURE=true");
  }
  process.exit(1);
}
