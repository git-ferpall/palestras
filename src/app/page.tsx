import Link from "next/link";
import { Container, Button } from "@/components/ui";
import { PublicShell } from "@/components/public-shell";
import { SiteHeaderLinks } from "@/components/site-header";

export default function HomePage() {
  return (
    <PublicShell headerExtra={<SiteHeaderLinks />}>
      <Container className="flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[#0f2744] sm:text-5xl">
          Palestras e certificados
        </h1>
        <p className="mt-4 max-w-lg text-slate-600">
          Sistema da ABRARASTRO para inscrições por QR code, emissão de
          certificados digitais e validação online.
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
    </PublicShell>
  );
}
