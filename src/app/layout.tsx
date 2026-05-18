import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABRARASTRO — Palestras e certificados",
  description:
    "Associação Brasileira de Rastreabilidade de Alimentos — inscrições, certificados e validação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
