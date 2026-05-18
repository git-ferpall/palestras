"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";

export function PreviewCertificadoButton({ palestraId }: { palestraId: string }) {
  const [open, setOpen] = useState(false);
  const previewUrl = `/api/admin/palestras/${palestraId}/certificado-preview/pdf`;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Previa do certificado
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Previa do certificado"
        description="Visualizacao com dados de exemplo (ou do primeiro inscrito, se houver)."
        size="xl"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button">Abrir em nova aba</Button>
            </a>
            <a href={previewUrl} download="preview-certificado.pdf">
              <Button type="button">Baixar PDF</Button>
            </a>
          </>
        }
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          <iframe
            src={open ? previewUrl : undefined}
            title="Previa do certificado PDF"
            className="h-[min(70vh,520px)] w-full bg-white"
          />
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          O QR de validacao na previa e apenas demonstrativo.
        </p>
      </Modal>
    </>
  );
}
