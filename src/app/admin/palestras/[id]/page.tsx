import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import { getInscricaoUrl, generateQrCodeDataUrl } from "@/lib/qrcode";
import { formatDateBR, formatDateTimeBR, formatCpf } from "@/lib/utils";
import { parseTemasJson, formatValidacaoHashDisplay } from "@/lib/certificate-utils";
import {
  Container,
  PageHeader,
  Card,
  Badge,
  Alert,
} from "@/components/ui";
import { EncerrarPalestraButton } from "./encerrar-button";
import { ExcluirPalestraButton } from "./excluir-button";
import { DownloadQrButton } from "./download-qr-button";
import { PreviewCertificadoButton } from "./preview-certificado-button";
import { ReenviarCertificadoButton } from "./reenviar-certificado-button";
import { ReenviarEmailsLote } from "./reenviar-emails-lote";
import { EditarEmailInscricao } from "./editar-email-inscricao";

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

  const emailsEnviados = palestra.inscricoes.filter(
    (i) => i.certificadoEnviado
  ).length;
  const emailsPendentes = palestra.inscricoes.length - emailsEnviados;
  const palestraEncerrada = palestra.status === "ENCERRADA";

  return (
    <Container>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>

      {msg && (
        <Alert type="success">
          {(() => {
            try {
              return decodeURIComponent(msg);
            } catch {
              return msg;
            }
          })()}
        </Alert>
      )}

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
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Logo evento</dt>
              <dd>{palestra.logoEventoPath ? "Personalizado" : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ministrante</dt>
              <dd>{palestra.ministranteNome || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Assinatura</dt>
              <dd>{palestra.ministranteAssinaturaPath ? "Cadastrada" : "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Certificado</p>
            <PreviewCertificadoButton palestraId={palestra.id} />
            <p className="mt-2 text-xs text-slate-500">
              Previa com dados de exemplo ou do primeiro inscrito cadastrado.
            </p>
          </div>

          {parseTemasJson(palestra.temas).length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Temas (verso)</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
                {parseTemasJson(palestra.temas).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </div>
          )}

          {palestra.status === "AGENDADA" && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <EncerrarPalestraButton
                palestraId={palestra.id}
                titulo={palestra.titulo}
                totalInscritos={palestra.inscricoes.length}
              />
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
          <div className="mt-4 flex justify-center">
            <DownloadQrButton dataUrl={qrDataUrl} titulo={palestra.titulo} />
          </div>
          {!qrAtivo && (
            <p className="mt-2 text-sm text-amber-700">
              Este QR code não aceita mais inscrições.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              Inscritos ({palestra.inscricoes.length})
            </h3>
            {palestraEncerrada && palestra.inscricoes.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                E-mails de certificado:{" "}
                <span className="font-medium text-emerald-700">
                  {emailsEnviados} enviado(s)
                </span>
                {emailsPendentes > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-medium text-amber-700">
                      {emailsPendentes} pendente(s)
                    </span>
                  </>
                )}
              </p>
            )}
            {!palestraEncerrada && palestra.inscricoes.length > 0 && (
              <p className="mt-1 text-sm text-slate-500">
                Os e-mails serão enviados ao encerrar a palestra.
              </p>
            )}
          </div>
          {palestraEncerrada && palestra.inscricoes.length > 0 && (
            <ReenviarEmailsLote
              palestraId={palestra.id}
              totalPendentes={emailsPendentes}
              totalInscritos={palestra.inscricoes.length}
            />
          )}
        </div>
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
                  <th className="py-2 pr-4">Validação</th>
                  <th className="py-2 pr-4">E-mail cert.</th>
                  <th className="py-2 pr-4">Enviado em</th>
                  {palestraEncerrada && <th className="py-2 pr-4">Reenviar</th>}
                </tr>
              </thead>
              <tbody>
                {palestra.inscricoes.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{i.nome}</td>
                    <td className="py-2 pr-4">{formatCpf(i.cpf)}</td>
                    <td className="py-2 pr-4">
                      <EditarEmailInscricao
                        inscricaoId={i.id}
                        email={i.email}
                        nome={i.nome}
                      />
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {i.validacaoHash
                        ? formatValidacaoHashDisplay(i.validacaoHash)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {palestraEncerrada ? (
                        i.certificadoEnviado ? (
                          <Badge tone="success">Enviado</Badge>
                        ) : (
                          <Badge tone="warning">Pendente</Badge>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {i.certificadoEnviadoEm
                        ? formatDateTimeBR(i.certificadoEnviadoEm)
                        : "—"}
                    </td>
                    {palestraEncerrada && (
                      <td className="py-2 pr-4">
                        <ReenviarCertificadoButton inscricaoId={i.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 border-red-200 bg-red-50/50">
        <h3 className="mb-2 font-semibold text-red-900">Zona de perigo</h3>
        <p className="mb-4 text-sm text-red-800">
          Excluir remove a palestra e todas as inscrições. Não é possível desfazer.
        </p>
        <ExcluirPalestraButton
          palestraId={palestra.id}
          titulo={palestra.titulo}
          totalInscritos={palestra.inscricoes.length}
        />
      </Card>
    </Container>
  );
}
