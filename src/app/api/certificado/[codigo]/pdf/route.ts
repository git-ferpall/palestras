import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateCertificatePdf,
  buildCertificateData,
} from "@/lib/certificate";
import { formatCpf, formatDateBR } from "@/lib/utils";
import { ensureValidacaoHash } from "@/lib/inscricao-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;

  const inscricao = await prisma.inscricao.findUnique({
    where: { certificadoCodigo: codigo },
    include: { palestra: true },
  });

  if (!inscricao || inscricao.palestra.status !== "ENCERRADA") {
    return NextResponse.json(
      { error: "Certificado indisponível" },
      { status: 404 }
    );
  }

  const validacaoHash = await ensureValidacaoHash(
    inscricao.id,
    inscricao.validacaoHash
  );

  const pdf = await generateCertificatePdf(
    buildCertificateData(
      inscricao,
      inscricao.palestra,
      validacaoHash,
      formatDateBR,
      formatCpf
    )
  );

  const filename = `certificado-${inscricao.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
