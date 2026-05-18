/**
 * Testa geração de PDF no servidor: npx tsx deploy/test-pdf.mjs cmpbekwdv0004qmokyxk1489t
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const codigo = process.argv[2];
if (!codigo) {
  console.error("Uso: npx tsx deploy/test-pdf.mjs CODIGO_CERTIFICADO_OU_HASH");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const inscricao = await prisma.inscricao.findFirst({
    where: {
      OR: [{ certificadoCodigo: codigo }, { validacaoHash: codigo }],
    },
    include: { palestra: true },
  });

  if (!inscricao) {
    console.error("Inscrição não encontrada");
    process.exit(1);
  }

  console.log("OK:", inscricao.nome, inscricao.palestra.status);

  const { generateCertificatePdf, buildCertificateData } = await import(
    "../src/lib/certificate.ts"
  );
  const { formatDateBR, formatCpf } = await import("../src/lib/utils.ts");

  const hash = inscricao.validacaoHash ?? codigo;
  const pdf = await generateCertificatePdf(
    buildCertificateData(
      inscricao,
      inscricao.palestra,
      hash,
      formatDateBR,
      formatCpf
    )
  );

  const out = path.join(process.cwd(), "/tmp/test-certificado.pdf");
  fs.writeFileSync(out, pdf);
  console.log("PDF gerado:", out, pdf.length, "bytes");
}

main()
  .catch((e) => {
    console.error("ERRO:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
