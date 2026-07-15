"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { indicadoresExecutivos, type CardExecutivo } from "@/lib/insights";
import { cn } from "@/lib/utils";

const TOM: Record<CardExecutivo["tom"], string> = {
  ok: "text-success",
  atencao: "text-warning",
  critico: "text-destructive",
  neutro: "text-foreground",
};

function ValorAnimado({ valor }: { valor: string }) {
  const numero = parseFloat(valor.replace(/[^\d.-]/g, ""));
  const ehSoNumero = !Number.isNaN(numero) && String(numero) === valor.replace(/^0+(?=\d)/, "");
  const mv = useMotionValue(0);
  const texto = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!ehSoNumero) return;
    const controls = animate(mv, numero, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, numero, ehSoNumero]);

  if (!ehSoNumero) return <>{valor}</>;
  return <motion.span suppressHydrationWarning>{texto}</motion.span>;
}

/**
 * Os seis números que abrem a leitura executiva do dia — grandes,
 * clicáveis, cada um levando direto ao setor que o explica (P034).
 */
export function DashboardExecutivo() {
  const cards = indicadoresExecutivos();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <Link
          key={c.rotulo}
          href={c.href}
          className="group flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <p className={cn("text-2xl font-bold tracking-tight tabular-nums", TOM[c.tom])}>
            <ValorAnimado valor={c.valor} />
          </p>
          <p className="text-[12.5px] font-medium text-foreground/80">{c.rotulo}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">{c.detalhe}</p>
        </Link>
      ))}
    </div>
  );
}
