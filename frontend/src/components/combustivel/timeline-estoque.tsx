import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatarData } from "@/lib/mock-data";
import type { MovimentacaoTanque } from "@/lib/combustivel";

function litros(v: number): string {
  return `${v.toLocaleString("pt-BR")} L`;
}

/**
 * Extrato do estoque, como um extrato bancário: cada linha é uma entrada ou
 * saída, na ordem em que aconteceu — sem precisar abrir planilha nenhuma
 * para saber o que mexeu no tanque (P036).
 */
export function TimelineEstoque({ movimentacoes }: { movimentacoes: MovimentacaoTanque[] }) {
  const ordenadas = [...movimentacoes].sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

  return (
    <Panel>
      <PanelHeader title="Movimentações do Estoque" subtitle="Entradas e saídas do tanque da base, em ordem cronológica" />
      <ol className="flex flex-col divide-y divide-border">
        {ordenadas.map((m, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className={m.tipo === "entrada" ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success" : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"}>
              {m.tipo === "entrada" ? <ArrowDownCircle className="size-4" strokeWidth={2.25} /> : <ArrowUpCircle className="size-4" strokeWidth={2.25} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">
                {m.tipo === "entrada" ? "Entrada" : "Saída"} {m.placa ? `— ${m.placa}` : m.fornecedor ? `— ${m.fornecedor}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatarData(m.data)} · {m.responsavel}
              </p>
            </div>
            <span className={m.tipo === "entrada" ? "shrink-0 text-sm font-bold text-success" : "shrink-0 text-sm font-bold text-foreground"}>
              {m.tipo === "entrada" ? "+" : "−"}
              {litros(m.litros)}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
