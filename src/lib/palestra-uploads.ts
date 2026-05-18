import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "palestras");

export function palestraUploadDir(palestraId: string) {
  return path.join(UPLOAD_ROOT, palestraId);
}

export function resolvePalestraAsset(storedPath: string | null | undefined) {
  if (!storedPath?.trim()) return null;
  const abs = path.join(UPLOAD_ROOT, storedPath);
  return abs;
}

function extFromFile(file: File) {
  const fromName = file.name.match(/\.(png|jpe?g|webp)$/i)?.[1];
  if (fromName) return fromName.toLowerCase() === "jpeg" ? "jpg" : fromName.toLowerCase();
  const t = file.type;
  if (t.includes("jpeg")) return "jpg";
  if (t.includes("webp")) return "webp";
  return "png";
}

export async function savePalestraLogo(
  palestraId: string,
  file: File
): Promise<string> {
  const ext = extFromFile(file);
  const dir = palestraUploadDir(palestraId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `logo.${ext}`;
  const abs = path.join(dir, fileName);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);
  return `${palestraId}/${fileName}`;
}

export async function savePalestraAssinaturaFromFile(
  palestraId: string,
  file: File
): Promise<string> {
  const ext = extFromFile(file);
  const dir = palestraUploadDir(palestraId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `assinatura.${ext}`;
  const abs = path.join(dir, fileName);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);
  return `${palestraId}/${fileName}`;
}

export async function savePalestraAssinaturaFromDataUrl(
  palestraId: string,
  dataUrl: string
): Promise<string> {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!match) throw new Error("Formato de assinatura inválido");
  const ext = match[1] === "jpeg" ? "jpg" : match[1].toLowerCase();
  const dir = palestraUploadDir(palestraId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `assinatura.${ext}`;
  const abs = path.join(dir, fileName);
  await fs.writeFile(abs, Buffer.from(match[2], "base64"));
  return `${palestraId}/${fileName}`;
}
