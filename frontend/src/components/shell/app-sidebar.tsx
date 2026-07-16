import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";
import type { ContagemSetor } from "@/lib/insights";

interface AppSidebarProps {
  contagens: Record<string, ContagemSetor>;
}

export function AppSidebar({ contagens }: AppSidebarProps) {
  return (
    // Sidebar escura no padrão do Protótipo 1 (P036) — bloco fixo com borda
    // sutil, reverte a sidebar clara da missão P025 a pedido explícito do CEO.
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="border-b border-sidebar-border px-5 py-5">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <p className="mb-1.5 px-3 text-[10.5px] font-semibold tracking-widest text-sidebar-foreground/45 uppercase">
          Navegação
        </p>
        <SidebarNav contagens={contagens} />
      </div>

      <div className="border-t border-sidebar-border px-5 py-4">
        <Tooltip>
          <TooltipTrigger
            render={<span className="inline-flex cursor-help items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground/50" />}
          >
            <ShieldCheck className="size-3.5" strokeWidth={2.25} />
            Trabalha junto com o AUTEM
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-60 text-pretty">
            O AUTEM continua sendo o sistema principal do ASA Reboques. Esta plataforma organiza e centraliza a
            rotina da operação — sem substituir nada.
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
