"use client";

import { motion } from "motion/react";

function saudacao(hora: number): string {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

interface GreetingProps {
  totalCriticos: number;
  totalAtencao: number;
}

export function Greeting({ totalCriticos, totalAtencao }: GreetingProps) {
  const saudacaoTexto = saudacao(new Date().getHours());
  const total = totalCriticos + totalAtencao;

  let mensagem: string;
  if (total === 0) {
    mensagem = "Nenhuma tarefa aguardando você. Tudo em ordem por aqui.";
  } else if (total === 1) {
    mensagem = "Hoje existe 1 tarefa aguardando. Vamos começar?";
  } else {
    mensagem = `Hoje existem ${total} tarefas aguardando. Vamos começar?`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-sm font-medium text-brand-accent" suppressHydrationWarning>
        {saudacaoTexto}, Carlos.
      </p>
      <h1 className="mt-1.5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {mensagem}
      </h1>
    </motion.div>
  );
}
