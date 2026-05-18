/**
 * Corrige logoEventoPath e ministranteAssinaturaPath no banco
 * a partir dos arquivos em data/uploads/palestras/{id}/
 *
 * Uso no servidor: node scripts/fix-upload-paths.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uploadRoot = path.join(root, "data", "uploads", "palestras");

const prisma = new PrismaClient();

function findFile(dir, prefix) {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const p = path.join(dir, `${prefix}.${ext}`);
    if (fs.existsSync(p)) return `${prefix}.${ext}`;
  }
  return null;
}

async function main() {
  if (!fs.existsSync(uploadRoot)) {
    console.log("Nenhuma pasta data/uploads/palestras — nada a corrigir.");
    return;
  }

  const ids = fs.readdirSync(uploadRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (ids.length === 0) {
    console.log("Nenhuma palestra com uploads.");
    return;
  }

  for (const id of ids) {
    const dir = path.join(uploadRoot, id);
    const logoFile = findFile(dir, "logo");
    const assinaturaFile = findFile(dir, "assinatura");

    const palestra = await prisma.palestra.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        logoEventoPath: true,
        ministranteAssinaturaPath: true,
      },
    });

    if (!palestra) {
      console.warn(`Pasta ${id} sem palestra no banco — ignorando.`);
      continue;
    }

    const data = {};
    if (logoFile) {
      data.logoEventoPath = `${id}/${logoFile}`;
    }
    if (assinaturaFile) {
      data.ministranteAssinaturaPath = `${id}/${assinaturaFile}`;
    }

    if (Object.keys(data).length === 0) {
      console.log(`[${palestra.titulo}] sem arquivos de logo/assinatura`);
      continue;
    }

    await prisma.palestra.update({ where: { id }, data });
    console.log(`OK [${palestra.titulo}]`);
    if (data.logoEventoPath) {
      console.log(`   logo: ${data.logoEventoPath} (antes: ${palestra.logoEventoPath ?? "—"})`);
    }
    if (data.ministranteAssinaturaPath) {
      console.log(
        `   assinatura: ${data.ministranteAssinaturaPath} (antes: ${palestra.ministranteAssinaturaPath ?? "—"})`
      );
    }
  }

  console.log("\nPronto. Gere a prévia do certificado novamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
