"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import fs from "fs/promises";
import { z } from "zod";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "./auth";
import { sendCertificateEmail } from "./email";
import { generateValidacaoHash, temasToJson } from "./certificate-utils";
import {
  savePalestraAssinaturaFromDataUrl,
  savePalestraAssinaturaFromFile,
  savePalestraLogo,
  palestraUploadDir,
} from "./palestra-uploads";
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
  subtituloCertificado: z.string().optional(),
  descricao: z.string().optional(),
  ministranteNome: z.string().optional(),
  local: z.string().optional(),
  cidadeUf: z.string().optional(),
  data: z.string().min(1, "Data obrigatória"),
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:MM)"),
  cargaHoraria: z.coerce.number().min(1).max(40),
  temas: z.string().optional(),
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

const createAdminSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha com no mínimo 8 caracteres"),
});

export async function createAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = createAdminSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const exists = await prisma.admin.findUnique({ where: { email } });
  if (exists) {
    return { error: "Já existe um usuário com este e-mail" };
  }

  await prisma.admin.create({
    data: {
      nome: parsed.data.nome.trim(),
      email,
      password: await hashPassword(parsed.data.password),
    },
  });

  revalidatePath("/admin/usuarios");
  return { success: `Usuário ${parsed.data.nome} cadastrado com sucesso.` };
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

  const temasRaw = String(formData.get("temas") ?? "");
  const temasLines = temasRaw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const parsed = palestraSchema.safeParse({
    titulo: formData.get("titulo"),
    subtituloCertificado: formData.get("subtituloCertificado") || undefined,
    descricao: formData.get("descricao") || undefined,
    ministranteNome: formData.get("ministranteNome") || undefined,
    local: formData.get("local") || undefined,
    cidadeUf: formData.get("cidadeUf") || undefined,
    data: formData.get("data"),
    horario: formData.get("horario"),
    cargaHoraria: formData.get("cargaHoraria"),
    temas: temasRaw || undefined,
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

  const palestra = await prisma.palestra.create({
    data: {
      titulo: parsed.data.titulo,
      subtituloCertificado: parsed.data.subtituloCertificado,
      descricao: parsed.data.descricao,
      local: parsed.data.local,
      cidadeUf: parsed.data.cidadeUf,
      data,
      horario: parsed.data.horario,
      cargaHoraria: parsed.data.cargaHoraria,
      temas: temasLines.length > 0 ? temasToJson(temasLines) : null,
      ministranteNome: parsed.data.ministranteNome?.trim() || null,
      usarLogoAbrarastro: true,
      qrToken,
      qrExpiraEm,
    },
  });

  const logoFile = formData.get("logoEvento");
  const assinaturaFile = formData.get("assinaturaArquivo");
  const assinaturaDataUrl = String(formData.get("assinaturaDataUrl") ?? "");

  let logoEventoPath: string | undefined;
  let ministranteAssinaturaPath: string | undefined;

  try {
    if (logoFile instanceof File && logoFile.size > 0) {
      logoEventoPath = await savePalestraLogo(palestra.id, logoFile);
    }

    if (assinaturaFile instanceof File && assinaturaFile.size > 0) {
      ministranteAssinaturaPath = await savePalestraAssinaturaFromFile(
        palestra.id,
        assinaturaFile
      );
    } else if (assinaturaDataUrl.startsWith("data:image")) {
      ministranteAssinaturaPath = await savePalestraAssinaturaFromDataUrl(
        palestra.id,
        assinaturaDataUrl
      );
    }
  } catch {
    await prisma.palestra.delete({ where: { id: palestra.id } });
    return {
      error:
        "Palestra criada, mas falhou ao salvar logo ou assinatura. Tente novamente.",
    };
  }

  if (logoEventoPath || ministranteAssinaturaPath) {
    await prisma.palestra.update({
      where: { id: palestra.id },
      data: {
        ...(logoEventoPath ? { logoEventoPath } : {}),
        ...(ministranteAssinaturaPath ? { ministranteAssinaturaPath } : {}),
      },
    });
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function encerrarPalestraAction(
  palestraId: string
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  try {
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
    let falhas = 0;

    for (const inscricao of palestra.inscricoes) {
      const hash =
        inscricao.validacaoHash ?? generateValidacaoHash();
      if (!inscricao.validacaoHash) {
        await prisma.inscricao.update({
          where: { id: inscricao.id },
          data: { validacaoHash: hash },
        });
      }

      const emailResult = await sendCertificateEmail({
        to: inscricao.email,
        nome: inscricao.nome,
        tituloPalestra: palestra.titulo,
        certificadoCodigo: inscricao.certificadoCodigo,
        validacaoHash: hash,
      });

      if (emailResult.ok) {
        await prisma.inscricao.update({
          where: { id: inscricao.id },
          data: {
            certificadoEnviado: true,
            certificadoEnviadoEm: new Date(),
          },
        });
        enviados++;
      } else {
        falhas++;
        console.error(
          `Certificado não enviado para ${inscricao.email}: ${emailResult.error}`
        );
      }
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/palestras/${palestraId}`);

    if (palestra.inscricoes.length === 0) {
      return {
        success:
          "Palestra encerrada. Nenhum inscrito para receber certificado.",
      };
    }

    if (falhas > 0) {
      return {
        success: `Palestra encerrada. ${enviados} e-mail(s) enviado(s), ${falhas} falha(s). Verifique SMTP no .env ou envie o link do certificado manualmente.`,
      };
    }

    return {
      success: `Palestra encerrada. ${enviados} e-mail(s) de certificado enviado(s).`,
    };
  } catch (err) {
    console.error("encerrarPalestraAction:", err);
    return {
      error:
        "Erro ao encerrar a palestra. Confira os logs do servidor (journalctl -u palestras).",
    };
  }
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
        validacaoHash: generateValidacaoHash(),
      },
    });
  } catch {
    return { error: "Este CPF já está inscrito nesta palestra" };
  }

  return {
    success: `Inscrição confirmada na palestra "${palestra.titulo}" (${formatDateBR(palestra.data)} às ${palestra.horario}). Após o evento, você receberá o certificado por e-mail.`,
  };
}

export async function deletePalestraAction(
  palestraId: string
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const palestra = await prisma.palestra.findUnique({
    where: { id: palestraId },
    select: { id: true, titulo: true },
  });

  if (!palestra) {
    return { error: "Palestra não encontrada" };
  }

  await fs.rm(palestraUploadDir(palestraId), { recursive: true, force: true });
  await prisma.palestra.delete({ where: { id: palestraId } });

  revalidatePath("/admin");
  redirect(
    `/admin?msg=${encodeURIComponent(`Palestra "${palestra.titulo}" excluída.`)}`
  );
}
