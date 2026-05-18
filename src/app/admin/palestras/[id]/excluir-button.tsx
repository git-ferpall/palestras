"use client";

import { useState, useTransition } from "react";
import { deletePalestraAction } from "@/lib/actions";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";

export function ExcluirPalestraButton({
  palestraId,
  titulo,
  totalInscritos,
}: {
  palestraId: string;
  titulo: string;
  totalInscritos: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirmar = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deletePalestraAction(palestraId);
        if (result?.error) {
          setError(result.error);
          return;
        }
      } catch {
        setError(
          "Erro inesperado ao excluir. Atualize a página e tente novamente."
        );
      }
    });
  };

  return (
    <>
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Excluir palestra
      </Button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Excluir palestra"
        description="Esta ação não pode ser desfeita."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={confirmar}
            >
              {pending ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
            <p className="font-semibold text-red-900">{titulo}</p>
            <p className="mt-1 text-sm text-red-800">
              {totalInscritos === 0
                ? "Nenhuma inscrição vinculada a esta palestra."
                : `${totalInscritos} inscrição(ões) serão removidas junto com a palestra.`}
            </p>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>A palestra será apagada do sistema</li>
            <li>Todas as inscrições e dados associados serão perdidos</li>
            <li>Links de inscrição e QR code deixarão de funcionar</li>
            <li>Certificados já emitidos não poderão mais ser validados por este evento</li>
          </ul>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
