import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { resolveLogoPath } from "@/lib/certificate-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["abrarastro", "frutag"]);

function contentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function resolvePublicLogo(name: string): string | null {
  const file =
    name === "abrarastro" ? "abrarastro.png" : name === "frutag" ? "frutag.png" : null;
  if (!file) return null;
  const p = path.join(process.cwd(), "public", "logos", file);
  return fs.existsSync(p) ? p : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!ALLOWED.has(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = resolvePublicLogo(name) ?? resolveLogoPath(name);
  if (!filePath) {
    return new NextResponse("Logo not found", { status: 404 });
  }

  const body = fs.readFileSync(filePath);
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType(filePath),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
