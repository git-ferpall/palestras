import Link from "next/link";
import { Container, Card, PageHeader, Button } from "@/components/ui";
import { ValidarForm } from "./validar-form";

export default function ValidarPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Container className="py-12">
        <PageHeader
          title="Validar certificado"
          description="Informe o código impresso no certificado"
        />
        <Card>
          <ValidarForm />
        </Card>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            Voltar ao início
          </Link>
        </p>
      </Container>
    </main>
  );
}
