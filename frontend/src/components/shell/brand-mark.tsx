import { Compass } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Compass className="size-[18px]" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-sidebar-foreground">Plataforma ASA</div>
        <div className="text-[11px] text-sidebar-foreground/55">Central de Operações</div>
      </div>
    </div>
  );
}
