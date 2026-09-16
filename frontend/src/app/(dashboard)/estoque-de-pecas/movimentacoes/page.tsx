import type { Metadata } from "next";
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ALMOXARIFADO, MOVIMENTACOES_ESTOQUE, formatarData, type TipoMovimentacaoEstoque } from "@/lib/mock-data";
import { ComoFunciona, type TopicoAjuda } from "@/components/ajuda/como-funciona";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Movimentações de Estoque",
};

const AJUDA_MOVIMENTACOES: TopicoAjuda[] = [
  {
    titulo: "Ainda é uma demonstração",
    texto: "Nesta versão, as movimentações são simuladas. A integração real com o estoque será implementada posteriormente.",
  },
];

const ICONE: Record<TipoMovimentacaoEstoque, LucideIcon> = { entrada: ArrowDownCircle, saida: ArrowUpCircle, ajuste: RefreshCcw };
const LABEL: Record<TipoMovimentacaoEstoque, string> = { entrada: "Entrada", saida: "Saída", ajuste: "Ajuste" };
const TOM: Record<TipoMovimentacaoEstoque, string> = {
  entrada: "bg-success-soft text-success",
  saida: "bg-warning-soft text-warning",
  ajuste: "bg-secondary text-secondary-foreground",
};

export default function MovimentacoesPage() {
  const ordenadas = [...MOVIMENTACOES_ESTOQUE].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Movimentações do estoque</h2>
          <p className="text-sm text-muted-foreground">
            Entradas, saídas para manutenção e ajustes — histórico fictício, sem baixa automática de saldo.
          </p>
        </div>
        <ComoFunciona
          titulo="Como funcionam as movimentações?"
          resumo="Registra entradas e saídas de peças. Uma saída pode ocorrer quando uma peça é utilizada em uma manutenção."
          topicos={AJUDA_MOVIMENTACOES}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {ordenadas.map((mv) => {
            const item = ALMOXARIFADO.find((i) => i.id === mv.itemId);
            const Icon = ICONE[mv.tipo];
            return (
              <li key={mv.id} className="flex items-center gap-4 px-5 py-4">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TOM[mv.tipo])}>
                  <Icon className="size-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {LABEL[mv.tipo]} · {item?.nome ?? mv.itemId}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {formatarData(mv.data)} · {Math.abs(mv.quantidade)} unidade(s)
                    {mv.destino ? ` · Destino: ${mv.destino}` : ""}
                    {mv.observacao ? ` · ${mv.observacao}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Conceito de demonstração: histórico fictício de movimentações, sem persistência — o saldo mostrado na aba
        Estoque não é recalculado a partir destes registros.
      </p>
    </div>
  );
}
