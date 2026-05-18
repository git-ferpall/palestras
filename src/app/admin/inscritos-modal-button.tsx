"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/modal";
import { Button, Badge } from "@/components/ui";
import { formatCpf, formatPhone } from "@/lib/utils";

type Inscricao = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  certificadoEnviado: boolean;
};

type PalestraInfo = {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  local: string | null;
  status: string;
};

export function InscritosModalButton({
  palestraId,
  titulo,
  totalInscritos,
}: {
  palestraId: string;
  titulo: string;
  totalInscritos: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [palestra, setPalestra] = useState<PalestraInfo | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/palestras/${palestraId}/inscricoes`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar inscritos");
        return;
      }
      setPalestra(data.palestra);
      setInscricoes(data.inscricoes);
    } catch {
      setError("Erro de conexao ao carregar inscritos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    void load();
  };

  const pdfUrl = `/api/admin/palestras/${palestraId}/inscricoes/pdf`;

  return (
    <>
      <Button type="button" variant="secondary" onClick={handleOpen}>
        Inscritos ({totalInscritos})
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={palestra?.titulo ?? titulo}
        description={
          palestra
            ? `${palestra.data} as ${palestra.horario}${palestra.local ? ` — ${palestra.local}` : ""}`
            : "Lista de participantes inscritos"
        }
        size="xl"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <a href={pdfUrl} download>
              <Button type="button" disabled={loading || inscricoes.length === 0}>
                Exportar PDF
              </Button>
            </a>
            <a
              href={`/api/admin/palestras/${palestraId}/certificado-preview/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="secondary">
                Previa certificado
              </Button>
            </a>
            <Link href={`/admin/palestras/${palestraId}`}>
              <Button type="button">Abrir detalhes</Button>
            </Link>
          </>
        }
      >
        {loading && (
          <p className="py-8 text-center text-sm text-slate-500">Carregando...</p>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {!loading && !error && inscricoes.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhum inscrito nesta palestra.
          </p>
        )}
        {!loading && !error && inscricoes.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#0f2744] text-white">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Nome</th>
                  <th className="px-3 py-2.5 font-semibold">CPF</th>
                  <th className="px-3 py-2.5 font-semibold">E-mail</th>
                  <th className="px-3 py-2.5 font-semibold">Telefone</th>
                  <th className="px-3 py-2.5 font-semibold">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((i, idx) => (
                  <tr
                    key={i.id}
                    className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {i.nome}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatCpf(i.cpf)}</td>
                    <td className="px-3 py-2 text-slate-600">{i.email}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatPhone(i.telefone)}
                    </td>
                    <td className="px-3 py-2">
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
      </Modal>
    </>
  );
}
