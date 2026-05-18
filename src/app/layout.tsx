import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Palestras",
  description: "Palestras — inscrições e certificados",
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
