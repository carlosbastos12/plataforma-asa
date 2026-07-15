"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle, Wallet2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatCard } from "@/components/home/stat-card";
import { CAIXA, formatarData, formatarMoeda } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CaixaView() {
  const [selecionada, setSelecionada] = useState(CAIXA[0].data);
  const [fechadosNestaSessao, setFechadosNestaSessao] = useState<Set<string>>(new Set());
  const [fechando, setFechando] = useState(false);

  const dia = CAIXA.find((c) => c.data === selecionada) ?? CAIXA[0];
  const estaFechado = dia.status === "fechado" || fechadosNestaSessao.has(dia.data);

  const entradas = dia.lancamentos.filter((l) => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const saidas = dia.lancamentos.filter((l) => l.tipo === "saida").reduce((acc, l) => acc - l.valor, 0);
  const saldo = entradas - saidas;

  function fecharCaixa() {
    setFechando(true);
    // pequena espera simulada — reforça que a ação foi processada, não é instantânea "demais"
    setTimeout(() => {
      setFechadosNestaSessao((atual) => new Set(atual).add(dia.data));
      setFechando(false);
      toast.success(`Caixa de ${formatarData(dia.data)} fechado`, {
        description: `Saldo conferido: ${formatarMoeda(saldo)}. (ação simulada nesta demonstração)`,
      });
    }, 700);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {CAIXA.map((c, i) => {
          const abertoDeVerdade = c.status === "aberto" && !fechadosNestaSessao.has(c.data);
          return (
            <button
              key={c.data}
              onClick={() => setSelecionada(c.data)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                c.data === selecionada
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {abertoDeVerdade && c.data !== selecionada && <span className="size-1.5 rounded-full bg-warning" />}
              {formatarData(c.data)}
              {i === 0 && " (hoje)"}
            </button>
          );
        })}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={ArrowDownCircle} label="entradas do dia" value={formatarMoeda(entradas)} tone="success" />
        <StatCard icon={ArrowUpCircle} label="saídas do dia" value={formatarMoeda(saidas)} tone="warning" />
        <StatCard icon={Wallet2} label="saldo do dia" value={formatarMoeda(saldo)} />
      </section>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Lançamentos de {formatarData(dia.data)}</p>
            <p className="text-xs text-muted-foreground">{dia.lancamentos.length} registro(s)</p>
          </div>
          {estaFechado ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" /> Fechado
            </span>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={<Button size="sm" className="gap-1.5" onClick={fecharCaixa} disabled={fechando} />}
              >
                {fechando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {fechando ? "Fechando..." : "Fechar caixa do dia"}
              </TooltipTrigger>
              <TooltipContent className="max-w-60 text-pretty">
                Confere e trava o saldo do dia. Fechado no mesmo dia, o caixa nunca acumula divergência para o fim do
                mês.
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <ul className="divide-y divide-border">
          {dia.lancamentos.map((l, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm">
              <span className="w-14 shrink-0 text-xs text-muted-foreground">{l.hora}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{l.descricao}</span>
              {l.placa && (
                <span className="placa-chip hidden shrink-0 rounded-md px-2 py-0.5 font-mono text-xs sm:inline">
                  {l.placa}
                </span>
              )}
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{l.forma}</span>
              <span
                className={cn(
                  "w-24 shrink-0 text-right text-sm font-semibold",
                  l.valor > 0 ? "text-success" : "text-destructive"
                )}
              >
                {l.valor > 0 ? "+" : ""}
                {formatarMoeda(l.valor)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
