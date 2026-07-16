import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Painel no padrão do Protótipo 1 (Clone do Protótipo 1): bloco branco, borda 1px, cabeçalho
 * com título/subtítulo separado por linha, corpo com respiro — a unidade
 * estrutural repetida em quase toda tela do protótipo (`.panel`).
 */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-card", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PanelBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
