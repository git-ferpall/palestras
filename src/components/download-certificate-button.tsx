"use client";

import { Button } from "@/components/ui";

export function DownloadCertificateButton({
  codigo,
  nome,
}: {
  codigo: string;
  nome: string;
}) {
  const safeName = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const url = `/api/certificado/${encodeURIComponent(codigo)}/pdf`;

  return (
    <a
      href={url}
      download={`certificado-${safeName}.pdf`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button type="button">Baixar PDF</Button>
    </a>
  );
}
