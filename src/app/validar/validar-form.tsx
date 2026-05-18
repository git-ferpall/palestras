"use client";

import { useRouter } from "react/navigation";
import { FormEvent } from "react";
import { Label, Input, Button } from "@/components/ui";

export function ValidarForm() {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const codigo = String(form.get("codigo") ?? "").trim();
    if (codigo) router.push(`/validar/${codigo}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Código do certificado</Label>
        <Input name="codigo" required placeholder="Cole o código aqui" />
      </div>
      <Button type="submit">Verificar</Button>
    </form>
  );
}
