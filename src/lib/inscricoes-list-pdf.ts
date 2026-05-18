import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCpf, formatPhone } from "./utils";

export type InscricaoListRow = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  certificadoEnviado: boolean;
};

export type InscricaoListPdfData = {
  tituloPalestra: string;
  dataEvento: string;
  horario: string;
  local?: string | null;
  inscricoes: InscricaoListRow[];
};

const NAVY = rgb(0.059, 0.153, 0.267);
const TEAL = rgb(0.051, 0.431, 0.431);
const MUTED = rgb(0.392, 0.455, 0.545);
const ROW_ALT = rgb(0.96, 0.97, 0.99);

export async function generateInscricoesListPdf(
  data: InscricaoListPdfData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const landscape: [number, number] = [841.89, 595.28];
  const margin = 40;
  const pageWidth = landscape[0];
  const pageHeight = landscape[1];

  let page = pdf.addPage(landscape);
  let y = pageHeight - margin;

  const drawTitle = (text: string, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, {
      x: margin,
      y: y - size,
      size,
      font: f,
      color: NAVY,
    });
    y -= size + 10;
  };

  drawTitle("ABRARASTRO — Lista de inscritos", 14, true);
  drawTitle(data.tituloPalestra, 12, true);
  page.drawText(
    `${data.dataEvento} as ${data.horario}${data.local ? ` — ${data.local}` : ""}`,
    { x: margin, y: y - 10, size: 10, font, color: MUTED }
  );
  y -= 28;
  page.drawText(`Total: ${data.inscricoes.length} inscrito(s)`, {
    x: margin,
    y: y - 10,
    size: 9,
    font: fontBold,
    color: TEAL,
  });
  y -= 24;

  const cols = [
    { label: "#", w: 28, key: "num" as const },
    { label: "Nome", w: 165, key: "nome" as const },
    { label: "CPF", w: 95, key: "cpf" as const },
    { label: "E-mail", w: 175, key: "email" as const },
    { label: "Telefone", w: 85, key: "tel" as const },
    { label: "Cert.", w: 42, key: "cert" as const },
  ];

  const headerH = 20;
  const drawRow = (
    values: string[],
    rowH: number,
    header = false,
    alt = false
  ) => {
    if (y - rowH < margin + 30) {
      page = pdf.addPage(landscape);
      y = pageHeight - margin;
    }

    let x = margin;
    if (header) {
      page.drawRectangle({
        x: margin,
        y: y - rowH,
        width: pageWidth - margin * 2,
        height: rowH,
        color: NAVY,
      });
    } else if (alt) {
      page.drawRectangle({
        x: margin,
        y: y - rowH,
        width: pageWidth - margin * 2,
        height: rowH,
        color: ROW_ALT,
      });
    }

    for (let i = 0; i < cols.length; i++) {
      const text = values[i] ?? "";
      const size = header ? 8 : 7.5;
      const f = header ? fontBold : font;
      const color = header ? rgb(1, 1, 1) : rgb(0.2, 0.25, 0.33);
      const maxW = cols[i].w - 6;
      let display = text;
      while (f.widthOfTextAtSize(display, size) > maxW && display.length > 3) {
        display = display.slice(0, -2);
      }
      if (display !== text && !header) display += "…";
      page.drawText(display, {
        x: x + 4,
        y: y - rowH + (rowH - size) / 2,
        size,
        font: f,
        color,
      });
      x += cols[i].w;
    }
    y -= rowH;
  };

  drawRow(
    cols.map((c) => c.label),
    headerH,
    true
  );

  data.inscricoes.forEach((ins, i) => {
    drawRow(
      [
        String(i + 1),
        ins.nome,
        formatCpf(ins.cpf),
        ins.email,
        formatPhone(ins.telefone),
        ins.certificadoEnviado ? "Sim" : "Nao",
      ],
      18,
      false,
      i % 2 === 0
    );
  });

  const footerY = 24;
  page.drawText(
    `Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
    {
      x: margin,
      y: footerY,
      size: 7,
      font,
      color: MUTED,
    }
  );

  return pdf.save();
}
