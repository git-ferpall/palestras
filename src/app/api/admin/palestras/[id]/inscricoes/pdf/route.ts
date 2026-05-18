import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateInscricoesListPdf } from "@/lib/inscricoes-list-pdf";
import { formatDateBR } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(titulo: string) {
  return (
    titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 50) || "palestra"
  );
}

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
          nome: true,
          cpf: true,
          email: true,
          telefone: true,
          certificadoEnviado: true,
        },
      },
    },
  });

  if (!palestra) {
    return NextResponse.json({ error: "Palestra nao encontrada" }, { status: 404 });
  }

  const pdf = await generateInscricoesListPdf({
    tituloPalestra: palestra.titulo,
    dataEvento: formatDateBR(palestra.data),
    horario: palestra.horario,
    local: palestra.local,
    inscricoes: palestra.inscricoes,
  });

  const filename = `inscritos-${safeFilename(palestra.titulo)}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
