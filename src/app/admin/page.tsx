import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Alert,
} from "@/components/ui";
import { formatDateBR, formatDateTimeBR } from "@/lib/utils";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");

  const { msg } = await searchParams;

  const palestras = await prisma.palestra.findMany({
    orderBy: [{ status: "asc" }, { data: "desc" }],
    include: { _count: { select: { inscricoes: true } } },
  });

  return (
    <Container>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Palestras"
          description="Agendadas primeiro — depois encerradas"
        />
        <Link href="/admin/palestras/nova">
          <Button>Nova palestra</Button>
        </Link>
      </div>

      {msg && (
        <div className="mb-6">
          <Alert type="success">
            {(() => {
              try {
                return decodeURIComponent(msg);
              } catch {
                return msg;
              }
            })()}
          </Alert>
        </div>
      )}

      {palestras.length === 0 ? (
        <Card>
          <p className="text-slate-600">
            Nenhuma palestra cadastrada.{" "}
            <Link href="/admin/palestras/nova" className="text-blue-600 hover:underline">
              Criar a primeira
            </Link>
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {palestras.map((p) => {
            const qrAtivo =
              p.status === "AGENDADA" && new Date() <= p.qrExpiraEm;
            return (
              <Card key={p.id} className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{p.titulo}</h2>
                    <Badge tone={p.status === "AGENDADA" ? "warning" : "success"}>
                      {p.status === "AGENDADA" ? "Agendada" : "Encerrada"}
                    </Badge>
                    {qrAtivo && <Badge tone="success">QR ativo</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateBR(p.data)} às {p.horario}
                    {p.local && ` — ${p.local}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {p._count.inscricoes} inscrito(s) · QR expira em{" "}
                    {formatDateTimeBR(p.qrExpiraEm)}
                  </p>
                </div>
                <Link href={`/admin/palestras/${p.id}`}>
                  <Button variant="secondary">Detalhes</Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
