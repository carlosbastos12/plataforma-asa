"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, PLATAFORMA_ITEMS, type NavItem } from "./nav-items";
import type { ContagemSetor } from "@/lib/insights";

interface SidebarNavProps {
  contagens: Record<string, ContagemSetor>;
  onNavigate?: () => void;
}

function RotuloGrupo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
      {children}
    </p>
  );
}

function ItemNav({
  item,
  contagem,
  onNavigate,
}: {
  item: NavItem;
  contagem?: ContagemSetor;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                // Item ativo sólido (P036): clone do Protótipo 1
                // (`.nav-item.active { background: var(--brand); color:#fff }`).
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
              )}
            />
          }
        >
          <Icon
            className={cn("size-[18px] shrink-0 transition-colors", active ? "text-white" : "text-sidebar-foreground/85 group-hover:text-white")}
            strokeWidth={2}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {contagem && contagem.total > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">
              {contagem.total}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-64 flex-col items-start gap-0 text-pretty">
          <p className="font-medium">{item.description}.</p>
          <p className="mt-1 opacity-85">{item.beneficio}</p>
          {contagem && contagem.total > 0 && <p className="mt-1 opacity-85">Agora: {contagem.explicacao}.</p>}
        </TooltipContent>
      </Tooltip>

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
}

export function SidebarNav({ contagens, onNavigate }: SidebarNavProps) {
  const [central, ...setores] = NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1">
      <ItemNav item={central} contagem={contagens[central.href]} onNavigate={onNavigate} />

      <RotuloGrupo>Setores</RotuloGrupo>
      {setores.map((item) => (
        <ItemNav key={item.href} item={item} contagem={contagens[item.href]} onNavigate={onNavigate} />
      ))}

      <RotuloGrupo>Plataforma</RotuloGrupo>
      {PLATAFORMA_ITEMS.map((item) => (
        <ItemNav key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
