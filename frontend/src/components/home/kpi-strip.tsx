"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { AlertTriangle, Truck, Radio, Wallet2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Indicadores } from "@/lib/insights";
import { cn } from "@/lib/utils";

/**
 * Faixa executiva: os 4 números que um diretor lê antes de qualquer lista.
 * Cada indicador explica no hover como foi calculado — o sistema mostra a
 * conta, não pede confiança cega. Números entram com count-up: parecem
 * calculados agora, não digitados.
 */

function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function NumeroAnimado({ valor, formato }: { valor: number; formato: (v: number) => string }) {
  const mv = useMotionValue(0);
  const texto = useTransform(mv, (v) => formato(v));

  useEffect(() => {
    const controls = animate(mv, valor, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, valor]);

  return <motion.span suppressHydrationWarning>{texto}</motion.span>;
}

interface Kpi {
  href: string;
  icon: LucideIcon;
  valor: number;
  formato: (v: number) => string;
  rotulo: string;
  detalhe: string;
  comoCalcula: string;
  tom: "alerta" | "ok" | "info" | "neutro";
}

const TOM: Record<Kpi["tom"], string> = {
  alerta: "bg-warning-soft text-warning",
  ok: "bg-success-soft text-success",
  info: "bg-[color-mix(in_oklch,var(--chart-3)_15%,transparent)] text-[var(--chart-3)]",
  neutro: "bg-secondary text-secondary-foreground",
};

export function KpiStrip({ indicadores }: { indicadores: Indicadores }) {
  const i = indicadores;

  const kpis: Kpi[] = [
    {
      href: "/gestao-da-frota/multas",
      icon: AlertTriangle,
      valor: i.valorEmRisco,
      formato: moeda,
      rotulo: "em risco de prejuízo",
      detalhe: `${i.multasAguardando} multa(s) com prazo de indicação correndo`,
      comoCalcula: "Soma das multas aguardando indicação de condutor. Sem indicação no prazo, o valor pode dobrar.",
      tom: "alerta",
    },
    {
      href: "/gestao-da-frota/veiculos",
      icon: Truck,
      valor: i.frotaApta,
      formato: (v) => `${Math.round(v)} de ${i.frotaTotal}`,
      rotulo: "veículos aptos a operar",
      detalhe: `${i.veiculosCriticos} veículo(s) com pendência vencida`,
      comoCalcula: "Veículos sem documento vencido e sem multa com prazo estourando. Os demais podem gerar multa ou retenção se rodarem.",
      tom: i.veiculosCriticos > 0 ? "neutro" : "ok",
    },
    {
      href: "/acionamento",
      icon: Radio,
      valor: i.chamadosAguardando,
      formato: (v) => `${Math.round(v)}`,
      rotulo: "chamados na fila",
      detalhe: "aguardando despacho de motorista",
      comoCalcula: "Chamados abertos que ainda não têm motorista a caminho. Cada minuto na fila é um cliente esperando na estrada.",
      tom: "info",
    },
    {
      href: "/fechamento/caixa",
      icon: Wallet2,
      valor: i.saldoDoDia,
      formato: moeda,
      rotulo: "no caixa de hoje",
      detalhe: `${i.caixasEmAberto} dia(s) aguardando fechamento`,
      comoCalcula: "Entradas menos saídas do dia atual do Caixa Particular. O fechamento confere e trava o valor.",
      tom: "neutro",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Tooltip key={kpi.href + kpi.rotulo}>
          <TooltipTrigger render={<span className="flex" />}>
            <Link
              href={kpi.href}
              className="group flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className={cn("flex size-9 items-center justify-center rounded-lg", TOM[kpi.tom])}>
                <kpi.icon className="size-[17px]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  <NumeroAnimado valor={kpi.valor} formato={kpi.formato} />
                </p>
                <p className="mt-1 text-[13px] font-medium text-foreground/80">{kpi.rotulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent className="max-w-64 text-pretty">{kpi.comoCalcula}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
