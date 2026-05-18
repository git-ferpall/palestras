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
  formatMonthYearBR,
} from "./certificate-utils";

export type CertificateData = {
  nome: string;
  cpf: string;
  tituloPalestra: string;
  subtituloCertificado?: string | null;
  dataPalestra: string;
  horario: string;
  mesAno: string;
  cargaHoraria: number;
  local?: string | null;
  cidadeUf?: string | null;
  temas: string[];
  usarLogoAbrarastro: boolean;
  usarLogoFrutag: boolean;
  validacaoHash: string;
};

/** A4 paisagem (largura × altura em pontos) */
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

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
  if (!p) return null;
  const bytes = fs.readFileSync(p);
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(bytes);
  }
  return pdfDoc.embedPng(bytes);
}

async function drawLogosInBand(
  page: PDFPage,
  pdfDoc: PDFDocument,
  usarAbrarastro: boolean,
  usarFrutag: boolean
) {
  const { width, height } = page.getSize();
  const bandTop = 38;
  const logoH = 40;
  const y = yTop(height, bandTop + 8, logoH);

  const drawOne = async (base: string, x: number) => {
    try {
      const img = await embedLogo(pdfDoc, base);
      if (!img) return;
      const scale = logoH / img.height;
      const w = img.width * scale;
      page.drawImage(img, { x, y, width: w, height: logoH });
    } catch (e) {
      console.warn(`Logo ${base}:`, e);
    }
  };

  if (usarAbrarastro) await drawOne("abrarastro", 56);
  if (usarFrutag) {
    const img = await embedLogo(pdfDoc, "frutag");
    if (img) {
      const scale = logoH / img.height;
      const w = img.width * scale;
      page.drawImage(img, { x: width - 56 - w, y, width: w, height: logoH });
    }
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
  const { width, height } = page.getSize();
  const qrSize = 68;
  const x = width - 52 - qrSize;
  const fromTop = height - 52 - qrSize;
  const y = yTop(height, fromTop, qrSize);

  page.drawRectangle({
    x: x - 8,
    y: y - 28,
    width: qrSize + 16,
    height: qrSize + 36,
    color: C.paper,
    borderColor: C.faint,
    borderWidth: 0.5,
  });

  const url = `${getAppUrl()}/validar/${validacaoHash}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    width: 160,
    margin: 1,
    type: "png",
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

  const label = "VALIDAÇÃO";
  const labelSize = 7;
  page.drawText(label, {
    x: x + (qrSize - fontBold.widthOfTextAtSize(label, labelSize)) / 2,
    y: y + qrSize + 6,
    size: labelSize,
    font: fontBold,
    color: C.teal,
  });

  const hashText = formatValidacaoHashDisplay(validacaoHash);
  const hashSize = 6;
  const hashW = font.widthOfTextAtSize(hashText, hashSize);
  page.drawText(hashText, {
    x: x + (qrSize - hashW) / 2,
    y: y - 10,
    size: hashSize,
    font,
    color: C.muted,
  });
}

async function drawFrontPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  const contentW = width - 200;

  drawProfessionalFrame(page);
  drawHeaderBand(page);
  await drawLogosInBand(page, pdfDoc, data.usarLogoAbrarastro, data.usarLogoFrutag);

  let y = 108;
  drawCentered(page, "CERTIFICADO", y, 28, fontBold, C.navy);
  y += 32;
  drawCentered(page, "DE PARTICIPAÇÃO", y, 14, fontBold, C.teal);
  y += 22;
  drawOrnamentLine(page, y);
  y += 16;

  if (data.subtituloCertificado) {
    drawCentered(page, data.subtituloCertificado.toUpperCase(), y, 10, font, C.gold);
    y += 18;
  }

  y = drawWrappedCentered(
    page,
    "A Associação Brasileira de Rastreabilidade de Alimentos (ABRARASTRO) certifica que",
    y,
    10,
    font,
    C.muted,
    contentW
  );
  y += 8;

  drawCentered(page, data.nome.toUpperCase(), y, 22, fontBold, C.navy);
  y += 30;
  drawCentered(page, `CPF: ${data.cpf}`, y, 9, font, C.faint);
  y += 20;

  y = drawWrappedCentered(
    page,
    `participou com aproveitamento do treinamento "${data.tituloPalestra}", realizado em ${data.mesAno}, na data de ${data.dataPalestra}, com carga horária total de ${data.cargaHoraria} hora(s).`,
    y,
    10,
    font,
    C.slate,
    contentW + 40
  );
  y += 12;

  const cardW = (width - 120 - 32) / 3;
  const cardX0 = 60;
  const cidade = data.cidadeUf || data.local || "—";
  drawMetaCard(page, cardX0, y, cardW, "Local", cidade, font, fontBold);
  drawMetaCard(
    page,
    cardX0 + cardW + 16,
    y,
    cardW,
    "Data",
    data.dataPalestra,
    font,
    fontBold
  );
  drawMetaCard(
    page,
    cardX0 + (cardW + 16) * 2,
    y,
    cardW,
    "Carga horária",
    `${data.cargaHoraria} hora(s)`,
    font,
    fontBold
  );

  const footerY = height - 72;
  page.drawLine({
    start: { x: 60, y: footerY },
    end: { x: 280, y: footerY },
    thickness: 0.5,
    color: C.faint,
  });
  page.drawText("ABRARASTRO", {
    x: 60,
    y: footerY - 14,
    size: 9,
    font: fontBold,
    color: C.navy,
  });
  page.drawText(
    "Associação Brasileira de Rastreabilidade de Alimentos",
    {
      x: 60,
      y: footerY - 26,
      size: 7,
      font,
      color: C.muted,
    }
  );

  if (data.usarLogoFrutag) {
    page.drawText("Apoio técnico: Frutag — Rastreabilidade faz bem!", {
      x: 60,
      y: footerY - 40,
      size: 7,
      font,
      color: C.faint,
    });
  }

  await drawValidationBlock(page, pdfDoc, data.validacaoHash, font, fontBold);
}

function drawBackPage(
  page: PDFPage,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  drawProfessionalFrame(page);

  let y = 52;
  drawCentered(page, "CONTEÚDO PROGRAMÁTICO", y, 20, fontBold, C.navy);
  y += 26;
  drawOrnamentLine(page, y);
  y += 14;
  drawCentered(page, data.tituloPalestra, y, 11, font, C.teal);
  y += 22;

  const tableLeft = 52;
  const tableW = width - 104;
  const colNumW = 40;
  const temaX = tableLeft + colNumW;
  const temaW = tableW - colNumW;
  const maxTableBottom = height - 100;

  page.drawRectangle({
    x: tableLeft,
    y: yTop(height, y, 22),
    width: tableW,
    height: 22,
    color: C.navy,
  });
  page.drawText("Nº", {
    x: tableLeft + 12,
    y: yTop(height, y + 7, 9),
    size: 9,
    font: fontBold,
    color: C.white,
  });
  page.drawText("TEMA ABORDADO", {
    x: temaX + 8,
    y: yTop(height, y + 7, 9),
    size: 9,
    font: fontBold,
    color: C.white,
  });
  y += 22;

  const temas =
    data.temas.length > 0 ? data.temas : ["Conteúdo conforme programação do evento"];

  for (let i = 0; i < temas.length; i++) {
    const lines = wrapLines(temas[i], font, 9, temaW - 16);
    const rowH = Math.max(22, lines.length * 11 + 10);

    if (y + rowH > maxTableBottom - 30) break;

    if (i % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: yTop(height, y, rowH),
        width: tableW,
        height: rowH,
        color: C.rowAlt,
      });
    }

    page.drawText(String(i + 1).padStart(2, "0"), {
      x: tableLeft + 12,
      y: yTop(height, y + 6, 9),
      size: 9,
      font: fontBold,
      color: C.teal,
    });

    let lineY = y + 6;
    for (const ln of lines) {
      page.drawText(ln, {
        x: temaX + 8,
        y: yTop(height, lineY, 9),
        size: 9,
        font,
        color: C.slate,
      });
      lineY += 11;
    }
    y += rowH;
  }

  page.drawRectangle({
    x: tableLeft,
    y: yTop(height, y, 24),
    width: tableW,
    height: 24,
    color: C.teal,
  });
  page.drawText(
    `Carga horária total: ${data.cargaHoraria} hora(s)  •  Horário: ${data.horario}`,
    {
      x: temaX + 8,
      y: yTop(height, y + 8, 9),
      size: 9,
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
  drawBackPage(page2, data, font, fontBold);
  await drawValidationBlock(page2, pdfDoc, data.validacaoHash, font, fontBold);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

type PalestraCert = {
  titulo: string;
  subtituloCertificado?: string | null;
  data: Date;
  horario: string;
  cargaHoraria: number;
  local?: string | null;
  cidadeUf?: string | null;
  temas?: string | null;
  usarLogoAbrarastro?: boolean;
  usarLogoFrutag?: boolean;
};

export function buildCertificateData(
  inscricao: { nome: string; cpf: string },
  palestra: PalestraCert,
  validacaoHash: string,
  formatDateBR: (d: Date) => string,
  formatCpf: (c: string) => string
): CertificateData {
  return {
    nome: inscricao.nome,
    cpf: formatCpf(inscricao.cpf),
    tituloPalestra: palestra.titulo,
    subtituloCertificado: palestra.subtituloCertificado ?? null,
    dataPalestra: formatDateBR(palestra.data),
    horario: palestra.horario,
    mesAno: formatMonthYearBR(palestra.data),
    cargaHoraria: palestra.cargaHoraria,
    local: palestra.local ?? null,
    cidadeUf: palestra.cidadeUf ?? null,
    temas: parseTemasJson(palestra.temas ?? null),
    usarLogoAbrarastro: Boolean(palestra.usarLogoAbrarastro),
    usarLogoFrutag: Boolean(palestra.usarLogoFrutag),
    validacaoHash,
  };
}
