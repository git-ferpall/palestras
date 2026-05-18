import Link from "next/link";
import { AbrarastroLogo } from "./abrarastro-logo";
import { Container } from "./ui";

type SiteHeaderProps = {
  children?: React.ReactNode;
};

export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
        <AbrarastroLogo href="/" height={44} showTagline />
        {children}
      </Container>
    </header>
  );
}

export function SiteHeaderLinks() {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
      <Link href="/validar" className="text-slate-600 hover:text-[#0f2744]">
        Validar certificado
      </Link>
      <Link
        href="/admin/login"
        className="rounded-lg bg-[#0f2744] px-3 py-1.5 text-white hover:bg-[#1e3a8a]"
      >
        Admin
      </Link>
    </nav>
  );
}
