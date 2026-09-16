import { formatarMoeda, totalPecas, totalServicosTerceirizados, totalManutencao, type Manutencao } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Corpo completo de UMA manutenção — peças, serviços e totais. Reaproveitado
 * tanto no prontuário do veículo (histórico) quanto no módulo Manutenção
 * (visão da frota inteira), para não duplicar a lógica dos dois lados.
 */
export function ManutencaoDetalhe({ manutencao: m }: { manutencao: Manutencao }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-[13px] font-medium text-muted-foreground">Peças utilizadas</p>
        {m.pecas.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Nenhuma peça registrada nesta manutenção.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {m.pecas.map((p, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium text-foreground">{p.nome}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        p.origem === "estoque_proprio" ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {p.origem === "estoque_proprio" ? "Estoque próprio" : "Compra para esta manutenção"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {p.qtd}x {formatarMoeda(p.valorUnitario)}
                    {p.codigo ? ` · Código ${p.codigo}` : ""}
                    {p.fornecedor ? ` · ${p.fornecedor}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatarMoeda(p.qtd * p.valorUnitario)}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-right text-[13px] font-medium text-foreground">Total de peças: {formatarMoeda(totalPecas(m))}</p>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-muted-foreground">Serviços realizados</p>
        {m.servicos.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Nenhum serviço registrado nesta manutenção.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {m.servicos.map((s, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium text-foreground">{s.descricao}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        s.origem === "propria" ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {s.origem === "propria" ? "Serviço próprio" : "Serviço terceirizado"}
                    </span>
                  </div>
                  {s.prestador && <p className="mt-0.5 text-[13px] text-muted-foreground">{s.prestador}</p>}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatarMoeda(s.valor)}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-right text-[13px] font-medium text-foreground">
          Total de serviços terceirizados: {formatarMoeda(totalServicosTerceirizados(m))}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Total da manutenção</p>
        <p className="text-base font-bold tabular-nums text-foreground">{formatarMoeda(totalManutencao(m))}</p>
      </div>
    </div>
  );
}
