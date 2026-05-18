"use client";

import { useTransition } from "react";
import { deletePalestraAction } from "@/lib/actions";
import { Button } from "@/components/ui";

export function ExcluirPalestraButton({
  palestraId,
  titulo,
  totalInscritos,
}: {
  palestraId: string;
  titulo: string;
  totalInscritos: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        const msg =
          totalInscritos > 0
            ? `Excluir a palestra "${titulo}" e ${totalInscritos} inscrição(ões)? Esta ação não pode ser desfeita.`
            : `Excluir a palestra "${titulo}"? Esta ação não pode ser desfeita.`;
        if (!confirm(msg)) return;

        startTransition(async () => {
          const result = await deletePalestraAction(palestraId);
          if (result?.error) {
            alert(result.error);
          }
        });
      }}
    >
      {pending ? "Excluindo..." : "Excluir palestra"}
    </Button>
  );
}
