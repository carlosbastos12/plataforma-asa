"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import type { ContagemSetor } from "@/lib/insights";

interface SidebarNavProps {
  contagens: Record<string, ContagemSetor>;
  onNavigate?: () => void;
}

export function SidebarNav({ contagens, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item, index) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        const contagem = contagens[item.href];

        return (
          <div key={item.href}>
            {index === 1 && (
              <p className="mt-4 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                Setores
              </p>
            )}
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                )}
                strokeWidth={2}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {contagem && contagem.total > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="flex h-5 min-w-5 cursor-default items-center justify-center rounded-full bg-destructive-soft px-1.5 text-[11px] font-semibold text-destructive" />
                    }
                  >
                    {contagem.total}
                  </TooltipTrigger>
                  <TooltipContent side="right">{contagem.explicacao}</TooltipContent>
                </Tooltip>
              )}
            </Link>

            {item.children && (
              <div className="mt-0.5 mb-1 ml-[26px] flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                {item.children.map((child) => {
                  const childActive = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-[13px] transition-colors",
                        childActive
                          ? "font-medium text-sidebar-primary"
                          : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
