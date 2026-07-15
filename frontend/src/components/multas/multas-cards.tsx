"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, CircleCheckBig, UserCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { Sigla } from "@/components/sigla";
import { FROTA, diasRestantes, formatarData, formatarMoeda, type Multa } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Multas como decisões, não como registros (P025): o prazo de indicação é o
 * que importa — ele fica gigante. A ação explica o que faz e o que evita.
 */

interface LinhaMulta extends Multa {
  placa: string;
  motorista: string;
}

const TODAS: LinhaMulta[] = FROTA.flatMap((v) =>
  v.multas.map((m) => ({ ...m, placa: v.placa, motorista: v.motorista }))
).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MultasCards() {
  const [multas, setMultas] = useState(TODAS);
  const [mostrarResolvidas, setMostrarResolvidas] = useState(false);

  const abertas = multas.filter((m) => m.status === "aguardando_indicacao");
  const resolvidas = multas.filter((m) => m.status !== "aguardando_indicacao");

  function indicar(id: string) {
    const multa = multas.find((m) => m.id === id);
    setMultas((atual) => atual.map((m) => (m.id === id ? { ...m, status: "indicada" as const } : m)));
    toast.success(`Condutor indicado para a multa ${id}`, {
      description: multa
        ? `${multa.motorista} registrado como condutor. O valor de ${formatarMoeda(multa.valor)} não será agravado.`
        : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {abertas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheckBig className="size-5" strokeWidth={2} />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Nenhuma multa com prazo correndo. Quando uma chegar, o prazo de indicação aparece aqui em contagem
            regressiva.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {abertas.map((m) => {
            const prazo = m.prazoIndicacao ? diasRestantes(m.prazoIndicacao) : null;
            const urgente = prazo !== null && prazo <= 3;
            return (
              <motion.div
                key={m.id}
                variants={item}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-5",
                  urgente ? "border-destructive/25 border-l-4 border-l-destructive" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn("flex items-center gap-1.5 text-lg font-semibold tracking-tight", urgente ? "text-destructive" : "text-foreground")}>
                      <Clock3 className="size-4.5" strokeWidth={2.25} />
                      {prazo === null ? "Sem prazo definido" : prazo < 0 ? `Prazo estourado há ${Math.abs(prazo)} dia(s)` : `${prazo} dia(s) para indicar o condutor`}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {m.prazoIndicacao ? `Prazo final: ${formatarData(m.prazoIndicacao)} · ` : ""}
                      autuação de <Sigla termo={m.orgao} /> em {formatarData(m.data)}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold tabular-nums text-foreground">{formatarMoeda(m.valor)}</p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
                  <span className="flex items-center gap-2">
                    <PessoaAvatar nome={m.motorista} />
                    <Link
                      href={`/gestao-da-frota/veiculos/${m.placa}`}
                      className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {m.placa}
                    </Link>
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button size="sm" className="gap-1.5" onClick={() => indicar(m.id)} />
                      }
                    >
                      <UserCheck className="size-4" /> Indicar condutor
                    </TooltipTrigger>
                    <TooltipContent className="max-w-60 text-pretty">
                      Registra quem dirigia no momento da autuação. Sem a indicação no prazo, a multa pode dobrar de
                      valor para a empresa.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {resolvidas.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            onClick={() => setMostrarResolvidas((v) => !v)}
            className="flex w-fit items-center gap-2 rounded-lg py-1 text-[15px] font-semibold text-foreground transition-colors hover:text-primary"
          >
            <CircleCheckBig className="size-4.5 text-success" strokeWidth={2.25} />
            Resolvidas ({resolvidas.length})
            <ChevronDown
              className={cn("size-4 text-muted-foreground transition-transform", !mostrarResolvidas && "-rotate-90")}
            />
          </button>

          {mostrarResolvidas && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <ul className="divide-y divide-border">
                {resolvidas.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-20 shrink-0 rounded-md bg-secondary px-2 py-0.5 text-center font-mono text-xs font-semibold text-secondary-foreground">
                      {m.placa}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      <Sigla termo={m.orgao} /> · {formatarData(m.data)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatarMoeda(m.valor)}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        m.status === "paga" ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {m.status === "paga" ? "Paga" : "Condutor indicado"}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
}
