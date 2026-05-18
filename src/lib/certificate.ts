import PDFDocument from "pdfkit";
import { getAppUrl } from "./utils";

export type CertificateData = {
  nome: string;
  cpf: string;
  tituloPalestra: string;
  dataPalestra: string;
  horario: string;
  cargaHoraria: number;
  local?: string | null;
  certificadoCodigo: string;
};

export async function generateCertificatePdf(
  data: CertificateData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width;
    const height = doc.page.height;

    doc
      .rect(30, 30, width - 60, height - 60)
      .lineWidth(3)
      .strokeColor("#1d4ed8")
      .stroke();

    doc
      .rect(38, 38, width - 76, height - 76)
      .lineWidth(1)
      .strokeColor("#93c5fd")
      .stroke();

    doc
      .fontSize(14)
      .fillColor("#1d4ed8")
      .text("CERTIFICADO DE PARTICIPAÇÃO", 0, 70, { align: "center" });

    doc
      .fontSize(11)
      .fillColor("#64748b")
      .text("Sistema de Palestras", 0, 95, { align: "center" });

    doc.moveDown(2);
    doc
      .fontSize(12)
      .fillColor("#334155")
      .text("Certificamos que", 0, 140, { align: "center" });

    doc
      .fontSize(28)
      .fillColor("#0f172a")
      .text(data.nome.toUpperCase(), 60, 175, {
        align: "center",
        width: width - 120,
      });

    doc
      .fontSize(12)
      .fillColor("#334155")
      .text(
        `CPF ${data.cpf}, participou da palestra`,
        60,
        230,
        { align: "center", width: width - 120 }
      );

    doc
      .fontSize(18)
      .fillColor("#1d4ed8")
      .text(`"${data.tituloPalestra}"`, 60, 255, {
        align: "center",
        width: width - 120,
      });

    const localText = data.local ? ` — ${data.local}` : "";
    doc
      .fontSize(11)
      .fillColor("#475569")
      .text(
        `Realizada em ${data.dataPalestra} às ${data.horario}${localText}, com carga horária de ${data.cargaHoraria} hora(s).`,
        60,
        295,
        { align: "center", width: width - 120 }
      );

    const validarUrl = `${getAppUrl()}/validar/${data.certificadoCodigo}`;
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .text(
        `Código de validação: ${data.certificadoCodigo}\nVerifique em: ${validarUrl}`,
        60,
        height - 120,
        { align: "center", width: width - 120 }
      );

    doc.end();
  });
}
