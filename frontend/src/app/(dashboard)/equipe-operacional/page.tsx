import type { Metadata } from "next";
import { EquipeView } from "@/components/equipe/equipe-view";

export const metadata: Metadata = {
  title: "Equipe Operacional",
};

export default function EquipeOperacionalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quem está trabalhando, quem está de folga e quem pode substituir?
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Uma falta, um atestado ou uma férias mudam a capacidade da operação de atender chamados — por isso a
          equipe vive junto da frota, não separada dela.
        </p>
      </div>
      <EquipeView />
    </div>
  );
}
