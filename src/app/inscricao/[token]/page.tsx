import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { Container, Card, PageHeader, Alert, Badge } from "@/components/ui";
import { InscricaoForm } from "./inscricao-form";

export default async function InscricaoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const palestra = await prisma.palestra.findUnique({
    where: { qrToken: token },
  });

  if (!palestra) notFound();

  const qrExpirado = new Date() > palestra.qrExpiraEm;
  const encerrada = palestra.status !== "AGENDADA";
  const podeInscrever = !qrExpirado && !encerrada;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Container className="py-12">
        <PageHeader
          title={palestra.titulo}
          description="Preencha seus dados para se inscrever"
        />

        <Card className="mb-6">
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span>{formatDateBR(palestra.data)} às {palestra.horario}</span>
            {palestra.local && <span>· {palestra.local}</span>}
          </div>
          {palestra.descricao && (
            <p className="mt-3 text-sm text-slate-600">{palestra.descricao}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Inscrições via QR até {formatDateTimeBR(palestra.qrExpiraEm)}
          </p>
        </Card>

        {encerrada && (
          <Alert type="warning">
            Esta palestra já foi encerrada e não aceita novas inscrições.
          </Alert>
        )}

        {qrExpirado && !encerrada && (
          <Alert type="error">
            O QR code expirou em {formatDateTimeBR(palestra.qrExpiraEm)}.
            Procure o organizador do evento.
          </Alert>
        )}

        {podeInscrever ? (
          <InscricaoForm qrToken={token} />
        ) : (
          <div className="mt-4">
            <Badge tone="warning">Inscrições indisponíveis</Badge>
          </div>
        )}
      </Container>
    </main>
  );
}
