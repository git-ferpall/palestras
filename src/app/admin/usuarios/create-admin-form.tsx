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

      <div>
        <Label>Nome completo *</Label>
        <Input name="nome" required placeholder="Nome do administrador" />
      </div>
      <div>
        <Label>E-mail *</Label>
        <Input name="email" type="email" required placeholder="email@exemplo.com" />
      </div>
      <div>
        <Label>Senha *</Label>
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="M?nimo 8 caracteres"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Cadastrando..." : "Cadastrar usuário"}
      </Button>
    </form>
  );
}

