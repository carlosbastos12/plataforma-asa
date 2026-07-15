import type { Metadata } from "next";
import { ConfiguracoesGrid } from "@/components/configuracoes/config-card";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Como a plataforma se adapta a você?
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Acessos, avisos e preferências — tudo pensado para a plataforma trabalhar do jeito da sua equipe.
        </p>
      </div>

      <ConfiguracoesGrid />
    </div>
  );
}
