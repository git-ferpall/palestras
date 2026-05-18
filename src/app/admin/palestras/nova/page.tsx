"use client";

import { useActionState } from "react";
import { createPalestraAction, type ActionState } from "@/lib/actions";
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
        description="Ao salvar, um QR code será gerado para inscrições"
      />

      {state.error && (
        <div className="mb-4">
        <Alert type="error">
          {state.error}
        </Alert>
        </div>
      )}

      <Card>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Título *</Label>
            <Input name="titulo" required placeholder="Ex: Inteligência Artificial na Prática" />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea name="descricao" rows={3} placeholder="Conteúdo programático..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Local</Label>
            <Input name="local" placeholder="Auditório principal" />
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
            <Label>Carga horária (horas) *</Label>
            <Input name="cargaHoraria" type="number" min={1} max={40} defaultValue={2} required />
          </div>
          <div>
            <Label>QR code válido até *</Label>
            <Input
              name="qrExpiraEm"
              type="datetime-local"
              required
              defaultValue={defaultQrExpiry()}
            />
            <p className="mt-1 text-xs text-slate-500">
              Após este horário, o QR code não aceita mais inscrições.
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
