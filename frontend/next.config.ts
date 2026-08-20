import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão do Next.js é 1 MB — baixo demais para anexar NF/comprovante
      // digitalizado (Central Financeira, D-047/Etapa 4). O limite real de
      // arquivo (15 MB) é validado em `enviarDocumento`; a folga aqui cobre
      // o overhead do multipart/form-data.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
