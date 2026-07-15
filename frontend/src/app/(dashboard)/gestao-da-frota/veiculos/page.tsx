import type { Metadata } from "next";
import { FrotaGrid } from "@/components/frota/frota-grid";
import { FROTA, situacaoVeiculo } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Veículos da Frota",
};

export default function FrotaPage() {
  const impedidos = FROTA.filter((v) => situacaoVeiculo(v) === "critico").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quais veículos impedem a operação?
        </h2>
        <p className="text-sm text-muted-foreground">
          {impedidos > 0
            ? `${impedidos} de ${FROTA.length} veículos com pendência vencida — eles aparecem primeiro, com o motivo e a ação que os libera.`
            : `Nenhum veículo impedido. Os ${FROTA.length} veículos da frota podem operar hoje.`}
        </p>
      </div>
      <FrotaGrid />
    </div>
  );
}
