import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateCertificatePdf,
  buildCertificateData,
} from "@/lib/certificate";
import { generateValidacaoHash } from "@/lib/certificate-utils";
import { formatCpf, formatDateBR } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CPF valido apenas para visualizacao de exemplo */
const CPF_EXEMPLO = "52998224725";

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
      inscricoes: { orderBy: { nome: "asc" }, take: 1 },
    },
  });

  if (!palestra) {
    return NextResponse.json({ error: "Palestra nao encontrada" }, { status: 404 });
  }

  const inscricao = palestra.inscricoes[0] ?? {
    nome: "Participante Exemplo",
    cpf: CPF_EXEMPLO,
  };

  const pdf = await generateCertificatePdf(
    buildCertificateData(
      inscricao,
      palestra,
      generateValidacaoHash(),
      formatDateBR,
      formatCpf
    )
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview-certificado.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
