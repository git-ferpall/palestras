import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

export function generateValidacaoHash() {
  return randomBytes(8).toString("hex");
}

export function formatValidacaoHashDisplay(hash: string) {
  const h = hash.toUpperCase();
  return h.match(/.{1,4}/g)?.join("-") ?? h;
}

export function parseTemasJson(temas: string | null | undefined): string[] {
  if (!temas?.trim()) return [];
  try {
    const parsed = JSON.parse(temas) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((t) => t.trim()).filter(Boolean);
    }
  } catch {
    /* linhas de texto */
  }
  return temas
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function temasToJson(lines: string[]): string {
  return JSON.stringify(lines);
}

export function resolveLogoPath(baseName: string): string | null {
  const dir = path.join(process.cwd(), "src", "logos");
  for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
    const filePath = path.join(dir, `${baseName}${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

export function formatMonthYearBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
