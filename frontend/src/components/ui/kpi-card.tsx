import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type KpiTone = "crit" | "warn" | "ok" | "info";

const TONE_ICON: Record<KpiTone, string> = {
  crit: "bg-destructive-soft text-destructive",
  warn: "bg-warning-soft text-warning",
  ok: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
};

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  foot?: string;
  tone: KpiTone;
  href?: string;
}

/** KPI card no padrão exato do Protótipo 1 (Clone do Protótipo 1): `.kpi-card.tone-*`. */
export function KpiCard({ icon: Icon, label, value, foot, tone, href }: KpiCardProps) {
  const content = (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-semibold text-muted-foreground">{label}</p>
        <div className={cn("flex size-8.5 shrink-0 items-center justify-center rounded-lg", TONE_ICON[tone])}>
          <Icon className="size-[17px]" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-2.5 text-[27px] font-extrabold tracking-tight text-foreground tabular-nums">{value}</p>
      {foot && <p className="mt-1.5 text-xs text-muted-foreground">{foot}</p>}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
