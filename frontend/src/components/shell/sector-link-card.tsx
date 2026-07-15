import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectorLinkCardProps {
  href?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

export function SectorLinkCard({ href, icon: Icon, title, description, badge, disabled }: SectorLinkCardProps) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5",
        disabled ? "opacity-60" : "transition-all hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className="size-[18px]" strokeWidth={2} />
        </div>
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      {!disabled && href && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          Abrir <ChevronRight className="size-3.5" />
        </span>
      )}
    </div>
  );

  if (disabled || !href) return content;

  return <Link href={href}>{content}</Link>;
}
