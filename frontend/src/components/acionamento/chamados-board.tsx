"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Clock, User, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CHAMADOS_ATIVOS,
  STATUS_CHAMADO_LABEL,
  FROTA,
  type StatusChamado,
  type ChamadoAtivo,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COLUNAS: { status: StatusChamado; tom: string }[] = [
  { status: "aguardando", tom: "border-t-warning" },
  { status: "despachado", tom: "border-t-primary" },
  { status: "em_atendimento", tom: "border-t-primary" },
  { status: "concluido", tom: "border-t-success" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
};

function proximoVeiculoDisponivel(chamados: ChamadoAtivo[]) {
  const placasEmUso = new Set(chamados.filter((c) => c.placa).map((c) => c.placa));
  return FROTA.find((v) => !placasEmUso.has(v.placa)) ?? FROTA[0];
}

function ChamadoCard({
  chamado,
  onDespachar,
}: {
  chamado: ChamadoAtivo;
  onDespachar: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      variants={item}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground">{chamado.id}</span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {chamado.horaAbertura}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{chamado.tipoServico}</p>
        <p className="text-xs text-muted-foreground">{chamado.cliente}</p>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        <span className="truncate">{chamado.origem}</span>
      </p>
      {chamado.motorista ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          {chamado.motorista} · <span className="font-mono">{chamado.placa}</span>
        </p>
      ) : chamado.status === "aguardando" ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                className="mt-1 h-8 gap-1.5 self-start text-xs"
                onClick={() => onDespachar(chamado.id)}
              />
            }
          >
            <Send className="size-3.5" /> Despachar motorista
          </TooltipTrigger>
          <TooltipContent className="max-w-60 text-pretty">
            Envia o próximo motorista disponível para este chamado. Quanto antes o despacho, menos tempo o cliente
            espera na estrada.
          </TooltipContent>
        </Tooltip>
      ) : null}
    </motion.div>
  );
}

export function ChamadosBoard() {
  const [chamados, setChamados] = useState(CHAMADOS_ATIVOS);

  function despachar(id: string) {
    const veiculo = proximoVeiculoDisponivel(chamados);
    setChamados((atual) =>
      atual.map((c) =>
        c.id === id
          ? { ...c, status: "despachado" as const, motorista: veiculo.motorista, placa: veiculo.placa }
          : c
      )
    );
    toast.success(`${veiculo.motorista} despachado para ${id}`, {
      description: `Veículo ${veiculo.placa} a caminho. (ação simulada nesta demonstração)`,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUNAS.map((coluna) => {
        const itensDaColuna = chamados.filter((c) => c.status === coluna.status);
        return (
          <div key={coluna.status} className={cn("rounded-2xl border border-border border-t-4 bg-secondary/40 p-3", coluna.tom)}>
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground">{STATUS_CHAMADO_LABEL[coluna.status]}</h3>
              <span className="text-xs font-medium text-muted-foreground">{itensDaColuna.length}</span>
            </div>
            <motion.div layout variants={container} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {itensDaColuna.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground">
                  Nenhum chamado nesta etapa. Quando um chegar, ele aparece aqui na hora.
                </p>
              ) : (
                itensDaColuna.map((c) => <ChamadoCard key={c.id} chamado={c} onDespachar={despachar} />)
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
