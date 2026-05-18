"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { encerrarPalestraAction } from "@/lib/actions";
import { Button } from "@/components/ui";

export function EncerrarPalestraButton({ palestraId }: { palestraId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Encerrar palestra e enviar certificados por e-mail a todos os inscritos?"
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await encerrarPalestraAction(palestraId);
          if (result.error) {
            alert(result.error);
            return;
          }
          router.refresh();
          if (result.success) {
            router.push(
              `/admin/palestras/${palestraId}?msg=${encodeURIComponent(result.success)}`
            );
          }
        });
      }}
    >
      {pending ? "Processando..." : "Encerrar e enviar certificados"}
    </Button>
  );
}
