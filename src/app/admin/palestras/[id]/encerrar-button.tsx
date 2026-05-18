"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { encerrarPalestraAction } from "@/lib/actions";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";

export function EncerrarPalestraButton({
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
  const router = useRouter();

  const confirmar = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await encerrarPalestraAction(palestraId);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setOpen(false);
        router.refresh();
        if (result?.success) {
          router.push(
            `/admin/palestras/${palestraId}?msg=${encodeURIComponent(result.success)}`
          );
        }
      } catch {
        setError(
          "Erro inesperado ao encerrar. Atualize a pagina e tente novamente."
        );
      }
    });
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Encerrar palestra e enviar certificados
      </Button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Encerrar palestra"
        description="Esta acao nao pode ser desfeita."
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
              {pending ? "Processando..." : "Confirmar encerramento"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="font-semibold text-amber-900">{titulo}</p>
            <p className="mt-1 text-sm text-amber-800">
              {totalInscritos === 0
                ? "Nenhum inscrito — a palestra sera marcada como encerrada."
                : `${totalInscritos} inscrito(s) receberao e-mail com link do certificado.`}
            </p>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>A palestra deixara de aceitar novas inscricoes</li>
            <li>O QR code de inscricao sera desativado</li>
            <li>Certificados ficam disponiveis para download e validacao</li>
            {totalInscritos > 0 && (
              <li>E-mails serao enviados automaticamente aos inscritos</li>
            )}
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
