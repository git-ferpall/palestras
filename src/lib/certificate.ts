import fs from "fs";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFPage,
  type PDFFont,
  type RGB,
} from "pdf-lib";
import QRCode from "qrcode";
import { getAppUrl } from "./utils";
import {
  formatValidacaoHashDisplay,
  resolveLogoPath,
  parseTemasJson,
} from "./certificate-utils";
import {
  drawClassicCertificateFrame,
  drawAbrarastroWatermark,
  drawSignatureLine,
  drawSignatureWithImage,
  embedBrandLogo,
  embedPalestraAsset,
  CertColors,
  formatCargaHorasCertificado,
} from "./certificate-layout";

export type CertificateData = {
  nome: string;
  cpf: string;
  tituloPalestra: string;
  dataPalestra: string;
  horario: string;
  cargaHoraria: number;
  temas: string[];
  logoEventoPath?: string | null;
  ministranteNome?: string | null;
  ministranteAssinaturaPath?: string | null;
  validacaoHash: string;
};

/** A4 paisagem (largura × altura em pontos) */
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

/** pdf-lib: origem no canto inferior esquerdo (y sobe) */
const L = {
  left: 56,
  right: 56,
  bottom: 44,
  qrSize: 62,
  qrPad: 8,
  qrReserve: 138,
};

function hexColor(hex: string): RGB {
  const n = hex.replace("#", "");
  return rgb(
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255
  );
}

const C = {
  navy: hexColor("#0f2744"),
  blue: hexColor("#1e3a8a"),
  teal: hexColor("#0d6e6e"),
  gold: hexColor("#b8860b"),
  slate: hexColor("#1e293b"),
  muted: hexColor("#64748b"),
  faint: hexColor("#94a3b8"),
  white: rgb(1, 1, 1),
  paper: hexColor("#fafbfc"),
  rowAlt: rgb(0.96, 0.97, 0.99),
  band: hexColor("#0f2744"),
};

function yTop(pageHeight: number, fromTop: number, blockHeight = 12) {
  return pageHeight - fromTop - blockHeight;
}

function textCenterX(page: PDFPage, text: string, size: number, font: PDFFont) {
  const { width } = page.getSize();
  return (width - font.widthOfTextAtSize(text, size)) / 2;
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedCentered(
  page: PDFPage,
  text: string,
  fromTop: number,
  size: number,
  font: PDFFont,
  color: RGB,
  maxWidth: number,
  lineGap = 4
) {
  const { width, height } = page.getSize();
  let y = fromTop;
  for (const ln of wrapLines(text, font, size, maxWidth)) {
    const tw = font.widthOfTextAtSize(ln, size);
    page.drawText(ln, {
      x: (width - tw) / 2,
      y: yTop(height, y, size),
      size,
      font,
      color,
    });
    y += size + lineGap;
  }
  return y;
}

function drawCentered(
  page: PDFPage,
  text: string,
  fromTop: number,
  size: number,
  font: PDFFont,
  color: RGB
) {
  const { height } = page.getSize();
  page.drawText(text, {
    x: textCenterX(page, text, size, font),
    y: yTop(height, fromTop, size),
    size,
    font,
    color,
  });
}

function drawProfessionalFrame(page: PDFPage) {
  const { width, height } = page.getSize();
  const outer = 18;
  const inner = 26;
  const accent = 30;

  page.drawRectangle({
    x: outer,
    y: outer,
    width: width - outer * 2,
    height: height - outer * 2,
    borderColor: C.navy,
    borderWidth: 2.5,
  });
  page.drawRectangle({
    x: inner,
    y: inner,
    width: width - inner * 2,
    height: height - inner * 2,
    borderColor: C.gold,
    borderWidth: 0.75,
  });
  page.drawRectangle({
    x: accent,
    y: accent,
    width: width - accent * 2,
    height: height - accent * 2,
    borderColor: C.teal,
    borderWidth: 0.4,
  });

  const corner = 22;
  const pad = 24;
  const corners: [number, number, number, number][] = [
    [pad, height - pad, 1, -1],
    [width - pad, height - pad, -1, -1],
    [pad, pad, 1, 1],
    [width - pad, pad, -1, 1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + corner * dx, y: cy },
      thickness: 1.2,
      color: C.gold,
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + corner * dy },
      thickness: 1.2,
      color: C.gold,
    });
  }
}

function drawHeaderBand(page: PDFPage) {
  const { width, height } = page.getSize();
  const bandTop = 38;
  const bandH = 56;
  const y = yTop(height, bandTop, bandH);

  page.drawRectangle({
    x: 42,
    y,
    width: width - 84,
    height: bandH,
    color: C.band,
  });
  page.drawRectangle({
    x: 42,
    y,
    width: width - 84,
    height: 3,
    color: C.gold,
  });
}

async function embedLogo(pdfDoc: PDFDocument, baseName: string) {
  const p = resolveLogoPath(baseName);
  if (!p) {
    console.warn(
      `Logo não encontrada: ${baseName} (procure em public/logos/ ou src/logos/)`
    );
    return null;
  }
  const bytes = fs.readFileSync(p);
  const lower = p.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(bytes);
  }
  return pdfDoc.embedPng(bytes);
}

async function drawLogosInBand(
  page: PDFPage,
  pdfDoc: PDFDocument,
  usarFrutag: boolean,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  const bandTop = 38;
  const logoH = 40;
  const y = yTop(height, bandTop + 8, logoH);

  const abra = await embedLogo(pdfDoc, "abrarastro");
  if (abra) {
    const scale = logoH / abra.height;
    const w = abra.width * scale;
    page.drawImage(abra, { x: L.left, y, width: w, height: logoH });
  } else {
    page.drawText("ABRARASTRO", {
      x: L.left,
      y: y + 12,
      size: 11,
      font: fontBold,
      color: C.white,
    });
  }

  if (usarFrutag) {
    const img = await embedLogo(pdfDoc, "frutag");
    if (img) {
      const scale = logoH / img.height;
      const w = img.width * scale;
      const logoX = width - L.right - w;
      page.drawImage(img, { x: logoX, y, width: w, height: logoH });
    }
  }
}

/** Bloco de rodapé: linha + título + subtítulo centralizados. */
function drawFooterBlock(
  page: PDFPage,
  centerX: number,
  blockWidth: number,
  baseY: number,
  title: string,
  subtitle: string,
  font: PDFFont,
  fontBold: PDFFont,
  titleColor: RGB = C.navy,
  subtitleColor: RGB = C.slate
) {
  const titleSize = 11;
  const subtitleSize = 8;
  const lineY = baseY + 46;
  const lineHalf = blockWidth / 2;

  page.drawLine({
    start: { x: centerX - lineHalf, y: lineY },
    end: { x: centerX + lineHalf, y: lineY },
    thickness: 0.6,
    color: C.teal,
  });

  const titleW = fontBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: centerX - titleW / 2,
    y: lineY - titleSize - 6,
    size: titleSize,
    font: fontBold,
    color: titleColor,
  });

  const subLines = wrapLines(subtitle, font, subtitleSize, blockWidth - 16);
  let subY = lineY - titleSize - 6 - subtitleSize - 4;
  for (const ln of subLines) {
    const lnW = font.widthOfTextAtSize(ln, subtitleSize);
    page.drawText(ln, {
      x: centerX - lnW / 2,
      y: subY - subtitleSize,
      size: subtitleSize,
      font,
      color: subtitleColor,
    });
    subY -= subtitleSize + 3;
  }
}

function drawOrnamentLine(page: PDFPage, fromTop: number) {
  const { width, height } = page.getSize();
  const cx = width / 2;
  const y = yTop(height, fromTop, 1);
  const half = 140;

  page.drawLine({
    start: { x: cx - half, y },
    end: { x: cx - 18, y },
    thickness: 0.6,
    color: C.gold,
  });
  page.drawLine({
    start: { x: cx + 18, y },
    end: { x: cx + half, y },
    thickness: 0.6,
    color: C.gold,
  });
  page.drawCircle({
    x: cx,
    y,
    size: 3,
    color: C.gold,
  });
}

function drawMetaCard(
  page: PDFPage,
  x: number,
  fromTop: number,
  w: number,
  label: string,
  value: string,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { height } = page.getSize();
  const cardH = 44;
  const y = yTop(height, fromTop, cardH);

  page.drawRectangle({
    x,
    y,
    width: w,
    height: cardH,
    color: C.paper,
    borderColor: C.faint,
    borderWidth: 0.5,
  });
  page.drawRectangle({
    x,
    y: y + cardH - 3,
    width: w,
    height: 3,
    color: C.teal,
  });

  const labelSize = 7;
  const valueSize = 9;
  page.drawText(label.toUpperCase(), {
    x: x + 10,
    y: y + cardH - 16,
    size: labelSize,
    font: fontBold,
    color: C.muted,
  });
  const valLines = wrapLines(value, fontBold, valueSize, w - 20);
  let vy = y + cardH - 28;
  for (const ln of valLines.slice(0, 2)) {
    page.drawText(ln, {
      x: x + 10,
      y: vy,
      size: valueSize,
      font: fontBold,
      color: C.slate,
    });
    vy -= valueSize + 2;
  }
}

async function drawValidationBlock(
  page: PDFPage,
  pdfDoc: PDFDocument,
  validacaoHash: string,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width } = page.getSize();
  const qrSize = L.qrSize;
  const pad = L.qrPad;
  const labelH = 11;
  const hashH = 10;
  const blockW = qrSize + pad * 2;
  const blockH = qrSize + pad * 2 + labelH + hashH;
  const blockX = width - L.right - blockW;
  const blockY = L.bottom;

  page.drawRectangle({
    x: blockX,
    y: blockY,
    width: blockW,
    height: blockH,
    color: C.paper,
    borderColor: C.teal,
    borderWidth: 0.6,
  });

  const label = "VALIDAÇÃO";
  const labelSize = 7;
  page.drawText(label, {
    x:
      blockX +
      (blockW - fontBold.widthOfTextAtSize(label, labelSize)) / 2,
    y: blockY + blockH - labelH,
    size: labelSize,
    font: fontBold,
    color: C.teal,
  });

  const url = `${getAppUrl()}/validar/${validacaoHash}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    width: 160,
    margin: 1,
    type: "png",
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrX = blockX + pad;
  const qrY = blockY + pad + hashH;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const hashText = formatValidacaoHashDisplay(validacaoHash);
  const hashSize = 6.5;
  const hashW = font.widthOfTextAtSize(hashText, hashSize);
  page.drawText(hashText, {
    x: blockX + (blockW - hashW) / 2,
    y: blockY + 3,
    size: hashSize,
    font,
    color: C.muted,
  });
}

function estimateWrappedHeight(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineGap: number
) {
  const lines = wrapLines(text, font, size, maxWidth);
  return lines.length * (size + lineGap) - lineGap;
}

async function drawFrontPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  const contentW = width - L.left - L.right - 56;

  drawClassicCertificateFrame(page);
  await drawAbrarastroWatermark(page, pdfDoc);

  const logoH = 58;
  const logoY = yTop(height, 32, logoH);
  const abra = await embedBrandLogo(pdfDoc, "abrarastro");
  if (abra) {
    const scale = logoH / abra.height;
    const w = abra.width * scale;
    page.drawImage(abra, { x: L.left + 12, y: logoY, width: w, height: logoH });
  }

  const eventLogo = await embedPalestraAsset(pdfDoc, data.logoEventoPath);
  if (eventLogo) {
    const maxW = 165;
    const maxH = 72;
    const scale = Math.min(maxH / eventLogo.height, maxW / eventLogo.width);
    const w = eventLogo.width * scale;
    const h = eventLogo.height * scale;
    page.drawImage(eventLogo, {
      x: width - L.right - w - 12,
      y: logoY + (logoH - h) / 2,
      width: w,
      height: h,
    });
  }

  const sz = {
    tituloCert: 22,
    nome: 30,
    participou: 16,
    palestra: 18,
    data: 16,
  };

  const tituloLinha = `${data.tituloPalestra.toUpperCase()} ${formatCargaHorasCertificado(data.cargaHoraria)}`;
  const palestraH = estimateWrappedHeight(
    tituloLinha,
    fontBold,
    sz.palestra,
    contentW,
    6
  );

  const blockH =
    sz.tituloCert +
    20 +
    sz.nome +
    18 +
    sz.participou +
    16 +
    palestraH +
    16 +
    sz.data;

  const areaTop = 95;
  const areaBottom = height - 118;
  let y = areaTop + Math.max(0, (areaBottom - areaTop - blockH) / 2);

  drawCentered(page, "CERTIFICADO DE CONCLUSÃO", y, sz.tituloCert, fontBold, CertColors.greenDark);
  y += sz.tituloCert + 20;

  drawCentered(page, data.nome, y, sz.nome, fontBold, CertColors.text);
  y += sz.nome + 18;

  drawCentered(page, "Participou da Palestra", y, sz.participou, font, CertColors.muted);
  y += sz.participou + 16;

  y = drawWrappedCentered(
    page,
    tituloLinha,
    y,
    sz.palestra,
    fontBold,
    CertColors.greenDark,
    contentW,
    6
  );
  y += 16;

  drawCentered(page, data.dataPalestra, y, sz.data, font, CertColors.text);

  const sigBase = L.bottom + 8;
  const sigW = 220;
  const leftCx = L.left + 28 + sigW / 2;
  const rightCx = width - L.right - 28 - sigW / 2;

  drawSignatureLine(
    page,
    leftCx,
    sigW,
    sigBase,
    "DIRETORIA ABRARASTRO",
    font,
    fontBold
  );

  const ministranteLabel = data.ministranteNome?.trim() || "Ministrante";
  await drawSignatureWithImage(
    page,
    pdfDoc,
    rightCx,
    sigW,
    sigBase,
    ministranteLabel,
    data.ministranteAssinaturaPath,
    font,
    fontBold
  );
}

async function drawBackPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  drawClassicCertificateFrame(page);
  await drawAbrarastroWatermark(page, pdfDoc);

  let y = 48;
  const tableLeft = L.left + 8;
  page.drawText("Atividades ministradas:", {
    x: tableLeft,
    y: yTop(height, y, 12),
    size: 12,
    font: fontBold,
    color: CertColors.greenDark,
  });
  y += 18;
  const temaLines = wrapLines(data.tituloPalestra, font, 10, width - tableLeft - L.right - 20);
  for (const ln of temaLines.slice(0, 2)) {
    page.drawText(ln, {
      x: tableLeft,
      y: yTop(height, y, 10),
      size: 10,
      font,
      color: CertColors.muted,
    });
    y += 14;
  }
  y += 12;

  const tableW = width - tableLeft - L.right;
  const colNumW = 44;
  const temaX = tableLeft + colNumW;
  const temaW = tableW - colNumW;

  const headerRowH = 26;
  const footerRowH = 28;
  const qrBlockH = L.qrSize + L.qrPad * 2 + 24;
  const bodyEndY = height - L.bottom - qrBlockH - footerRowH - 10;

  page.drawRectangle({
    x: tableLeft,
    y: yTop(height, y, headerRowH),
    width: tableW,
    height: headerRowH,
    color: C.navy,
  });
  page.drawText("Nº", {
    x: tableLeft + 14,
    y: yTop(height, y + 8, 10),
    size: 10,
    font: fontBold,
    color: C.white,
  });
  page.drawText("TEMA ABORDADO", {
    x: temaX + 10,
    y: yTop(height, y + 8, 10),
    size: 10,
    font: fontBold,
    color: C.white,
  });
  y += headerRowH;

  const temas =
    data.temas.length > 0 ? data.temas : ["Conteúdo conforme programação do evento"];

  const bodyHeight = Math.max(60, bodyEndY - y);
  const rowH = Math.max(36, bodyHeight / temas.length);
  const fontSize = 10;
  const lineGap = 12;

  for (let i = 0; i < temas.length; i++) {
    const lines = wrapLines(temas[i], font, fontSize, temaW - 20);
    const textH = lines.length * lineGap;
    const padTop = Math.max(8, (rowH - textH) / 2);

    if (i % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: yTop(height, y, rowH),
        width: tableW,
        height: rowH,
        color: C.rowAlt,
      });
    }

    page.drawRectangle({
      x: tableLeft,
      y: yTop(height, y, rowH),
      width: tableW,
      height: rowH,
      borderColor: C.faint,
      borderWidth: 0.4,
    });

    page.drawText(String(i + 1).padStart(2, "0"), {
      x: tableLeft + 14,
      y: yTop(height, y + padTop + fontSize - 2, fontSize),
      size: fontSize,
      font: fontBold,
      color: C.teal,
    });

    let lineY = y + padTop;
    for (const ln of lines) {
      page.drawText(ln, {
        x: temaX + 10,
        y: yTop(height, lineY, fontSize),
        size: fontSize,
        font,
        color: C.slate,
      });
      lineY += lineGap;
    }
    y += rowH;
  }

  const footerY = bodyEndY;
  page.drawRectangle({
    x: tableLeft,
    y: yTop(height, footerY, footerRowH),
    width: tableW,
    height: footerRowH,
    color: C.teal,
  });
  page.drawText(
    `Carga horária total: ${data.cargaHoraria} hora(s)  •  Horário: ${data.horario}`,
    {
      x: temaX + 10,
      y: yTop(height, footerY + 9, 10),
      size: 10,
      font: fontBold,
      color: C.white,
    }
  );
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page1 = pdfDoc.addPage(A4_LANDSCAPE);
  await drawFrontPage(page1, pdfDoc, data, font, fontBold);

  const page2 = pdfDoc.addPage(A4_LANDSCAPE);
  await drawBackPage(page2, pdfDoc, data, font, fontBold);
  await drawValidationBlock(page2, pdfDoc, data.validacaoHash, font, fontBold);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

type PalestraCert = {
  titulo: string;
  data: Date;
  horario: string;
  cargaHoraria: number;
  temas?: string | null;
  logoEventoPath?: string | null;
  ministranteNome?: string | null;
  ministranteAssinaturaPath?: string | null;
};

export function buildCertificateData(
  inscricao: { nome: string; cpf: string },
  palestra: PalestraCert,
  validacaoHash: string,
  formatDateBR: (d: Date) => string,
  _formatCpf: (c: string) => string
): CertificateData {
  return {
    nome: inscricao.nome,
    cpf: _formatCpf(inscricao.cpf),
    tituloPalestra: palestra.titulo,
    dataPalestra: formatDateBR(palestra.data),
    horario: palestra.horario,
    cargaHoraria: palestra.cargaHoraria,
    temas: parseTemasJson(palestra.temas ?? null),
    logoEventoPath: palestra.logoEventoPath ?? null,
    ministranteNome: palestra.ministranteNome ?? null,
    ministranteAssinaturaPath: palestra.ministranteAssinaturaPath ?? null,
    validacaoHash,
  };
}
