"use client";

import { useState } from "react";
import { Fuel, ArrowDownCircle, ArrowUpCircle, Truck } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { NovaEntradaDialog } from "./nova-entrada-dialog";
import { NovoAbastecimentoDialog } from "./novo-abastecimento-dialog";
import { HistoricoTabela } from "./historico-tabela";
import { TimelineEstoque } from "./timeline-estoque";
import { InteligenciaPanel } from "./inteligencia-panel";
import {
  MOVIMENTACOES_TANQUE,
  ABASTECIMENTOS_EXTERNOS,
  TANQUE_BASE,
  estoqueAtualLitros,
  diasDeAutonomiaTanque,
  percentualTanque,
  historicoAbastecimentos,
  insightsCombustivel,
  type MovimentacaoTanque,
  type AbastecimentoExterno,
} from "@/lib/combustivel";

/**
 * Combustível como experiência completa (P036): responde de cara "como
 * entra, como sai, quem abasteceu e quanto resta" — o registro de entrada e
 * de abastecimento já mexe no estoque na hora, na tela, sem esperar
 * ninguém conferir planilha nenhuma depois.
 */
export function CombustivelView() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoTanque[]>(MOVIMENTACOES_TANQUE);
  const [externos, setExternos] = useState<AbastecimentoExterno[]>(ABASTECIMENTOS_EXTERNOS);

  const estoque = estoqueAtualLitros(movimentacoes);
  const autonomia = diasDeAutonomiaTanque(movimentacoes);
  const percentual = percentualTanque(movimentacoes);

  const entradasMes = movimentacoes.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.litros, 0);
  const saidasBase = movimentacoes.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.litros, 0);
  const saidasExternas = externos.reduce((acc, a) => acc + a.litros, 0);

  const historico = historicoAbastecimentos(movimentacoes, externos);
  const insights = insightsCombustivel(movimentacoes, externos);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <NovaEntradaDialog onRegistrar={(m) => setMovimentacoes((atual) => [...atual, m])} />
        <NovoAbastecimentoDialog
          movimentacoesAtuais={movimentacoes}
          onRegistrarBase={(m) => setMovimentacoes((atual) => [...atual, m])}
          onRegistrarExterno={(a) => setExternos((atual) => [a, ...atual])}
        />
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Fuel}
          tone={autonomia <= 3 ? "crit" : autonomia <= 7 ? "warn" : "ok"}
          label="Quanto resta"
          value={`${estoque.toLocaleString("pt-BR")} L`}
          foot={`${percentual}% do tanque · autonomia de ${autonomia} dia(s)`}
        />
        <KpiCard
          icon={ArrowDownCircle}
          tone="ok"
          label="Como entra"
          value={`${entradasMes.toLocaleString("pt-BR")} L`}
          foot={`fornecedor de referência: ${TANQUE_BASE.fornecedor}`}
        />
        <KpiCard
          icon={ArrowUpCircle}
          tone="info"
          label="Como sai"
          value={`${(saidasBase + saidasExternas).toLocaleString("pt-BR")} L`}
          foot={`${saidasBase.toLocaleString("pt-BR")} L na base · ${saidasExternas.toLocaleString("pt-BR")} L em posto`}
        />
        <KpiCard
          icon={Truck}
          tone="warn"
          label="Quem abasteceu"
          value={String(historico.length)}
          foot="abastecimentos no histórico"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <HistoricoTabela linhas={historico} />
        </div>
        <div className="flex flex-col gap-4">
          <InteligenciaPanel insights={insights} />
          <TimelineEstoque movimentacoes={movimentacoes} />
        </div>
      </div>
    </div>
  );
}
