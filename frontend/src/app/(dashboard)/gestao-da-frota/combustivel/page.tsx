import type { Metadata } from "next";
import { CombustivelView } from "@/components/combustivel/combustivel-view";
import { diasDeAutonomiaTanque } from "@/lib/combustivel";

export const metadata: Metadata = {
  title: "Combustível da Frota",
};

export default function CombustivelPage() {
  const autonomia = diasDeAutonomiaTanque();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quanto combustível a operação tem hoje?
        </h2>
        <p className="text-sm text-muted-foreground">
          {autonomia <= 3
            ? `O tanque da base atende apenas mais ${autonomia} dia(s) — e cada abastecimento em viagem entra aqui, sem depender de recibo perdido.`
            : "O tanque da base e os abastecimentos em viagem, no mesmo lugar — sem depender de recibo perdido."}
        </p>
      </div>
      <CombustivelView />
    </div>
  );
}
