import { cn } from "@/lib/utils";
import { STATUS_LABEL, type StatusParcela } from "@/lib/financeiro/tipos";

const CONFIG: Record<StatusParcela, { classe: string; ponto: string }> = {
  a_vencer: { classe: "bg-secondary text-muted-foreground", ponto: "bg-muted-foreground" },
  vence_hoje: { classe: "bg-warning-soft text-warning", ponto: "bg-warning" },
  vencida: { classe: "bg-destructive-soft text-destructive", ponto: "bg-destructive" },
  paga: { classe: "bg-success-soft text-success", ponto: "bg-success" },
  parcialmente_paga: { classe: "bg-info-soft text-info", ponto: "bg-info" },
  cancelada: { classe: "bg-secondary text-muted-faint", ponto: "bg-muted-faint" },
};

export function StatusParcelaBadge({ status, className }: { status: StatusParcela; className?: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        c.classe,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.ponto)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
