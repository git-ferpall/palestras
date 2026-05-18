/**
 * Diagnóstico completo do PDF no servidor:
 * npx tsx deploy/diagnose-pdf.mjs cmpbekwdv0004qmokyxk1489t
 */
import fs from "fs";

const codigo = process.argv[2] || "cmpbekwdv0004qmokyxk1489t";

console.log("=== 1. pdf-lib instalado? ===");
try {
  await import("pdf-lib");
  console.log("OK: pdf-lib encontrado");
} catch (e) {
  console.error("FALHA: npm install pdf-lib");
  console.error(e.message);
  process.exit(1);
}

console.log("\n=== 2. certificate.ts usa pdf-lib? ===");
const certSrc = fs.readFileSync("src/lib/certificate.ts", "utf8");
if (certSrc.includes("pdf-lib")) {
  console.log("OK: src/lib/certificate.ts usa pdf-lib");
} else if (certSrc.includes("pdfkit")) {
  console.error("FALHA: ainda usa pdfkit — envie certificate.ts novo do PC");
  process.exit(1);
}

console.log("\n=== 3. Prisma / inscrição ===");
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const inscricao = await prisma.inscricao.findFirst({
    where: {
      OR: [{ certificadoCodigo: codigo }, { validacaoHash: codigo }],
    },
    include: { palestra: true },
  });

  if (!inscricao) {
    console.error("FALHA: inscrição não encontrada");
    process.exit(1);
  }
  console.log("OK:", inscricao.nome, "| palestra:", inscricao.palestra.status);

  console.log("\n=== 4. Gerar PDF ===");
  const { generateCertificatePdf, buildCertificateData } = await import(
    "../src/lib/certificate.ts"
  );
  const { formatDateBR, formatCpf } = await import("../src/lib/utils.ts");

  const hash = inscricao.validacaoHash || codigo;
  const pdf = await generateCertificatePdf(
    buildCertificateData(
      inscricao,
      inscricao.palestra,
      hash,
      formatDateBR,
      formatCpf
    )
  );

  const out = "/tmp/diagnose-certificado.pdf";
  fs.writeFileSync(out, pdf);
  console.log("OK: PDF gerado", out, "|", pdf.length, "bytes");
} catch (e) {
  console.error("FALHA ao gerar:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

console.log("\n=== Tudo OK — rode npm run build && systemctl restart palestras ===");
