"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reenviarCertificadoEmailAction } from "@/lib/actions";
import { Button } from "@/components/ui";

export function ReenviarCertificadoButton({
  inscricaoId,
}: {
  inscricaoId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        className="px-2.5 py-1 text-xs"
        onClick={() => {
          setFeedback(null);
          startTransition(async () => {
            const result = await reenviarCertificadoEmailAction(inscricaoId);
            if (result.error) {
              setFeedback(result.error);
              return;
            }
            setFeedback(result.success ?? "Enviado");
            router.refresh();
          });
        }}
      >
        {pending ? "Enviando..." : "Reenviar e-mail"}
      </Button>
      {feedback && (
        <span
          className={`max-w-[200px] text-xs ${feedback.includes("Falha") || feedback.includes("erro") || feedback.includes("Sessão") ? "text-red-600" : "text-emerald-700"}`}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
