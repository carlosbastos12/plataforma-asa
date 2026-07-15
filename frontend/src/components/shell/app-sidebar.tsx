import { ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";

interface AppSidebarProps {
  contagens: Record<string, number>;
}

export function AppSidebar({ contagens }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-4 pt-6 pb-5">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav contagens={contagens} />
      </div>

      <div className="mx-3 mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-sidebar-foreground/80">
          <ShieldCheck className="size-4 text-sidebar-primary" strokeWidth={2.25} />
          <span className="text-xs font-medium">Camada complementar</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sidebar-foreground/50">
          O AUTEM continua sendo o sistema principal. Esta plataforma organiza o que hoje só existe em planilha ou papel.
        </p>
      </div>
    </aside>
  );
}
