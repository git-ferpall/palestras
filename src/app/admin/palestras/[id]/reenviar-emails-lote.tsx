"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reenviarCertificadosLoteAction } from "@/lib/actions";
import { Button, Alert } from "@/components/ui";

export function ReenviarEmailsLote({
  palestraId,
  totalPendentes,
  totalInscritos,
}: {
  palestraId: string;
  totalPendentes: number;
  totalInscritos: number;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  const enviar = (modo: "pendentes" | "todos") => {
    setMessage(null);
    startTransition(async () => {
      const result = await reenviarCertificadosLoteAction(palestraId, modo);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: result.success ?? "Concluído" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending || totalPendentes === 0}
          onClick={() => enviar("pendentes")}
        >
          {pending ? "Enviando..." : `Reenviar pendentes (${totalPendentes})`}
        </Button>
        <Button
          type="button"
          disabled={pending || totalInscritos === 0}
          onClick={() => enviar("todos")}
        >
          {pending ? "Enviando..." : `Reenviar todos (${totalInscritos})`}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        Pendentes: quem ainda não recebeu. Todos: reenvia para cada inscrito
        (útil se alguém perdeu o e-mail).
      </p>
      {message && (
        <Alert type={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Alert>
      )}
    </div>
  );
}
