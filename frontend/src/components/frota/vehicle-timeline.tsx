import { FileCheck2, ShieldAlert, Wrench } from "lucide-react";
import { formatarData, formatarMoeda, type Veiculo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface EventoTimeline {
  data: string;
  titulo: string;
  descricao: string;
  tom: "neutro" | "critico" | "regular";
  icone: typeof FileCheck2;
}

export function VehicleTimeline({ veiculo }: { veiculo: Veiculo }) {
  const eventos: EventoTimeline[] = [
    ...veiculo.docs.map((d) => ({
      data: d.emissao,
      titulo: `${d.tipo} emitido`,
      descricao: `Válido até ${formatarData(d.vencimento)}`,
      tom: "regular" as const,
      icone: FileCheck2,
    })),
    ...veiculo.multas.map((m) => ({
      data: m.data,
      titulo: `Multa registrada — ${m.orgao}`,
      descricao: `${formatarMoeda(m.valor)} · ${m.status === "paga" ? "Paga" : "Aguardando indicação"}`,
      tom: m.status === "paga" ? ("regular" as const) : ("critico" as const),
      icone: ShieldAlert,
    })),
    ...veiculo.manutencoes.map((m) => ({
      data: m.data,
      titulo: m.servico,
      descricao: `${m.oficina} · ${formatarMoeda(m.valor)} · ${m.km.toLocaleString("pt-BR")} km`,
      tom: "neutro" as const,
      icone: Wrench,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (eventos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Ainda não há eventos registrados para este veículo.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
      {eventos.map((e, i) => {
        const Icon = e.icone;
        return (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-[29px] flex size-4 items-center justify-center rounded-full border-2 bg-background",
                e.tom === "critico" && "border-destructive text-destructive",
                e.tom === "regular" && "border-success text-success",
                e.tom === "neutro" && "border-muted-foreground/40 text-muted-foreground"
              )}
            >
              <Icon className="size-2.5" strokeWidth={3} />
            </span>
            <p className="text-xs font-medium text-muted-foreground">{formatarData(e.data)}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{e.titulo}</p>
            <p className="text-[13px] text-muted-foreground">{e.descricao}</p>
          </li>
        );
      })}
    </ol>
  );
}
