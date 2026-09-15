import { CircleAlert, Clock3, CircleCheckBig } from "lucide-react";
import {
  proximaTrocaKm,
  kmRestantes,
  statusPreventiva,
  type ManutencaoPreventiva,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const KM = new Intl.NumberFormat("pt-BR");

/**
 * Semáforo de manutenção preventiva por quilometragem (conceito de
 * demonstração): compara km atual com "última troca + intervalo previsto".
 * Reaproveita o mesmo DocStatus/paleta usados em documentação e multas —
 * não é uma regra nova, é a mesma linguagem visual aplicada a km em vez
 * de data.
 */
export function PreventivaCard({
  placa,
  atualKm,
  preventiva,
}: {
  placa: string;
  atualKm: number;
  preventiva: ManutencaoPreventiva;
}) {
  const status = statusPreventiva(atualKm, preventiva);
  const proxima = proximaTrocaKm(preventiva);
  const restante = kmRestantes(atualKm, preventiva);

  const tom =
    status === "critico"
      ? { border: "border-destructive/25", bg: "bg-destructive-soft/50", icon: "bg-destructive-soft text-destructive", texto: "text-destructive" }
      : status === "atencao"
        ? { border: "border-warning/25", bg: "bg-warning-soft/50", icon: "bg-warning-soft text-warning", texto: "text-warning" }
        : { border: "border-success/25", bg: "bg-success-soft/50", icon: "bg-success-soft text-success", texto: "text-success" };

  const titulo =
    status === "critico"
      ? `${preventiva.servico} vencida`
      : status === "atencao"
        ? `${preventiva.servico} próxima`
        : "Manutenção em dia";

  const Icon = status === "critico" ? CircleAlert : status === "atencao" ? Clock3 : CircleCheckBig;

  return (
    <div className={cn("flex items-start gap-3.5 rounded-2xl border p-4", tom.border, tom.bg)}>
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tom.icon)}>
        <Icon className="size-4" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">{placa}</span>
          <p className={cn("text-[13px] font-semibold", tom.texto)}>{titulo}</p>
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Atual: {KM.format(atualKm)} km · {status === "critico" ? "Prevista" : "Próxima"}: {KM.format(proxima)} km
        </p>
        <p className={cn("mt-0.5 text-[13px] font-medium", tom.texto)}>
          {restante < 0
            ? `${KM.format(Math.abs(restante))} km em atraso`
            : `${KM.format(restante)} km restantes`}
        </p>
      </div>
    </div>
  );
}
