import Link from "next/link";
import { getSessionAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Container, Button } from "@/components/ui";
import { AbrarastroLogo } from "@/components/abrarastro-logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();

  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <AbrarastroLogo href="/admin" height={40} />
            <div className="flex flex-wrap gap-4 text-sm font-medium">
              <Link href="/admin" className="text-slate-600 hover:text-[#0f2744]">
                Palestras
              </Link>
              <Link
                href="/admin/palestras/nova"
                className="text-slate-600 hover:text-[#0f2744]"
              >
                Nova palestra
              </Link>
              <Link
                href="/admin/usuarios"
                className="text-slate-600 hover:text-[#0f2744]"
              >
                Usuários
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{admin.nome}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary">
                Sair
              </Button>
            </form>
          </div>
        </Container>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
