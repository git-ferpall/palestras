"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  requireAdmin,
  verifyPassword,
} from "./auth";
import { sendCertificateEmail } from "./email";
import {
  formatDateBR,
  isValidCpf,
  normalizeCpf,
  combineDateAndTime,
} from "./utils";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

const palestraSchema = z.object({
  titulo: z.string().min(3, "Título obrigatório"),
  descricao: z.string().optional(),
  local: z.string().optional(),
  data: z.string().min(1, "Data obrigatória"),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:MM)"),
  cargaHoraria: z.coerce.number().min(1).max(40),
  qrExpiraEm: z.string().min(1, "Informe quando o QR code expira"),
});

const inscricaoSchema = z.object({
  qrToken: z.string(),
  nome: z.string().min(3, "Nome obrigatório"),
  cpf: z.string().refine(isValidCpf, "CPF inválido"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
});

export type ActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin || !(await verifyPassword(parsed.data.password, admin.password))) {
    return { error: "E-mail ou senha incorretos" };
  }

  await createSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function createPalestraAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = palestraSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao") || undefined,
    local: formData.get("local") || undefined,
    data: formData.get("data"),
    horario: formData.get("horario"),
    cargaHoraria: formData.get("cargaHoraria"),
    qrExpiraEm: formData.get("qrExpiraEm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const data = new Date(parsed.data.data + "T12:00:00");
  const qrExpiraEm = new Date(parsed.data.qrExpiraEm);
  const inicioPalestra = combineDateAndTime(data, parsed.data.horario);

  if (qrExpiraEm <= new Date()) {
    return { error: "A expiração do QR code deve ser no futuro" };
  }

  if (qrExpiraEm < inicioPalestra) {
    return {
      error:
        "O QR code não pode expirar antes do início da palestra. Ajuste a data de expiração.",
    };
  }

  const qrToken = randomBytes(24).toString("hex");

  await prisma.palestra.create({
    data: {
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao,
      local: parsed.data.local,
      data,
      horario: parsed.data.horario,
      cargaHoraria: parsed.data.cargaHoraria,
      qrToken,
      qrExpiraEm,
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function encerrarPalestraAction(palestraId: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada" };
  }

  const palestra = await prisma.palestra.findUnique({
    where: { id: palestraId },
    include: { inscricoes: true },
  });

  if (!palestra) return { error: "Palestra não encontrada" };
  if (palestra.status === "ENCERRADA") {
    return { error: "Palestra já encerrada" };
  }

  await prisma.palestra.update({
    where: { id: palestraId },
    data: { status: "ENCERRADA" },
  });

  let enviados = 0;
  for (const inscricao of palestra.inscricoes) {
    await sendCertificateEmail({
      to: inscricao.email,
      nome: inscricao.nome,
      tituloPalestra: palestra.titulo,
      certificadoCodigo: inscricao.certificadoCodigo,
    });

    await prisma.inscricao.update({
      where: { id: inscricao.id },
      data: {
        certificadoEnviado: true,
        certificadoEnviadoEm: new Date(),
      },
    });
    enviados++;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/palestras/${palestraId}`);

  return {
    success: `Palestra encerrada. ${enviados} e-mail(s) de certificado enviado(s).`,
  };
}

export async function inscricaoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = inscricaoSchema.safeParse({
    qrToken: formData.get("qrToken"),
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const palestra = await prisma.palestra.findUnique({
    where: { qrToken: parsed.data.qrToken },
  });

  if (!palestra) {
    return { error: "Palestra não encontrada" };
  }

  if (palestra.status !== "AGENDADA") {
    return { error: "Esta palestra não aceita mais inscrições" };
  }

  if (new Date() > palestra.qrExpiraEm) {
    return {
      error: "O QR code expirou. Procure o organizador da palestra.",
    };
  }

  const cpf = normalizeCpf(parsed.data.cpf);

  try {
    await prisma.inscricao.create({
      data: {
        palestraId: palestra.id,
        nome: parsed.data.nome.trim(),
        cpf,
        email: parsed.data.email.trim().toLowerCase(),
        telefone: parsed.data.telefone.replace(/\D/g, ""),
      },
    });
  } catch {
    return { error: "Este CPF já está inscrito nesta palestra" };
  }

  return {
    success: `Inscrição confirmada na palestra "${palestra.titulo}" (${formatDateBR(palestra.data)} às ${palestra.horario}). Após o evento, você receberá o certificado por e-mail.`,
  };
}
