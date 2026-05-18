/**
 * Preenche validacaoHash em inscrições antigas (após prisma db push).
 * Uso: npx tsx deploy/backfill-validacao-hash.ts
 */
import { PrismaClient } from "@prisma/client";
import { generateValidacaoHash } from "../src/lib/certificate-utils";

const prisma = new PrismaClient();

async function main() {
  const semHash = await prisma.inscricao.findMany({
    where: { validacaoHash: null },
  });

  console.log(`Inscrições sem hash: ${semHash.length}`);

  for (const row of semHash) {
    let hash = generateValidacaoHash();
    let tentativas = 0;
    while (tentativas < 5) {
      try {
        await prisma.inscricao.update({
          where: { id: row.id },
          data: { validacaoHash: hash },
        });
        console.log(`OK: ${row.nome} → ${hash}`);
        break;
      } catch {
        hash = generateValidacaoHash();
        tentativas++;
      }
    }
  }

  console.log("Concluído.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
