import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}

const TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={cn("flex size-9 items-center justify-center rounded-lg", TONE[tone])}>
        <Icon className="size-[17px]" strokeWidth={2} />
      </div>
      <p className="mt-3.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{label}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
