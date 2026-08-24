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

export function StatusParcelaBadge({
  status,
  className,
  compacto = false,
}: {
  status: StatusParcela;
  className?: string;
  /** Versão mais estreita (padding e fonte menores), para caber em
   *  colunas de tabela apertadas sem cortar o rótulo. O visual continua
   *  o mesmo badge — só reduz o respiro interno. */
  compacto?: boolean;
}) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full font-medium",
        compacto ? "gap-1 px-2 py-0.5 text-[11px]" : "gap-1.5 px-2.5 py-1 text-xs",
        c.classe,
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", c.ponto)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
