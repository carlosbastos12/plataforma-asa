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

/**
 * A home abre com tranquilidade, não com cobrança (P029): primeiro o estado
 * geral em tom calmo, depois — em segundo plano — quantas decisões esperam.
 */
export function Greeting({ totalCriticos, totalAtencao }: GreetingProps) {
  const saudacaoTexto = saudacao(new Date().getHours());

  let titulo: string;
  let detalhe: string;
  if (totalCriticos === 0 && totalAtencao === 0) {
    titulo = "A operação segue sob controle.";
    detalhe = "O sistema não encontrou nenhum ponto de atenção. Quando algo mudar, você fica sabendo aqui primeiro.";
  } else if (totalCriticos === 0) {
    titulo = "A operação segue sob controle.";
    detalhe =
      totalAtencao === 1
        ? "O sistema encontrou apenas 1 ponto que merece atenção — nada urgente hoje."
        : `O sistema encontrou apenas ${totalAtencao} pontos que merecem atenção — nada urgente hoje.`;
  } else {
    titulo = "A operação segue rodando.";
    detalhe =
      totalCriticos === 1
        ? "O sistema encontrou 1 ponto que pede uma decisão sua agora — o resto está sob controle."
        : `O sistema encontrou ${totalCriticos} pontos que pedem uma decisão sua agora — o resto está sob controle.`;
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
        {titulo}
      </h1>
      <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{detalhe}</p>
    </motion.div>
  );
}
