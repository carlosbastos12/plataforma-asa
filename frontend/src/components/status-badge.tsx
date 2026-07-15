import { cn } from "@/lib/utils";
import type { DocStatus } from "@/lib/mock-data";

const CONFIG: Record<DocStatus, { label: string; className: string; dot: string }> = {
  critico: {
    label: "Crítico",
    className: "bg-destructive-soft text-destructive",
    dot: "bg-destructive",
  },
  atencao: {
    label: "Atenção",
    className: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  regular: {
    label: "Em dia",
    className: "bg-success-soft text-success",
    dot: "bg-success",
  },
};

export function StatusBadge({ status, className }: { status: DocStatus; className?: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        c.className,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
