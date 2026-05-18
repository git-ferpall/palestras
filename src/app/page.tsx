import Link from "next/link";
import { Container, Button } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Container className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Palestras
        </h1>

        <p className="mt-4 max-w-md text-slate-600">
          Inscrições por QR code e emissão de certificados digitais.
        </p>

        <nav className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/admin/login">
            <Button>Área do administrador</Button>
          </Link>
          <Link href="/validar">
            <Button variant="secondary">Validar certificado</Button>
          </Link>
        </nav>
      </Container>
    </main>
  );
}
