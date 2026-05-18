import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/certificate";
import { formatCpf, formatDateBR } from "@/lib/utils";

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

  const pdf = await generateCertificatePdf({
    nome: inscricao.nome,
    cpf: formatCpf(inscricao.cpf),
    tituloPalestra: inscricao.palestra.titulo,
    dataPalestra: formatDateBR(inscricao.palestra.data),
    horario: inscricao.palestra.horario,
    cargaHoraria: inscricao.palestra.cargaHoraria,
    local: inscricao.palestra.local,
    certificadoCodigo: inscricao.certificadoCodigo,
  });

  const filename = `certificado-${inscricao.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
