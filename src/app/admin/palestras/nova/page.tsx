"use client";

import { useActionState } from "react";
import { createPalestraAction, type ActionState } from "@/lib/actions";
import { TEXTO_DECLARACAO_CERTIFICADO_PADRAO } from "@/lib/certificate-utils";
import {
  Container,
  Card,
  PageHeader,
  Label,
  Input,
  Textarea,
  Button,
  Alert,
  Checkbox,
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
        description="Certificado em 2 páginas com temas, logos e QR de validação"
      />

      {state.error && (
        <div className="mb-4">
          <Alert type="error">{state.error}</Alert>
        </div>
      )}

      <Card>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Título do treinamento *</Label>
            <Input
              name="titulo"
              required
              placeholder="Ex: Treinamento em Rastreabilidade de Alimentos no Varejo"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Subtítulo no certificado</Label>
            <Input
              name="subtituloCertificado"
              placeholder="Ex: Treinamento em Rastreabilidade de Alimentos no Varejo"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Texto de participação no certificado</Label>
            <Textarea
              name="textoDeclaracaoCertificado"
              rows={4}
              defaultValue={TEXTO_DECLARACAO_CERTIFICADO_PADRAO}
            />
            <p className="mt-1 text-xs text-slate-500">
              Parágrafo após o nome — edite o texto abaixo para complementar ou
              ajustar. Variáveis: {"{nome}"}, {"{titulo}"}, {"{data}"},{" "}
              {"{mesAno}"}, {"{horario}"}, {"{cargaHoraria}"}.
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
            <p className="mt-1 text-xs text-slate-500">
              Exibida apenas na capa do certificado (não por tema).
            </p>
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
              Logos no certificado
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Logo Abrarastro sempre no certificado. Arquivos em public/logos/ ou
              src/logos/ (abrarastro.png e, se quiser, frutag.png).
            </p>
            <div className="flex flex-wrap gap-6">
              <Checkbox
                name="usarLogoFrutag"
                label="Incluir logo e apoio técnico Frutag"
                defaultChecked
              />
            </div>
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
              Listados no verso sem carga horária por tema.
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
