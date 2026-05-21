"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateInscricaoEmailAction } from "@/lib/actions";
import { Modal } from "@/components/modal";
import { Button, Input, Label } from "@/components/ui";

export function EditarEmailInscricao({
  inscricaoId,
  email,
  nome,
  onUpdated,
}: {
  inscricaoId: string;
  email: string;
  nome: string;
  /** Callback no modal de inscritos (atualiza lista local) */
  onUpdated?: (novoEmail: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(email);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (open) setValue(email);
  }, [open, email]);

  const salvar = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateInscricaoEmailAction(inscricaoId, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      const novo = value.trim().toLowerCase();
      onUpdated?.(novo);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="break-all text-slate-700">{email}</span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="w-fit text-left text-xs font-medium text-blue-600 hover:underline"
        >
          Editar e-mail
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Editar e-mail do inscrito"
        description={nome}
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
            <Button type="button" disabled={pending} onClick={salvar}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Novo e-mail</Label>
            <Input
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500">
            Ao alterar o e-mail, o envio do certificado volta para pendente. Se a
            palestra já foi encerrada, use &quot;Reenviar e-mail&quot; depois de
            salvar.
          </p>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
