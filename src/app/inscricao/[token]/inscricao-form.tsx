"use client";

import { useActionState } from "react";
import { inscricaoAction, type ActionState } from "@/lib/actions";
import { Card, Label, Input, Button, Alert } from "@/components/ui";

const initial: ActionState = {};

export function InscricaoForm({ qrToken }: { qrToken: string }) {
  const [state, formAction, pending] = useActionState(inscricaoAction, initial);

  if (state.success) {
    return <Alert type="success">{state.success}</Alert>;
  }

  return (
    <Card>
      {state.error && <Alert type="error">{state.error}</Alert>}

      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="qrToken" value={qrToken} />
        <div>
          <Label>Nome completo *</Label>
          <Input name="nome" required placeholder="Seu nome" />
        </div>
        <div>
          <Label>CPF *</Label>
          <Input
            name="cpf"
            required
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div>
          <Label>E-mail *</Label>
          <Input name="email" type="email" required placeholder="voce@email.com" />
        </div>
        <div>
          <Label>Telefone *</Label>
          <Input name="telefone" required placeholder="(00) 00000-0000" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Confirmar inscrição"}
        </Button>
      </form>
    </Card>
  );
}
