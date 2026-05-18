import Link from "next/link";
import { formatDateBR, formatCpf } from "@/lib/utils";
import { formatValidacaoHashDisplay } from "@/lib/certificate-utils";
import { findInscricaoByCodigoOuHash } from "@/lib/inscricao-utils";
import { Container, Card, PageHeader, Alert, Badge } from "@/components/ui";

export default async function ValidarCodigoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const inscricao = await findInscricaoByCodigoOuHash(codigo);
  const valido = !!inscricao && inscricao.palestra.status === "ENCERRADA";
  const hash = inscricao?.validacaoHash ?? codigo;

  return (
    <main className="min-h-screen bg-slate-50">
      <Container className="py-12">
        <PageHeader title="Resultado da validação" />

        {valido ? (
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Badge tone="success">Certificado autêntico</Badge>
            </div>
            <Alert type="success">
              Este certificado é válido e foi emitido pelo sistema.
            </Alert>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Participante</dt>
                <dd className="font-medium">{inscricao!.nome}</dd>
              </div>
              <div>
                <dt className="text-slate-500">CPF</dt>
                <dd>{formatCpf(inscricao!.cpf)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Palestra</dt>
                <dd>{inscricao!.palestra.titulo}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Data do evento</dt>
                <dd>
                  {formatDateBR(inscricao!.palestra.data)} às{" "}
                  {inscricao!.palestra.horario}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Código de validação</dt>
                <dd className="font-mono text-sm">
                  {formatValidacaoHashDisplay(hash)}
                </dd>
              </div>
            </dl>
          </Card>
        ) : (
          <Alert type="error">
            Certificado não encontrado ou ainda não foi liberado. Verifique o
            código informado.
          </Alert>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/validar" className="text-blue-600 hover:underline">
            Validar outro código
          </Link>
        </p>
      </Container>
    </main>
  );
}
