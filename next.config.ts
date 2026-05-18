import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFKit precisa rodar fora do bundle (fontes .afm em node_modules)
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
