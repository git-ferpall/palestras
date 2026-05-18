"use client";

import { useActionState } from "react";
import { createPalestraAction, type ActionState } from "@/lib/actions";
import { SignaturePad } from "@/components/signature-pad";
import {
  Container,
  Card,
  PageHeader,
  Label,
  Input,
  Textarea,
  Button,
  Alert,
} from "@/components/ui";

const initial: ActionState = {};

function defaultQrExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NovaPalestraPage() {
  const [state, formAction, pending] = useActionState(
    createPalestraAction,
    initial
  );

  return (
    <Container>
      <PageHeader
        title="Nova palestra"
        description="Certificado em 2 páginas — frente simplificada, verso com atividades"
      />

      {state.error && (
        <div className="mb-4">
          <Alert type="error">{state.error}</Alert>
        </div>
      )}

      <Card>
        <form
          action={formAction}
          encType="multipart/form-data"
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Label>Título da palestra (no certificado) *</Label>
            <Input
              name="titulo"
              required
              placeholder="Ex: Rastreabilidade na Aquicultura Rumo à Sustentabilidade"
            />
            <p className="mt-1 text-xs text-slate-500">
              Aparece em maiúsculas na frente do certificado, com a carga horária.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição (uso interno)</Label>
            <Textarea name="descricao" rows={2} />
          </div>
          <div>
            <Label>Cidade/UF no certificado</Label>
            <Input name="cidadeUf" placeholder="Ex: São Paulo/SP" />
          </div>
          <div>
            <Label>Local</Label>
            <Input name="local" placeholder="Auditório, online..." />
          </div>
          <div>
            <Label>Data da palestra *</Label>
            <Input name="data" type="date" required />
          </div>
          <div>
            <Label>Horário *</Label>
            <Input name="horario" type="time" required />
          </div>
          <div>
            <Label>Carga horária total (horas) *</Label>
            <Input
              name="cargaHoraria"
              type="number"
              min={1}
              max={40}
              defaultValue={1}
              required
            />
          </div>
          <div>
            <Label>QR code válido até *</Label>
            <Input
              name="qrExpiraEm"
              type="datetime-local"
              required
              defaultValue={defaultQrExpiry()}
            />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-800">
              Logo do evento (canto superior direito)
            </p>
            <p className="mb-3 text-xs text-slate-500">
              PNG ou JPG (recomendado). Aparece no canto superior direito do
              certificado. A Abrarastro permanece à esquerda e como marca
              d&apos;água.
            </p>
            <input
              type="file"
              name="logoEvento"
              accept="image/png,image/jpeg"
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-100"
            />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-800">Ministrante</p>
            <div className="mb-4">
              <Label>Nome do ministrante</Label>
              <Input
                name="ministranteNome"
                placeholder="Ex: Dr. João Silva"
              />
            </div>
            <SignaturePad />
          </div>

          <div className="sm:col-span-2">
            <Label>Temas — conteúdo programático (verso do certificado)</Label>
            <Textarea
              name="temas"
              rows={10}
              placeholder={
                "Um tema por linha, ex:\nIntrodução à rastreabilidade\nNormativa federal aplicada ao FLV"
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Listados no verso na tabela de atividades.
            </p>
          </div>

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Criar palestra"}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}
