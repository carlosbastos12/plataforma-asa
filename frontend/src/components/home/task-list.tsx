"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, FileWarning, ShieldAlert, WalletCards, PartyPopper } from "lucide-react";
import type { TarefaDoDia } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function iconePara(id: string) {
  if (id.startsWith("doc-")) return FileWarning;
  if (id.startsWith("multa-")) return ShieldAlert;
  return WalletCards;
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

export function TaskList({ tarefas }: { tarefas: TarefaDoDia[] }) {
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
    <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-2.5">
      {tarefas.map((tarefa) => {
        const Icon = iconePara(tarefa.id);
        const critico = tarefa.severidade === "critico";
        return (
          <motion.li key={tarefa.id} variants={item}>
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
                <Icon className="size-[18px]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-foreground">{tarefa.titulo}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{tarefa.detalhe}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
