import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import { getInscricaoUrl, generateQrCodeDataUrl } from "@/lib/qrcode";
import { formatDateBR, formatDateTimeBR, formatCpf } from "@/lib/utils";
import {
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Alert,
} from "@/components/ui";
import { EncerrarPalestraButton } from "./encerrar-button";

export default async function PalestraDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const { msg } = await searchParams;

  const palestra = await prisma.palestra.findUnique({
    where: { id },
    include: {
      inscricoes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!palestra) notFound();

  const inscricaoUrl = getInscricaoUrl(palestra.qrToken);
  const qrDataUrl = await generateQrCodeDataUrl(inscricaoUrl);
  const qrAtivo =
    palestra.status === "AGENDADA" && new Date() <= palestra.qrExpiraEm;

  return (
    <Container>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>

      {msg && <Alert type="success">{decodeURIComponent(msg)}</Alert>}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={palestra.titulo}
          description={palestra.descricao ?? undefined}
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone={palestra.status === "AGENDADA" ? "warning" : "success"}>
            {palestra.status === "AGENDADA" ? "Agendada" : "Encerrada"}
          </Badge>
          {qrAtivo ? (
            <Badge tone="success">QR ativo</Badge>
          ) : (
            <Badge>QR expirado</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Informações</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Data</dt>
              <dd>{formatDateBR(palestra.data)} às {palestra.horario}</dd>
            </div>
            {palestra.local && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Local</dt>
                <dd>{palestra.local}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Carga horária</dt>
              <dd>{palestra.cargaHoraria}h</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">QR expira em</dt>
              <dd>{formatDateTimeBR(palestra.qrExpiraEm)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Inscritos</dt>
              <dd>{palestra.inscricoes.length}</dd>
            </div>
          </dl>

          {palestra.status === "AGENDADA" && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <EncerrarPalestraButton palestraId={palestra.id} />
              <p className="mt-2 text-xs text-slate-500">
                Ao encerrar, todos os inscritos recebem e-mail com link do certificado.
              </p>
            </div>
          )}
        </Card>

        <Card className="text-center">
          <h3 className="mb-4 font-semibold">QR Code de inscrição</h3>
          <Image
            src={qrDataUrl}
            alt="QR Code para inscrição"
            width={280}
            height={280}
            className="mx-auto rounded-lg border border-slate-200"
            unoptimized
          />
          <p className="mt-4 break-all text-xs text-slate-500">{inscricaoUrl}</p>
          {!qrAtivo && (
            <p className="mt-2 text-sm text-amber-700">
              Este QR code não aceita mais inscrições.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h3 className="mb-4 font-semibold">
          Inscritos ({palestra.inscricoes.length})
        </h3>
        {palestra.inscricoes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma inscrição ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">CPF</th>
                  <th className="py-2 pr-4">E-mail</th>
                  <th className="py-2 pr-4">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {palestra.inscricoes.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{i.nome}</td>
                    <td className="py-2 pr-4">{formatCpf(i.cpf)}</td>
                    <td className="py-2 pr-4">{i.email}</td>
                    <td className="py-2 pr-4">
                      {i.certificadoEnviado ? (
                        <Badge tone="success">Enviado</Badge>
                      ) : (
                        <Badge>Pendente</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Container>
  );
}
