import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatCpf, formatDateBR } from "@/lib/utils";
import {
  ensureValidacaoHash,
  findInscricaoByCodigoOuHash,
} from "@/lib/inscricao-utils";
import { generateValidacaoHash } from "@/lib/certificate-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    const inscricao = await findInscricaoByCodigoOuHash(codigo);

    if (!inscricao) {
      return NextResponse.json(
        {
          error:
            "Código não encontrado. Use o link do e-mail ou o código longo do certificado.",
        },
        { status: 404 }
      );
    }

    if (inscricao.palestra.status !== "ENCERRADA") {
      return NextResponse.json(
        { error: "Certificado disponível após encerrar a palestra" },
        { status: 403 }
      );
    }

    let validacaoHash = inscricao.validacaoHash;
    try {
      validacaoHash = await ensureValidacaoHash(inscricao.id, validacaoHash);
    } catch {
      validacaoHash = inscricao.certificadoCodigo.slice(0, 16);
    }
    if (!validacaoHash) {
      validacaoHash = generateValidacaoHash();
    }

    const { generateCertificatePdf, buildCertificateData } = await import(
      "@/lib/certificate"
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

    if (!pdf || pdf.length < 100) {
      console.error("PDF vazio ou inválido");
      return NextResponse.json(
        { error: "Falha ao gerar PDF" },
        { status: 500 }
      );
    }

    const safeName = inscricao.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    const filename = `certificado-${safeName}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erro ao gerar certificado PDF:", err);
    return NextResponse.json(
      {
        error: "Erro interno ao gerar certificado",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
