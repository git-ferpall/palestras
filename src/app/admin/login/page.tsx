"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions";
import {
  Container,
  Card,
  PageHeader,
  Label,
  Input,
  Button,
  Alert,
} from "@/components/ui";

const initial: ActionState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <main className="min-h-screen bg-slate-100">
      <Container className="flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <PageHeader
            title="Login do administrador"
            description="Acesse o painel para gerenciar palestras"
          />

          {state.error && <Alert type="error">{state.error}</Alert>}

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@exemplo.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="text-blue-600 hover:underline">
              Voltar ao início
            </Link>
          </p>
        </Card>
      </Container>
    </main>
  );
}
