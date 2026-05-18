import QRCode from "qrcode";
import { getAppUrl } from "./utils";

export function getInscricaoUrl(qrToken: string) {
  return `${getAppUrl()}/inscricao/${qrToken}`;
}

export async function generateQrCodeDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
