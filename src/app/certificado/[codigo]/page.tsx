import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateBR, formatCpf } from "@/lib/utils";
import { findInscricaoByCodigoOuHash } from "@/lib/inscricao-utils";
import { formatValidacaoHashDisplay } from "@/lib/certificate-utils";
import { ensureValidacaoHash } from "@/lib/inscricao-utils";
import { Container, Card, PageHeader, Button, Alert } from "@/components/ui";
import { DownloadCertificateButton } from "@/components/download-certificate-button";

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const inscricao = await findInscricaoByCodigoOuHash(codigo);

  if (!inscricao) notFound();

  const certificadoCodigo = inscricao.certificadoCodigo;

  const validacaoHash = await ensureValidacaoHash(
    inscricao.id,
    inscricao.validacaoHash
  );

  if (inscricao.palestra.status !== "ENCERRADA") {
    return (
      <main className="min-h-screen bg-slate-50">
        <Container className="py-12">
          <Alert type="warning">
            O certificado ficará disponível após o administrador encerrar a
            palestra.
          </Alert>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Container className="py-12">
        <PageHeader
          title="Seu certificado"
          description={inscricao.palestra.titulo}
        />

        <Card>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Participante</dt>
              <dd className="font-medium">{inscricao.nome}</dd>
            </div>
            <div>
              <dt className="text-slate-500">CPF</dt>
              <dd>{formatCpf(inscricao.cpf)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Palestra</dt>
              <dd>{inscricao.palestra.titulo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Data</dt>
              <dd>
                {formatDateBR(inscricao.palestra.data)} às{" "}
                {inscricao.palestra.horario}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Código de validação</dt>
              <dd className="font-mono text-sm">
                {formatValidacaoHashDisplay(validacaoHash)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <DownloadCertificateButton
              codigo={certificadoCodigo}
              nome={inscricao.nome}
            />
            <Link href={`/validar/${validacaoHash}`}>
              <Button variant="secondary">Validar certificado</Button>
            </Link>
          </div>
        </Card>
      </Container>
    </main>
  );
}
