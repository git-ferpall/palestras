import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateBR } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const palestra = await prisma.palestra.findUnique({
    where: { id },
    include: {
      inscricoes: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          cpf: true,
          email: true,
          telefone: true,
          certificadoEnviado: true,
          certificadoEnviadoEm: true,
          createdAt: true,
        },
      },
    },
  });

  if (!palestra) {
    return NextResponse.json({ error: "Palestra nao encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    palestra: {
      id: palestra.id,
      titulo: palestra.titulo,
      data: formatDateBR(palestra.data),
      horario: palestra.horario,
      local: palestra.local,
      status: palestra.status,
    },
    inscricoes: palestra.inscricoes,
  });
}
