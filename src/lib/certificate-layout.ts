import fs from "fs";
import path from "path";
import type { PDFDocument, PDFPage, PDFFont, RGB } from "pdf-lib";
import { rgb } from "pdf-lib";
import { resolveLogoPath } from "./certificate-utils";
import { resolvePalestraAsset } from "./palestra-uploads";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "palestras");

function hexColor(hex: string): RGB {
  const n = hex.replace("#", "");
  return rgb(
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255
  );
}

export const CertColors = {
  green: hexColor("#1e5631"),
  greenDark: hexColor("#143d22"),
  greenLight: hexColor("#e8f3ec"),
  gold: hexColor("#c9a227"),
  yellow: hexColor("#f4c430"),
  /** Texto principal (estilo serif cinza do certificado) */
  ink: hexColor("#2d3748"),
  text: hexColor("#374151"),
  muted: hexColor("#6b7280"),
  faint: hexColor("#9ca3af"),
  white: rgb(1, 1, 1),
};

export function formatCargaHorasCertificado(h: number) {
  return h === 1 ? "(1 HORA)" : `(${h} HORAS)`;
}

export async function embedImageBytes(pdfDoc: PDFDocument, bytes: Buffer, filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(bytes);
  }
  if (lower.endsWith(".webp")) {
    console.warn(`WebP não suportado no PDF: ${filePath}. Use PNG ou JPG.`);
    return null;
  }
  return pdfDoc.embedPng(bytes);
}

export async function embedImageFromPath(pdfDoc: PDFDocument, filePath: string) {
  if (!fs.existsSync(filePath)) return null;
  const bytes = fs.readFileSync(filePath);
  try {
    return await embedImageBytes(pdfDoc, bytes, filePath);
  } catch (e) {
    console.warn(`Falha ao embutir imagem ${filePath}:`, e);
    return null;
  }
}

export async function embedPalestraAsset(
  pdfDoc: PDFDocument,
  storedPath: string | null | undefined
) {
  if (!storedPath?.trim()) return null;

  const abs = resolvePalestraAsset(storedPath);
  if (abs && fs.existsSync(abs)) {
    return embedImageFromPath(pdfDoc, abs);
  }

  const parts = storedPath.split("/").filter(Boolean);

  if (parts.length >= 2) {
    const dir = path.join(UPLOAD_ROOT, parts[0]);
    const fileName = parts[parts.length - 1]!;
    for (const name of [fileName, "logo.png", "logo.jpg", "logo.jpeg"]) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        return embedImageFromPath(pdfDoc, candidate);
      }
    }
  }

  if (parts.length === 1 && parts[0]!.startsWith("logo.")) {
    try {
      for (const id of fs.readdirSync(UPLOAD_ROOT)) {
        const candidate = path.join(UPLOAD_ROOT, id, parts[0]!);
        if (fs.existsSync(candidate)) {
          return embedImageFromPath(pdfDoc, candidate);
        }
      }
    } catch {
      /* pasta de uploads ainda não existe */
    }
  }

  return null;
}

export async function embedBrandLogo(pdfDoc: PDFDocument, baseName: string) {
  const p = resolveLogoPath(baseName);
  if (!p) return null;
  return embedImageFromPath(pdfDoc, p);
}

/** Moldura verde dupla com cantos decorativos (estilo certificado ABRARASTRO). */
export function drawClassicCertificateFrame(page: PDFPage) {
  const { width, height } = page.getSize();
  const m = 22;
  const inner = 28;

  page.drawRectangle({
    x: m,
    y: m,
    width: width - m * 2,
    height: height - m * 2,
    borderColor: CertColors.green,
    borderWidth: 2.5,
  });
  page.drawRectangle({
    x: inner,
    y: inner,
    width: width - inner * 2,
    height: height - inner * 2,
    borderColor: CertColors.green,
    borderWidth: 0.8,
  });

  const corner = 20;
  const corners: [number, number, number, number][] = [
    [m + 4, height - m - 4, 1, -1],
    [width - m - 4, height - m - 4, -1, -1],
    [m + 4, m + 4, 1, 1],
    [width - m - 4, m + 4, -1, 1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + corner * dx, y: cy },
      thickness: 1.5,
      color: CertColors.green,
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + corner * dy },
      thickness: 1.5,
      color: CertColors.green,
    });
  }

  const stripeX = m + 6;
  page.drawRectangle({
    x: stripeX,
    y: m + 8,
    width: 10,
    height: height - (m + 8) * 2,
    color: CertColors.green,
  });
  page.drawRectangle({
    x: stripeX + 10,
    y: m + 8,
    width: 4,
    height: height - (m + 8) * 2,
    color: CertColors.yellow,
  });
}

export async function drawAbrarastroWatermark(
  page: PDFPage,
  pdfDoc: PDFDocument
) {
  const img = await embedBrandLogo(pdfDoc, "abrarastro");
  if (!img) return;

  const { width, height } = page.getSize();
  const targetW = width * 0.62;
  const scale = targetW / img.width;
  const w = img.width * scale;
  const h = img.height * scale;

  page.drawImage(img, {
    x: (width - w) / 2,
    y: (height - h) / 2 - 12,
    width: w,
    height: h,
    opacity: 0.1,
  });
}

export function drawSignatureLine(
  page: PDFPage,
  centerX: number,
  lineWidth: number,
  baseY: number,
  label: string,
  font: PDFFont,
  fontBold: PDFFont
) {
  const lineY = baseY + 42;
  page.drawLine({
    start: { x: centerX - lineWidth / 2, y: lineY },
    end: { x: centerX + lineWidth / 2, y: lineY },
    thickness: 0.7,
    color: CertColors.muted,
  });
  const labelSize = 11;
  const lw = fontBold.widthOfTextAtSize(label, labelSize);
  page.drawText(label, {
    x: centerX - lw / 2,
    y: lineY - labelSize - 8,
    size: labelSize,
    font: fontBold,
    color: CertColors.text,
  });
}

/** Assinatura fixa em src/assinaturas ou public/assinaturas (ex.: presidencia.png). */
export function resolveAssinaturaFixaPath(baseName: string): string | null {
  const dirs = [
    path.join(process.cwd(), "src", "assinaturas"),
    path.join(process.cwd(), "public", "assinaturas"),
  ];
  const exts = [".png", ".jpg", ".jpeg"];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const ext of exts) {
      const candidate = path.join(dir, `${baseName}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }
    try {
      for (const file of fs.readdirSync(dir)) {
        const lower = file.toLowerCase();
        if (
          lower.startsWith(baseName.toLowerCase()) &&
          /\.(png|jpe?g)$/.test(lower)
        ) {
          return path.join(dir, file);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function resolvePresidenciaAssinaturaPath(): string | null {
  return resolveAssinaturaFixaPath("presidencia");
}

export async function drawSignatureWithImage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  centerX: number,
  lineWidth: number,
  baseY: number,
  label: string,
  imagePath: string | null | undefined,
  font: PDFFont,
  fontBold: PDFFont,
  /** true = imagePath é caminho absoluto no disco (assinatura fixa) */
  directFile = false
) {
  const lineY = baseY + 42;
  if (imagePath) {
    const abs = directFile
      ? fs.existsSync(imagePath)
        ? imagePath
        : null
      : resolvePalestraAsset(imagePath);
    const img = abs ? await embedImageFromPath(pdfDoc, abs) : null;
    if (img) {
      const sigH = 42;
      const scale = sigH / img.height;
      const w = Math.min(img.width * scale, lineWidth - 10);
      const h = img.height * (w / img.width);
      page.drawImage(img, {
        x: centerX - w / 2,
        y: lineY + 4,
        width: w,
        height: h,
      });
    }
  }
  drawSignatureLine(page, centerX, lineWidth, baseY, label, font, fontBold);
}
