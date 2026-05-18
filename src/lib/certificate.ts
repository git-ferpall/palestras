import PDFDocument from "pdfkit";
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

const COLORS = {
  blue: "#1e3a8a",
  teal: "#0d9488",
  slate: "#334155",
  muted: "#64748b",
};

type PdfDoc = InstanceType<typeof PDFDocument>;

function drawBorder(doc: PdfDoc) {
  const m = 28;
  const w = doc.page.width - m * 2;
  const h = doc.page.height - m * 2;
  doc.rect(m, m, w, h).lineWidth(2).strokeColor(COLORS.blue).stroke();
  doc
    .rect(m + 6, m + 6, w - 12, h - 12)
    .lineWidth(0.8)
    .strokeColor(COLORS.teal)
    .stroke();
}

function drawLogos(doc: PdfDoc, usarAbrarastro: boolean, usarFrutag: boolean) {
  const y = 42;
  const logoH = 48;

  if (usarAbrarastro) {
    const p = resolveLogoPath("abrarastro");
    if (p) doc.image(p, 50, y, { height: logoH });
  }

  if (usarFrutag) {
    const p = resolveLogoPath("frutag");
    if (p) doc.image(p, doc.page.width - 150, y, { height: logoH });
  }
}

async function drawValidationQr(
  doc: PdfDoc,
  validacaoHash: string,
  x: number,
  y: number
) {
  const url = `${getAppUrl()}/validar/${validacaoHash}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    width: 140,
    margin: 1,
    type: "png",
  });
  doc.image(qrBuffer, x, y, { width: 76, height: 76 });
  doc
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text(formatValidacaoHashDisplay(validacaoHash), x - 8, y + 78, {
      width: 92,
      align: "center",
    });
  doc.fontSize(6).text("Validação", x, y + 88, { width: 92, align: "center" });
}

function drawFrontPage(doc: PdfDoc, data: CertificateData) {
  drawBorder(doc);
  drawLogos(doc, data.usarLogoAbrarastro, data.usarLogoFrutag);

  const w = doc.page.width - 100;

  doc
    .fontSize(22)
    .fillColor(COLORS.blue)
    .text("CERTIFICADO DE PARTICIPAÇÃO", 50, 108, { align: "center", width: w });

  if (data.subtituloCertificado) {
    doc
      .fontSize(12)
      .fillColor(COLORS.teal)
      .text(data.subtituloCertificado, 50, 138, { align: "center", width: w });
  }

  const introY = data.subtituloCertificado ? 168 : 150;
  doc
    .fontSize(10)
    .fillColor(COLORS.slate)
    .text(
      "A Associação Brasileira de Rastreabilidade de Alimentos (ABRARASTRO) certifica que",
      50,
      introY,
      { align: "center", width: w }
    );

  doc
    .fontSize(20)
    .fillColor(COLORS.blue)
    .text(data.nome.toUpperCase(), 50, introY + 28, { align: "center", width: w });

  doc
    .fontSize(10)
    .fillColor(COLORS.slate)
    .text(
      `participou do treinamento "${data.tituloPalestra}", realizado em ${data.mesAno}, com carga horária total de ${data.cargaHoraria} hora(s).`,
      60,
      introY + 62,
      { align: "center", width: w - 20 }
    );

  const metaY = introY + 108;
  const cidade = data.cidadeUf || data.local || "—";
  doc.fontSize(9).fillColor(COLORS.muted);
  doc.text(`Local: ${cidade}`, 70, metaY);
  doc.text(`Data: ${data.dataPalestra}`, 220, metaY);
  doc.text(`Carga horária total: ${data.cargaHoraria} hora(s)`, 370, metaY);

  doc
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(
      "Realização: ABRARASTRO — Associação Brasileira de Rastreabilidade de Alimentos",
      50,
      500,
      { align: "center", width: w }
    );

  if (data.usarLogoFrutag) {
    doc.text("Apoio técnico: Frutag — Rastreabilidade faz bem!", 50, 512, {
      align: "center",
      width: w,
    });
  }
}

function drawBackPage(doc: PdfDoc, data: CertificateData) {
  doc.addPage({
    size: "A4",
    layout: "portrait",
    margins: { top: 28, bottom: 28, left: 28, right: 28 },
  });
  drawBorder(doc);

  const w = doc.page.width - 100;
  doc
    .fontSize(18)
    .fillColor(COLORS.blue)
    .text("CONTEÚDO PROGRAMÁTICO", 50, 50, { align: "center", width: w });

  doc
    .fontSize(10)
    .fillColor(COLORS.teal)
    .text(data.tituloPalestra, 50, 78, { align: "center", width: w });

  const tableTop = 108;
  const colMod = 50;
  const colTema = 95;
  const colWMod = 36;
  const colWTema = doc.page.width - 145;

  doc.rect(colMod, tableTop, colWMod + colWTema, 20).fill(COLORS.blue);
  doc.fillColor("#fff").fontSize(9);
  doc.text("Nº", colMod + 10, tableTop + 5);
  doc.text("Tema abordado", colTema, tableTop + 5);

  let rowY = tableTop + 20;
  const temas =
    data.temas.length > 0 ? data.temas : ["Conteúdo conforme programação do evento"];

  temas.forEach((tema, i) => {
    const rowH = Math.max(20, doc.heightOfString(tema, { width: colWTema - 12 }) + 8);
    if (i % 2 === 0) {
      doc.rect(colMod, rowY, colWMod + colWTema, rowH).fill("#f1f5f9");
    }
    doc.fillColor(COLORS.slate).fontSize(8);
    doc.text(String(i + 1), colMod + 10, rowY + 5);
    doc.text(tema, colTema, rowY + 5, { width: colWTema - 12 });
    rowY += rowH;
  });

  doc.rect(colMod, rowY, colWMod + colWTema, 22).fill(COLORS.teal);
  doc
    .fillColor("#fff")
    .fontSize(9)
    .text(`Carga horária total: ${data.cargaHoraria} hora(s)`, colTema, rowY + 6);
}

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 28, bottom: 28, left: 28, right: 28 },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  drawFrontPage(doc, data);
  await drawValidationQr(doc, data.validacaoHash, doc.page.width - 118, 420);
  drawBackPage(doc, data);
  await drawValidationQr(
    doc,
    data.validacaoHash,
    doc.page.width - 118,
    doc.page.height - 130
  );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export function buildCertificateData(
  inscricao: { nome: string; cpf: string },
  palestra: {
    titulo: string;
    subtituloCertificado: string | null;
    data: Date;
    horario: string;
    cargaHoraria: number;
    local: string | null;
    cidadeUf: string | null;
    temas: string | null;
    usarLogoAbrarastro: boolean;
    usarLogoFrutag: boolean;
  },
  validacaoHash: string,
  formatDateBR: (d: Date) => string,
  formatCpf: (c: string) => string
): CertificateData {
  return {
    nome: inscricao.nome,
    cpf: formatCpf(inscricao.cpf),
    tituloPalestra: palestra.titulo,
    subtituloCertificado: palestra.subtituloCertificado,
    dataPalestra: formatDateBR(palestra.data),
    horario: palestra.horario,
    mesAno: formatMonthYearBR(palestra.data),
    cargaHoraria: palestra.cargaHoraria,
    local: palestra.local,
    cidadeUf: palestra.cidadeUf,
    temas: parseTemasJson(palestra.temas),
    usarLogoAbrarastro: palestra.usarLogoAbrarastro,
    usarLogoFrutag: palestra.usarLogoFrutag,
    validacaoHash,
  };
}
