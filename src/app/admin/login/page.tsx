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
import { AbrarastroLogo } from "@/components/abrarastro-logo";

const initial: ActionState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Container className="flex justify-center">
          <AbrarastroLogo href="/" height={48} showTagline />
        </Container>
      </header>

      <Container className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <PageHeader
            title="Login do administrador"
            description="Acesse o painel para gerenciar palestras e usuários"
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
            <Link href="/" className="text-[#0d6e6e] hover:underline">
              Voltar ao início
            </Link>
          </p>
        </Card>
      </Container>
    </main>
  );
}
