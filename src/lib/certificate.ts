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

const A4: [number, number] = [595.28, 841.89];

function hex(hexColor: string): RGB {
  const n = hexColor.replace("#", "");
  return rgb(
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255
  );
}

const COLORS = {
  blue: hex("#1e3a8a"),
  teal: hex("#0d9488"),
  slate: hex("#334155"),
  muted: hex("#64748b"),
  white: rgb(1, 1, 1),
  rowAlt: rgb(0.945, 0.961, 0.976),
};

function topY(pageHeight: number, yFromTop: number, size = 12) {
  return pageHeight - yFromTop - size;
}

function drawBorder(page: PDFPage) {
  const { width, height } = page.getSize();
  const m = 28;
  page.drawRectangle({
    x: m,
    y: m,
    width: width - m * 2,
    height: height - m * 2,
    borderColor: COLORS.blue,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: m + 6,
    y: m + 6,
    width: width - (m + 6) * 2,
    height: height - (m + 6) * 2,
    borderColor: COLORS.teal,
    borderWidth: 0.8,
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

async function drawLogos(
  page: PDFPage,
  pdfDoc: PDFDocument,
  usarAbrarastro: boolean,
  usarFrutag: boolean
) {
  const { width, height } = page.getSize();
  const logoH = 48;

  if (usarAbrarastro) {
    try {
      const img = await embedLogo(pdfDoc, "abrarastro");
      if (img) {
        const scale = logoH / img.height;
        page.drawImage(img, {
          x: 50,
          y: topY(height, 42, logoH),
          width: img.width * scale,
          height: logoH,
        });
      }
    } catch (e) {
      console.warn("Logo abrarastro:", e);
    }
  }

  if (usarFrutag) {
    try {
      const img = await embedLogo(pdfDoc, "frutag");
      if (img) {
        const scale = logoH / img.height;
        const w = img.width * scale;
        page.drawImage(img, {
          x: width - 50 - w,
          y: topY(height, 42, logoH),
          width: w,
          height: logoH,
        });
      }
    } catch (e) {
      console.warn("Logo frutag:", e);
    }
  }
}

async function drawValidationQr(
  page: PDFPage,
  pdfDoc: PDFDocument,
  validacaoHash: string,
  x: number,
  yFromTop: number,
  font: PDFFont
) {
  const { height } = page.getSize();
  const url = `${getAppUrl()}/validar/${validacaoHash}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    width: 140,
    margin: 1,
    type: "png",
  });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 76;
  const y = topY(height, yFromTop, qrSize);
  page.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

  const hashText = formatValidacaoHashDisplay(validacaoHash);
  const hashSize = 7;
  const hashWidth = font.widthOfTextAtSize(hashText, hashSize);
  page.drawText(hashText, {
    x: x + (qrSize - hashWidth) / 2,
    y: y - 12,
    size: hashSize,
    font,
    color: COLORS.muted,
  });
}

function drawCentered(
  page: PDFPage,
  text: string,
  yFromTop: number,
  size: number,
  font: PDFFont,
  color: RGB
) {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: topY(height, yFromTop, size),
    size,
    font,
    color,
  });
}

function drawCenteredWrapped(
  page: PDFPage,
  text: string,
  yFromTop: number,
  size: number,
  font: PDFFont,
  color: RGB,
  maxWidth: number
) {
  const { width, height } = page.getSize();
  const words = text.split(" ");
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
  let y = yFromTop;
  for (const ln of lines) {
    const tw = font.widthOfTextAtSize(ln, size);
    page.drawText(ln, {
      x: (width - tw) / 2,
      y: topY(height, y, size),
      size,
      font,
      color,
    });
    y += size + 4;
  }
}

async function drawFrontPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  drawBorder(page);
  await drawLogos(page, pdfDoc, data.usarLogoAbrarastro, data.usarLogoFrutag);

  drawCentered(page, "CERTIFICADO DE PARTICIPAÇÃO", 108, 22, fontBold, COLORS.blue);

  if (data.subtituloCertificado) {
    drawCentered(page, data.subtituloCertificado, 138, 12, font, COLORS.teal);
  }

  const introY = data.subtituloCertificado ? 168 : 150;
  drawCenteredWrapped(
    page,
    "A Associação Brasileira de Rastreabilidade de Alimentos (ABRARASTRO) certifica que",
    introY,
    10,
    font,
    COLORS.slate,
    width - 100
  );

  drawCentered(page, data.nome.toUpperCase(), introY + 32, 20, fontBold, COLORS.blue);

  drawCenteredWrapped(
    page,
    `participou do treinamento "${data.tituloPalestra}", realizado em ${data.mesAno}, com carga horária total de ${data.cargaHoraria} hora(s).`,
    introY + 62,
    10,
    font,
    COLORS.slate,
    width - 120
  );

  const metaY = introY + 108;
  const cidade = data.cidadeUf || data.local || "—";
  page.drawText(`Local: ${cidade}`, {
    x: 70,
    y: topY(height, metaY, 9),
    size: 9,
    font,
    color: COLORS.muted,
  });
  page.drawText(`Data: ${data.dataPalestra}`, {
    x: 220,
    y: topY(height, metaY, 9),
    size: 9,
    font,
    color: COLORS.muted,
  });
  page.drawText(`Carga horária total: ${data.cargaHoraria}h`, {
    x: 370,
    y: topY(height, metaY, 9),
    size: 9,
    font,
    color: COLORS.muted,
  });

  drawCenteredWrapped(
    page,
    "Realização: ABRARASTRO — Associação Brasileira de Rastreabilidade de Alimentos",
    500,
    8,
    font,
    COLORS.muted,
    width - 100
  );

  if (data.usarLogoFrutag) {
    drawCentered(
      page,
      "Apoio técnico: Frutag — Rastreabilidade faz bem!",
      512,
      8,
      font,
      COLORS.muted
    );
  }
}

function drawBackPage(
  page: PDFPage,
  data: CertificateData,
  font: PDFFont,
  fontBold: PDFFont
) {
  const { width, height } = page.getSize();
  drawBorder(page);

  drawCentered(page, "CONTEÚDO PROGRAMÁTICO", 50, 18, fontBold, COLORS.blue);
  drawCentered(page, data.tituloPalestra, 78, 10, font, COLORS.teal);

  const tableLeft = 50;
  const colNumW = 36;
  const tableW = width - 100;
  const temaX = tableLeft + colNumW;
  const temaW = tableW - colNumW;
  let yFromTop = 108;

  page.drawRectangle({
    x: tableLeft,
    y: topY(height, yFromTop, 20),
    width: tableW,
    height: 20,
    color: COLORS.blue,
  });
  page.drawText("Nº", {
    x: tableLeft + 10,
    y: topY(height, yFromTop + 6, 9),
    size: 9,
    font: fontBold,
    color: COLORS.white,
  });
  page.drawText("Tema abordado", {
    x: temaX + 5,
    y: topY(height, yFromTop + 6, 9),
    size: 9,
    font: fontBold,
    color: COLORS.white,
  });

  yFromTop += 20;
  const temas =
    data.temas.length > 0 ? data.temas : ["Conteúdo conforme programação do evento"];

  temas.forEach((tema, i) => {
    const lines: string[] = [];
    const words = tema.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, 8) > temaW - 12 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const rowH = Math.max(20, lines.length * 10 + 8);

    if (i % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: topY(height, yFromTop, rowH),
        width: tableW,
        height: rowH,
        color: COLORS.rowAlt,
      });
    }

    page.drawText(String(i + 1), {
      x: tableLeft + 10,
      y: topY(height, yFromTop + 5, 8),
      size: 8,
      font,
      color: COLORS.slate,
    });

    let lineY = yFromTop + 5;
    for (const ln of lines) {
      page.drawText(ln, {
        x: temaX + 5,
        y: topY(height, lineY, 8),
        size: 8,
        font,
        color: COLORS.slate,
      });
      lineY += 10;
    }

    yFromTop += rowH;
  });

  page.drawRectangle({
    x: tableLeft,
    y: topY(height, yFromTop, 22),
    width: tableW,
    height: 22,
    color: COLORS.teal,
  });
  page.drawText(`Carga horária total: ${data.cargaHoraria} hora(s)`, {
    x: temaX + 5,
    y: topY(height, yFromTop + 6, 9),
    size: 9,
    font: fontBold,
    color: COLORS.white,
  });
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page1 = pdfDoc.addPage(A4);
  await drawFrontPage(page1, pdfDoc, data, font, fontBold);
  await drawValidationQr(page1, pdfDoc, data.validacaoHash, 477, 420, font);

  const page2 = pdfDoc.addPage(A4);
  drawBackPage(page2, data, font, fontBold);
  const h2 = page2.getSize().height;
  await drawValidationQr(page2, pdfDoc, data.validacaoHash, 477, h2 - 130, font);

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
