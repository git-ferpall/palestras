import { prisma } from "./db";
import { generateValidacaoHash } from "./certificate-utils";

export async function ensureValidacaoHash(
  inscricaoId: string,
  current: string | null | undefined
): Promise<string> {
  if (current) return current;
  const hash = generateValidacaoHash();
  await prisma.inscricao.update({
    where: { id: inscricaoId },
    data: { validacaoHash: hash },
  });
  return hash;
}

export async function findInscricaoByCodigoOuHash(codigo: string) {
  return prisma.inscricao.findFirst({
    where: {
      OR: [{ certificadoCodigo: codigo }, { validacaoHash: codigo }],
    },
    include: { palestra: true },
  });
}
