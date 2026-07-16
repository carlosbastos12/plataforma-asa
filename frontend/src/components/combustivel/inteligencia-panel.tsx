import { Sparkles, CircleCheckBig, TriangleAlert } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { InsightCombustivel } from "@/lib/combustivel";

/** "O sistema identificou": leitura pronta sobre o estoque, sem exigir que ninguém cruze números (P036). */
export function InteligenciaPanel({ insights }: { insights: InsightCombustivel[] }) {
  return (
    <Panel>
      <PanelHeader title="Inteligência Operacional" />
      <div className="flex flex-col gap-1 p-3">
        <p className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] font-semibold text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" strokeWidth={2.25} />
          O sistema identificou
        </p>
        {insights.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-lg px-2 py-2">
            {item.atencao ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2.25} />
            ) : (
              <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} />
            )}
            <p className="text-[13px] leading-relaxed text-foreground">{item.texto}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
