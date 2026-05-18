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

const LOGO_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function logoSearchDirs(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "public", "logos"),
    path.join(cwd, "src", "logos"),
    path.join(cwd, "src"),
    path.join(cwd, "logos"),
  ];
}

/** Localiza arquivo de logo (abrarastro, frutag, etc.) em várias pastas. */
export function resolveLogoPath(baseName: string): string | null {
  const key = baseName.toLowerCase();
  const variants = [
    baseName,
    key,
    key.charAt(0).toUpperCase() + key.slice(1),
    key.toUpperCase(),
  ];

  for (const dir of logoSearchDirs()) {
    if (!fs.existsSync(dir)) continue;

    for (const name of variants) {
      for (const ext of LOGO_EXTS) {
        const filePath = path.join(dir, `${name}${ext}`);
        if (fs.existsSync(filePath)) return filePath;
      }
    }

    try {
      for (const file of fs.readdirSync(dir)) {
        if (!LOGO_EXTS.some((ext) => file.toLowerCase().endsWith(ext))) continue;
        if (file.toLowerCase().includes(key)) {
          return path.join(dir, file);
        }
      }
    } catch {
      /* ignore */
    }
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
