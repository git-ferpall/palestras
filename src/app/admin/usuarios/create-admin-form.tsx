"use client";

import { useActionState } from "react";
import { createAdminAction, type ActionState } from "@/lib/actions";
import { Label, Input, Button, Alert } from "@/components/ui";

const initial: ActionState = {};

export function CreateAdminForm() {
  const [state, formAction, pending] = useActionState(createAdminAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert type="error">{state.error}</Alert>}
      {state.success && <Alert type="success">{state.success}</Alert>}

      <p className="space-y-1">
        <Label>Nome completo *</Label>
        <Input name="nome" required placeholder="Nome do administrador" />
      </p>
      <p className="space-y-1">
        <Label>E-mail *</Label>
        <Input
          name="email"
          type="email"
          required
          placeholder="email@exemplo.com"
        />
      </p>
      <p className="space-y-1">
        <Label>Senha *</Label>
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Minimo 8 caracteres"
        />
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Cadastrando..." : "Cadastrar usuario"}
      </Button>
    </form>
  );
}
