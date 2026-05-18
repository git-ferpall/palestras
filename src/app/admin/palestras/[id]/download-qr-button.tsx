"use client";

import { Button } from "@/components/ui";

function safeFilename(titulo: string) {
  return (
    titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 60) || "palestra"
  );
}

export function DownloadQrButton({
  dataUrl,
  titulo,
}: {
  dataUrl: string;
  titulo: string;
}) {
  const filename = `qr-inscricao-${safeFilename(titulo)}.png`;

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.click();
      }}
    >
      Baixar QR code (PNG)
    </Button>
  );
}
