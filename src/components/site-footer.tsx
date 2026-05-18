import { AbrarastroLogo } from "./abrarastro-logo";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#0f2744] text-white">
      <Container className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <AbrarastroLogo height={40} variant="onDark" />
        <p className="max-w-md text-xs text-slate-300">
          Associação Brasileira de Rastreabilidade de Alimentos — sistema de
          palestras, certificados e validação.
        </p>
      </Container>
    </footer>
  );
}
