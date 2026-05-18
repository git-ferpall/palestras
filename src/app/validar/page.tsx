import { Container, Card, PageHeader } from "@/components/ui";
import { PublicShell } from "@/components/public-shell";
import { ValidarForm } from "./validar-form";

export default function ValidarPage() {
  return (
    <PublicShell>
      <Container className="py-10">
        <PageHeader
          title="Validar certificado"
          description="Informe o código impresso no certificado ou escaneie o QR code"
        />
        <Card>
          <ValidarForm />
        </Card>
      </Container>
    </PublicShell>
  );
}
