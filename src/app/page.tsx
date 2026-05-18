import Link from "next/link";
import { Container, Card, Button } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
            Gestão de eventos
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Sistema de Palestras e Certificados
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Crie palestras com QR code para inscrição, gerencie participantes e
            emita certificados validáveis automaticamente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/admin/login">
              <Button>Área do administrador</Button>
            </Link>
            <Link href="/validar">
              <Button variant="secondary">Validar certificado</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Card>
            <h3 className="font-semibold text-slate-900">1. Criar palestra</h3>
            <p className="mt-2 text-sm text-slate-600">
              O administrador define data, horário e quando o QR code expira.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-900">2. Inscrição via QR</h3>
            <p className="mt-2 text-sm text-slate-600">
              Participantes se cadastram com nome, CPF, e-mail e telefone.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-900">3. Certificado</h3>
            <p className="mt-2 text-sm text-slate-600">
              Após o evento, cada inscrito recebe e-mail para baixar e validar o certificado.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
