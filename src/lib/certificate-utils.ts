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

/** Nomes de arquivo aceitos por marca (ordem de prioridade). */
const LOGO_ALIASES: Record<string, string[]> = {
  abrarastro: [
    "abrarastro",
    "logo-abrarastro-vertical",
    "logo-abrarastro",
    "abrarastro-vertical",
  ],
  frutag: ["frutag", "logo-frutag"],
};

function logoSearchDirs(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, "public", "logos"),
    path.join(cwd, "src", "logos"),
    path.join(cwd, "src"),
    path.join(cwd, "logos"),
  ];
}

function isImageFile(fileName: string) {
  const lower = fileName.toLowerCase();
  return LOGO_EXTS.some((ext) => lower.endsWith(ext));
}

/** Localiza arquivo de logo (abrarastro, frutag, etc.) em várias pastas. */
export function resolveLogoPath(baseName: string): string | null {
  const key = baseName.toLowerCase();
  const names = [
    ...(LOGO_ALIASES[key] ?? []),
    key,
    key.charAt(0).toUpperCase() + key.slice(1),
  ];

  for (const dir of logoSearchDirs()) {
    if (!fs.existsSync(dir)) continue;

    for (const name of names) {
      for (const ext of LOGO_EXTS) {
        const filePath = path.join(dir, `${name}${ext}`);
        if (fs.existsSync(filePath)) return filePath;
      }
    }

    try {
      const matches: string[] = [];
      for (const file of fs.readdirSync(dir)) {
        if (!isImageFile(file)) continue;
        const lower = file.toLowerCase();
        if (lower.includes(key)) matches.push(file);
      }
      if (matches.length > 0) {
        matches.sort((a, b) => a.length - b.length);
        return path.join(dir, matches[0]);
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

/** Modelo editável no cadastro da palestra e no certificado quando o campo está vazio. */
export const TEXTO_DECLARACAO_CERTIFICADO_PADRAO =
  'participou com aproveitamento do treinamento "{titulo}", realizado em {mesAno}, na data de {data}, com carga horária total de {cargaHoraria} hora(s).';

export type DeclaracaoPlaceholders = {
  nome: string;
  cpf: string;
  tituloPalestra: string;
  dataPalestra: string;
  mesAno: string;
  horario: string;
  cargaHoraria: number;
};

export function applyDeclaracaoPlaceholders(
  template: string,
  data: DeclaracaoPlaceholders
): string {
  return template
    .replace(/\{nome\}/gi, data.nome)
    .replace(/\{cpf\}/gi, data.cpf)
    .replace(/\{titulo\}/gi, data.tituloPalestra)
    .replace(/\{data\}/gi, data.dataPalestra)
    .replace(/\{mesAno\}/gi, data.mesAno)
    .replace(/\{horario\}/gi, data.horario)
    .replace(/\{cargaHoraria\}/gi, String(data.cargaHoraria))
    .replace(/\{carga\}/gi, String(data.cargaHoraria));
}
