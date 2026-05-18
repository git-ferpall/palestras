import nodemailer from "nodemailer";
import { getAppUrl } from "./utils";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });
}

export type SendEmailResult =
  | { ok: true; simulated: boolean }
  | { ok: false; error: string };

export async function sendCertificateEmail(params: {
  to: string;
  nome: string;
  tituloPalestra: string;
  certificadoCodigo: string;
}): Promise<SendEmailResult> {
  const appUrl = getAppUrl();
  const downloadUrl = `${appUrl}/certificado/${params.certificadoCodigo}`;
  const validarUrl = `${appUrl}/validar/${params.certificadoCodigo}`;

  const html = `
    <motionless>
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #1d4ed8;">Seu certificado está disponível</h2>
      <p>Olá, <strong>${params.nome}</strong>,</p>
      <p>Obrigado por participar da palestra <strong>${params.tituloPalestra}</strong>.</p>
      <p>Seu certificado já pode ser baixado:</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${downloadUrl}" style="background: #1d4ed8; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Baixar certificado
        </a>
      </p>
      <p style="font-size: 14px; color: #475569;">
        Código de validação: <strong>${params.certificadoCodigo}</strong><br/>
        Verifique a autenticidade em: <a href="${validarUrl}">${validarUrl}</a>
      </p>
    </motionless>
    </motionless>
  `.replace(/<motionless>|<\/motionless>/g, "");

  const text = `Olá ${params.nome},\n\nSeu certificado da palestra "${params.tituloPalestra}" está disponível:\n${downloadUrl}\n\nCódigo de validação: ${params.certificadoCodigo}\nValidar: ${validarUrl}`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log("\n--- E-mail simulado (SMTP não configurado) ---");
    console.log(`Para: ${params.to}`);
    console.log(text);
    console.log("---------------------------------------------\n");
    return { ok: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: params.to,
      subject: `Certificado — ${params.tituloPalestra}`,
      text,
      html,
    });
    return { ok: true, simulated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao enviar e-mail";
    console.error(`Erro SMTP para ${params.to}:`, err);
    return { ok: false, error: message };
  }
}
