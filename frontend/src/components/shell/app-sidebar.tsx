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
    // Sem bloco, sem borda: a navegação flutua sobre o mesmo fundo da página —
    // a moldura desaparece e sobra conteúdo (P029).
    <aside className="hidden w-64 shrink-0 flex-col md:flex">
      <div className="px-6 pt-7 pb-6">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <SidebarNav contagens={contagens} />
      </div>

      <div className="px-6 py-4">
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
