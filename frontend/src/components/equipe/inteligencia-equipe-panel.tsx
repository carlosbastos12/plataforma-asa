import { Sparkles, CircleCheckBig, TriangleAlert, AlertTriangle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { InsightEquipe, AlertaEquipe, AtividadeRecente } from "@/lib/equipe";

export function InteligenciaEquipePanel({ insights }: { insights: InsightEquipe[] }) {
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

export function AlertasEquipePanel({ alertas }: { alertas: AlertaEquipe[] }) {
  if (alertas.length === 0) return null;
  return (
    <Panel className="border-warning/25">
      <PanelHeader title="Atenção necessária" />
      <ul className="flex flex-col divide-y divide-border">
        {alertas.map((a, i) => (
          <li key={i} className="flex items-start gap-2.5 px-5 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2.25} />
            <p className="text-[13px] leading-relaxed text-foreground">{a.texto}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function TimelineEquipePanel({ atividades }: { atividades: AtividadeRecente[] }) {
  return (
    <Panel>
      <PanelHeader title="Atividade recente" />
      <ol className="flex flex-col divide-y divide-border">
        {atividades.map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.quando}</p>
              <p className="mt-0.5 text-[13px] text-foreground">{a.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
