"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { Sigla } from "@/components/sigla";
import { FROTA, statusVencimento, diasRestantes, formatarData, type DocStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Documentação organizada por urgência, não por registro (P025):
 * o que já venceu grita, o que está chegando avisa, e o que está em dia
 * sai da frente — colapsado atrás de um check verde.
 */

interface Doc {
  placa: string;
  motorista: string;
  tipo: string;
  vencimento: string;
  dias: number;
  status: DocStatus;
}

const TODOS: Doc[] = FROTA.flatMap((v) =>
  v.docs.map((d) => ({
    placa: v.placa,
    motorista: v.motorista,
    tipo: d.tipo,
    vencimento: d.vencimento,
    dias: diasRestantes(d.vencimento),
    status: statusVencimento(d.vencimento),
  }))
).sort((a, b) => a.dias - b.dias);

const VENCIDOS = TODOS.filter((d) => d.status === "critico");
const VENCENDO = TODOS.filter((d) => d.status === "atencao");
const EM_DIA = TODOS.filter((d) => d.status === "regular");

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } },
};

function CardVencido({ doc }: { doc: Doc }) {
  return (
    <motion.div variants={item}>
      <Link
        href={`/gestao-da-frota/veiculos/${doc.placa}`}
        className="group flex h-full flex-col gap-2.5 rounded-2xl border border-destructive/25 border-l-4 border-l-destructive bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-semibold text-foreground">
            <Sigla termo={doc.tipo} /> vencido
          </p>
          <span className="shrink-0 rounded-full bg-destructive-soft px-2.5 py-0.5 text-xs font-semibold text-destructive">
            há {Math.abs(doc.dias)} dia(s)
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Venceu em {formatarData(doc.vencimento)}. Rodando assim, o veículo está sujeito a multa e retenção.
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="flex items-center gap-2">
            <PessoaAvatar nome={doc.motorista} />
            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-secondary-foreground">
              {doc.placa}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Ver veículo <ChevronRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function CardVencendo({ doc }: { doc: Doc }) {
  return (
    <motion.div variants={item}>
      <Link
        href={`/gestao-da-frota/veiculos/${doc.placa}`}
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-xs font-bold text-warning">
          {doc.dias}d
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            <Sigla termo={doc.tipo} /> — {doc.placa}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Vence em {formatarData(doc.vencimento)} · renovar agora evita parar o veículo
          </p>
        </div>
        <PessoaAvatar nome={doc.motorista} className="shrink-0" />
      </Link>
    </motion.div>
  );
}

export function DocumentacaoPorUrgencia() {
  const [mostrarEmDia, setMostrarEmDia] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {VENCIDOS.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-foreground">Vencidos</h3>
            <span className="text-[13px] text-muted-foreground">
              {VENCIDOS.length} documento(s) — resolver antes de rodar
            </span>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {VENCIDOS.map((d) => (
              <CardVencido key={d.placa + d.tipo} doc={d} />
            ))}
          </motion.div>
        </section>
      )}

      {VENCENDO.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-foreground">Vencem nos próximos 15 dias</h3>
            <span className="text-[13px] text-muted-foreground">{VENCENDO.length} documento(s) — dá para programar</span>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-2.5 lg:grid-cols-2"
          >
            {VENCENDO.map((d) => (
              <CardVencendo key={d.placa + d.tipo} doc={d} />
            ))}
          </motion.div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <button
          onClick={() => setMostrarEmDia((v) => !v)}
          className="group flex w-fit items-center gap-2 rounded-lg py-1 text-[15px] font-semibold text-foreground transition-colors hover:text-primary"
        >
          <CircleCheckBig className="size-4.5 text-success" strokeWidth={2.25} />
          Em dia ({EM_DIA.length})
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !mostrarEmDia && "-rotate-90")} />
        </button>
        <p className="-mt-2 text-[13px] text-muted-foreground">
          Nada aqui pede sua atenção — o sistema avisa quando qualquer um entrar na janela de 15 dias.
        </p>

        {mostrarEmDia && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <ul className="divide-y divide-border">
              {EM_DIA.map((d) => (
                <li key={d.placa + d.tipo}>
                  <Link
                    href={`/gestao-da-frota/veiculos/${d.placa}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/50"
                  >
                    <span className="w-20 shrink-0 rounded-md bg-secondary px-2 py-0.5 text-center font-mono text-xs font-semibold text-secondary-foreground">
                      {d.placa}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      <Sigla termo={d.tipo} />
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{d.motorista}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatarData(d.vencimento)} · {d.dias}d
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </section>
    </div>
  );
}
