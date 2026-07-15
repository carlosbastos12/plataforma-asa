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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-4 pt-6 pb-5">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav contagens={contagens} />
      </div>

      <div className="border-t border-sidebar-border px-4 py-3">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex cursor-help items-center gap-1.5 text-[11px] font-medium text-sidebar-foreground/45" />
            }
          >
            <ShieldCheck className="size-3.5" strokeWidth={2.25} />
            Trabalha junto com o AUTEM
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-60 text-pretty">
            O AUTEM continua sendo o sistema principal da ASA. Esta plataforma organiza e centraliza a rotina
            da operação — sem substituir nada.
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
