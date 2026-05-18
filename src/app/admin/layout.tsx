import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Container, Button } from "@/components/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();

  // Login page renders without nav
  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="border-b border-slate-200 bg-white">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-slate-900">
              Painel Admin
            </Link>
            <Link
              href="/admin/palestras/nova"
              className="text-sm text-slate-600 hover:text-blue-600"
            >
              Nova palestra
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">Olá, {admin.nome}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary">
                Sair
              </Button>
            </form>
          </div>
        </Container>
      </nav>
      {children}
    </div>
  );
}
