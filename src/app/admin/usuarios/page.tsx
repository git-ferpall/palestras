import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import { Container, PageHeader, Card } from "@/components/ui";
import { CreateAdminForm } from "./create-admin-form";

export default async function AdminUsuariosPage() {
  const session = await getSessionAdmin();
  if (!session) redirect("/admin/login");

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, nome: true, email: true, createdAt: true },
  });

  return (
    <Container>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-blue-600">
          ← Voltar ao painel
        </Link>
      </div>

      <PageHeader
        title="Usuários administrativos"
        description="Cadastre quem pode acessar o painel de palestras"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Novo usuário
          </h2>
          <CreateAdminForm />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Usuários cadastrados ({admins.length})
          </h2>
          <ul className="divide-y divide-slate-100">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{a.nome}</p>
                  <p className="text-sm text-slate-500">{a.email}</p>
                </div>
                {a.id === session.id && (
                  <span className="text-xs font-medium text-emerald-600">
                    Você
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Container>
  );
}
