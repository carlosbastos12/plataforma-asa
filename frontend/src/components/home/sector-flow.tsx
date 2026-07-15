"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Radio, Truck, Users2, Fuel, Landmark, ArrowRight } from "lucide-react";

interface Estacao {
  href: string;
  nome: string;
  descricao: string;
  contagem: number;
  rotuloContagem: string;
  icon: typeof Radio;
  cor: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

/**
 * O caminho real do atendimento (P034, VDC-001): nasce no Acionamento,
 * passa pela Frota e pela Equipe que a operam, consome Combustível e se
 * consolida no Fechamento — cinco estações, não três.
 */
export function SectorFlow({
  acionamento,
  gestaoDaFrota,
  equipe,
  combustivelDias,
  fechamento,
}: {
  acionamento: number;
  gestaoDaFrota: number;
  equipe: number;
  combustivelDias: number;
  fechamento: number;
}) {
  const estacoes: Estacao[] = [
    {
      href: "/acionamento",
      nome: "Acionamento",
      descricao: "O chamado nasce aqui",
      contagem: acionamento,
      rotuloContagem: acionamento === 1 ? "chamado aguardando" : "chamados aguardando",
      icon: Radio,
      cor: "var(--chart-3)",
    },
    {
      href: "/gestao-da-frota",
      nome: "Gestão da Frota",
      descricao: "O veículo executa e é mantido",
      contagem: gestaoDaFrota,
      rotuloContagem: gestaoDaFrota === 1 ? "pendência" : "pendências",
      icon: Truck,
      cor: "var(--primary)",
    },
    {
      href: "/equipe-operacional",
      nome: "Equipe Operacional",
      descricao: "Quem está disponível hoje",
      contagem: equipe,
      rotuloContagem: equipe === 1 ? "ausência com impacto" : "ausências com impacto",
      icon: Users2,
      cor: "var(--chart-5)",
    },
    {
      href: "/gestao-da-frota/combustivel",
      nome: "Combustível",
      descricao: "O que move a frota",
      contagem: combustivelDias,
      rotuloContagem: "dias de autonomia",
      icon: Fuel,
      cor: "var(--chart-2)",
    },
    {
      href: "/fechamento",
      nome: "Fechamento",
      descricao: "O dia se consolida",
      contagem: fechamento,
      rotuloContagem: fechamento === 1 ? "caixa em aberto" : "caixas em aberto",
      icon: Landmark,
      cor: "var(--brand-accent)",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center"
    >
      {estacoes.map((estacao, i) => (
        <div key={estacao.href} className="flex flex-1 items-center gap-2">
          <motion.div variants={item} className="flex-1">
            <Link
              href={estacao.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklch, ${estacao.cor} 16%, transparent)`, color: estacao.cor }}
                >
                  <estacao.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `color-mix(in oklch, ${estacao.cor} 14%, transparent)`, color: estacao.cor }}
                >
                  {estacao.contagem}
                </span>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{estacao.nome}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{estacao.descricao}</p>
              </div>
              <p className="text-xs text-muted-foreground/80">
                {estacao.contagem} {estacao.rotuloContagem}
              </p>
            </Link>
          </motion.div>

          {i < estacoes.length - 1 && (
            <motion.div
              variants={item}
              className="hidden shrink-0 text-muted-foreground/30 lg:block"
              aria-hidden
            >
              <ArrowRight className="size-5" strokeWidth={2} />
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
