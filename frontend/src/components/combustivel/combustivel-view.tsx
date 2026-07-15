"use client";

import Link from "next/link";
import { Fuel, Gauge, TrendingDown, Wallet2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/home/stat-card";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { formatarData, formatarMoeda } from "@/lib/mock-data";
import {
  TANQUE_BASE,
  MOVIMENTACOES_TANQUE,
  ABASTECIMENTOS_EXTERNOS,
  diasDeAutonomiaTanque,
  percentualTanque,
  totalLitrosExternos30dias,
  totalGastoExternos30dias,
} from "@/lib/combustivel";

function litros(v: number): string {
  return `${v.toLocaleString("pt-BR")} L`;
}

/**
 * Combustível como dois fluxos reais (P033, VDC-001 dores 5 e 15): o tanque
 * da base e o abastecimento em posto durante viagem hoje vivem separados —
 * aqui aparecem lado a lado, com a mesma linguagem de estado → ação.
 */
export function CombustivelView() {
  const autonomia = diasDeAutonomiaTanque();
  const percentual = percentualTanque();

  return (
    <Tabs defaultValue="tanque">
      <TabsList>
        <TabsTrigger value="tanque">Tanque da Base</TabsTrigger>
        <TabsTrigger value="externo">Abastecimento Externo</TabsTrigger>
      </TabsList>

      <TabsContent value="tanque" className="mt-5 flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Estoque atual</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {litros(TANQUE_BASE.estoqueLitros)}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {autonomia <= 3
                  ? `Atende apenas mais ${autonomia} dia(s) no ritmo atual — vale programar reposição.`
                  : `Atende aproximadamente mais ${autonomia} dias, no ritmo atual de consumo.`}
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Fuel className="size-5" strokeWidth={2} />
            </div>
          </div>
          <Progress value={percentual} className="mt-4" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {percentual}% da capacidade de {litros(TANQUE_BASE.capacidadeLitros)} · fornecedor {TANQUE_BASE.fornecedor}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            icon={Gauge}
            label="consumo médio diário"
            value={litros(TANQUE_BASE.consumoMedioDiarioLitros)}
            hint="Base para calcular quantos dias o estoque ainda cobre."
          />
          <StatCard
            icon={ArrowDownCircle}
            label="última entrada"
            value={formatarData(TANQUE_BASE.ultimaEntrada)}
            hint={TANQUE_BASE.fornecedor}
          />
        </section>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold text-foreground">Movimentações recentes</p>
            <p className="text-xs text-muted-foreground">Cada saída já sai vinculada ao veículo e ao motorista.</p>
          </div>
          <ul className="divide-y divide-border">
            {MOVIMENTACOES_TANQUE.map((m, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <div
                  className={
                    m.tipo === "entrada"
                      ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"
                      : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                  }
                >
                  {m.tipo === "entrada" ? (
                    <ArrowDownCircle className="size-4" strokeWidth={2.25} />
                  ) : (
                    <ArrowUpCircle className="size-4" strokeWidth={2.25} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground">{m.descricao}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatarData(m.data)} · {m.hora} · {m.responsavel}
                    {m.placa ? ` · ${m.placa}` : ""}
                  </p>
                </div>
                <span
                  className={
                    m.tipo === "entrada"
                      ? "shrink-0 text-sm font-semibold text-success"
                      : "shrink-0 text-sm font-semibold text-foreground"
                  }
                >
                  {m.tipo === "entrada" ? "+" : "-"}
                  {litros(m.litros)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="externo" className="mt-5 flex flex-col gap-5">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={Fuel} label="litros em 30 dias" value={litros(totalLitrosExternos30dias())} tone="default" />
          <StatCard icon={Wallet2} label="gasto em 30 dias" value={formatarMoeda(totalGastoExternos30dias())} tone="default" />
          <StatCard
            icon={TrendingDown}
            label="abastecimentos registrados"
            value={String(ABASTECIMENTOS_EXTERNOS.length)}
            hint="Postos fora da base, durante viagem."
          />
        </section>

        <p className="text-[13px] text-muted-foreground">
          Cada abastecimento já sai com posto, motorista, viagem, litros e valor prontos — a prestação de contas do
          motorista não depende de recibo guardado.
        </p>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {ABASTECIMENTOS_EXTERNOS.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <PessoaAvatar nome={a.motorista} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {a.posto}
                    <Link
                      href={`/gestao-da-frota/veiculos/${a.placa}`}
                      className="placa-chip ml-2 rounded-md px-1.5 py-0.5 font-mono text-[11px] align-middle transition-opacity hover:opacity-80"
                    >
                      {a.placa}
                    </Link>
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {a.motorista} · {a.viagem} · {formatarData(a.data)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">{formatarMoeda(a.valor)}</p>
                  <p className="text-xs text-muted-foreground">{litros(a.litros)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
