import type { TipoManutencao, StatusManutencao } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function TipoManutencaoBadge({ tipo }: { tipo: TipoManutencao }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        tipo === "preventiva" ? "bg-info-soft text-info" : "bg-warning-soft text-warning"
      )}
    >
      {tipo === "preventiva" ? "Preventiva" : "Corretiva"}
    </span>
  );
}

export function StatusManutencaoBadge({ status }: { status: StatusManutencao }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "concluida" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
      )}
    >
      <span className={cn("size-1.5 rounded-full", status === "concluida" ? "bg-success" : "bg-warning")} />
      {status === "concluida" ? "Concluída" : "Em andamento"}
    </span>
  );
}
