"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ManutencaoFormDialog } from "./manutencao-form-dialog";
import { ManutencaoDetalhe } from "./manutencao-detalhe";
import { TipoManutencaoBadge, StatusManutencaoBadge } from "./badges";
import { MANUTENCOES, FROTA, formatarData, formatarMoeda, totalManutencao, type Manutencao } from "@/lib/mock-data";

/**
 * Todas as manutenções da frota (módulo Manutenção). Estado local iniciado
 * com o mock MANUTENCOES — "+ Adicionar manutenção" aparece na lista da
 * mesma sessão, sem gravar em nenhum lugar (mesmo padrão de Combustível).
 */
export function ManutencoesView() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(MANUTENCOES);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const ordenadas = [...manutencoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const selecionada = manutencoes.find((m) => m.id === detalheId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Todas as manutenções da frota</h2>
          <p className="text-sm text-muted-foreground">{manutencoes.length} registro(s) — peças, serviços e custo de cada um.</p>
        </div>
        <ManutencaoFormDialog onRegistrar={(m) => setManutencoes((atual) => [m, ...atual])} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {ordenadas.map((m) => {
            const veiculo = FROTA.find((v) => v.placa === m.placa);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setDetalheId(m.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Wrench className="size-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">{m.placa}</span>
                      <p className="text-sm font-medium text-foreground">{m.descricao}</p>
                      <TipoManutencaoBadge tipo={m.tipo} />
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {formatarData(m.data)} · {m.km.toLocaleString("pt-BR")} km · {veiculo?.modelo ?? m.placa} · {m.pecas.length}{" "}
                      peça(s) · {m.servicos.length} serviço(s)
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{formatarMoeda(totalManutencao(m))}</p>
                    <div className="mt-1">
                      <StatusManutencaoBadge status={m.status} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={!!selecionada} onOpenChange={(v) => !v && setDetalheId(null)}>
        {selecionada && (
          <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto p-6 sm:max-w-lg">
            <DialogTitle>{selecionada.descricao}</DialogTitle>
            <DialogDescription>
              {selecionada.placa} · {formatarData(selecionada.data)} · {selecionada.km.toLocaleString("pt-BR")} km
            </DialogDescription>
            <div className="flex items-center gap-2">
              <TipoManutencaoBadge tipo={selecionada.tipo} />
              <StatusManutencaoBadge status={selecionada.status} />
            </div>
            <ManutencaoDetalhe manutencao={selecionada} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
