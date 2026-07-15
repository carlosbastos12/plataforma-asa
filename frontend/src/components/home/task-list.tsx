"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, ChevronDown, FileWarning, ShieldAlert, WalletCards, PartyPopper } from "lucide-react";
import type { TarefaDoDia } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function iconePara(id: string) {
  const props = { className: "size-[18px]", strokeWidth: 2 };
  if (id.startsWith("doc-")) return <FileWarning {...props} />;
  if (id.startsWith("multa-")) return <ShieldAlert {...props} />;
  return <WalletCards {...props} />;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
};

function LinhaTarefa({ tarefa }: { tarefa: TarefaDoDia }) {
  const critico = tarefa.severidade === "critico";
  return (
    <Link
      href={tarefa.href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:px-5"
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          critico ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning"
        )}
      >
        {iconePara(tarefa.id)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-foreground">{tarefa.titulo}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{tarefa.detalhe}</p>
      </div>
      <span className="hidden shrink-0 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:block">
        Ver detalhes
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/**
 * Pendências separadas por peso de decisão: o que exige ação imediata fica
 * à vista; o que é acompanhamento fica a um clique — o diretor nunca
 * enfrenta uma parede de 16 itens de peso aparente igual.
 */
export function TaskList({ tarefas }: { tarefas: TarefaDoDia[] }) {
  const criticas = tarefas.filter((t) => t.severidade === "critico");
  const acompanhar = tarefas.filter((t) => t.severidade === "atencao");
  const [mostrarAcompanhar, setMostrarAcompanhar] = useState(false);

  if (tarefas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-14 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <PartyPopper className="size-5" strokeWidth={2} />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nenhuma pendência crítica ou em atenção agora. Assim que algo precisar de você, aparece aqui primeiro.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-2.5">
        {criticas.map((tarefa) => (
          <motion.li key={tarefa.id} variants={item}>
            <LinhaTarefa tarefa={tarefa} />
          </motion.li>
        ))}
      </motion.ul>

      {acompanhar.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => setMostrarAcompanhar((v) => !v)}
            className="group flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", mostrarAcompanhar ? "rotate-0" : "-rotate-90")}
            />
            A acompanhar ({acompanhar.length}) — prazos chegando, sem urgência hoje
          </button>

          {mostrarAcompanhar && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-2.5"
            >
              {acompanhar.map((tarefa) => (
                <li key={tarefa.id}>
                  <LinhaTarefa tarefa={tarefa} />
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}
    </div>
  );
}
