"use client";

import { useState } from "react";
import { FileText, Eye, Radio, FileCheck2, ShieldAlert, Wrench, Fuel, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface Relatorio {
  slug: string;
  nome: string;
  icone: LucideIcon;
  oQueMostra: string;
  paraQuem: string;
  beneficio: string;
  /** Linhas do exemplo ilustrativo exibido no preview. */
  exemplo: { rotulo: string; valor: string }[];
}

/**
 * Card de relatório: explica o que mostra, para quem serve e o benefício —
 * e o botão entrega um exemplo real de leitura, não uma promessa vazia.
 */
export function RelatorioCard({ relatorio }: { relatorio: Relatorio }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <relatorio.icone className="size-[18px]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-medium text-foreground">{relatorio.nome}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{relatorio.oQueMostra}</p>
          <p className="mt-2 text-[13px] font-medium text-primary">{relatorio.beneficio}</p>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Para {relatorio.paraQuem}</span>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAberto(true)}>
            <Eye className="size-3.5" /> Ver exemplo
          </Button>
        </div>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="gap-4 p-6 sm:max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <FileText className="size-[18px]" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle>{relatorio.nome}</DialogTitle>
              <DialogDescription className="mt-0.5">Exemplo ilustrativo com dados de demonstração.</DialogDescription>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {relatorio.exemplo.map((linha) => (
              <li key={linha.rotulo} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-muted-foreground">{linha.rotulo}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{linha.valor}</span>
              </li>
            ))}
          </ul>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Na versão completa, este relatório sai com o período que você escolher — pronto para reunião, sem montar
            nada à mão.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Conteúdo dos relatórios (client): os ícones vivem aqui para não cruzarem a fronteira server → client. */
const RELATORIOS: Relatorio[] = [
  {
    slug: "operacional",
    nome: "Relatório Operacional",
    icone: Radio,
    oQueMostra: "Atendimentos do período: volume por dia, tempo médio de despacho e origem dos chamados.",
    paraQuem: "direção e acionamento",
    beneficio: "Mostra se a operação está dando conta da demanda — antes do cliente reclamar.",
    exemplo: [
      { rotulo: "Atendimentos no período", valor: "128" },
      { rotulo: "Tempo médio até o despacho", valor: "11 min" },
      { rotulo: "Origem mais frequente", valor: "Seguradoras (62%)" },
      { rotulo: "Dia de maior volume", valor: "Sexta-feira" },
    ],
  },
  {
    slug: "documentacao",
    nome: "Relatório de Documentação",
    icone: FileCheck2,
    oQueMostra: "Situação de todos os documentos da frota: em dia, vencendo e vencidos, por veículo.",
    paraQuem: "gestão da frota",
    beneficio: "Um panorama que evita surpresa: o que vence no próximo mês já aparece hoje.",
    exemplo: [
      { rotulo: "Documentos em dia", valor: "38" },
      { rotulo: "Vencem em 30 dias", valor: "6" },
      { rotulo: "Vencidos", valor: "3" },
      { rotulo: "Veículo com mais pendências", valor: "BLN2C88" },
    ],
  },
  {
    slug: "multas",
    nome: "Relatório de Multas",
    icone: ShieldAlert,
    oQueMostra: "Multas por período, órgão e veículo — com valores pagos, em aberto e prazos cumpridos.",
    paraQuem: "direção e frota",
    beneficio: "Revela onde a frota mais é autuada — e quanto a indicação em dia já economizou.",
    exemplo: [
      { rotulo: "Multas no período", valor: "9" },
      { rotulo: "Valor total", valor: "R$ 2.140,60" },
      { rotulo: "Indicações feitas no prazo", valor: "100%" },
      { rotulo: "Órgão mais frequente", valor: "AMC" },
    ],
  },
  {
    slug: "manutencao",
    nome: "Relatório de Manutenção",
    icone: Wrench,
    oQueMostra: "Gasto de manutenção por veículo e por tipo de serviço, com a frequência de cada um.",
    paraQuem: "gestão da frota",
    beneficio: "Aponta o veículo que mais custa — o dado certo para decidir entre manter e renovar.",
    exemplo: [
      { rotulo: "Gasto no período", valor: "R$ 8.920,00" },
      { rotulo: "Serviço mais frequente", valor: "Revisão preventiva" },
      { rotulo: "Veículo de maior custo", valor: "KPT9F03" },
      { rotulo: "Custo médio por veículo", valor: "R$ 892,00" },
    ],
  },
  {
    slug: "combustivel",
    nome: "Relatório de Combustível",
    icone: Fuel,
    oQueMostra: "Abastecimentos por veículo e posto, com consumo médio e variação entre períodos.",
    paraQuem: "frota e fechamento",
    beneficio: "Desvio de consumo aparece em dias, não no fim do mês — quando ainda dá para agir.",
    exemplo: [
      { rotulo: "Litros no período", valor: "4.310 L" },
      { rotulo: "Gasto total", valor: "R$ 25.860,00" },
      { rotulo: "Consumo médio da frota", valor: "2,9 km/L" },
      { rotulo: "Maior variação", valor: "TCV3B29 (+12%)" },
    ],
  },
  {
    slug: "fechamentos",
    nome: "Relatório de Fechamentos",
    icone: Landmark,
    oQueMostra: "Caixas do período: entradas, saídas, saldo por dia e dias fechados dentro do prazo.",
    paraQuem: "fechamento e direção",
    beneficio: "O mês inteiro conferido numa página — a prestação de contas começa pronta.",
    exemplo: [
      { rotulo: "Dias fechados no prazo", valor: "21 de 22" },
      { rotulo: "Total de entradas", valor: "R$ 61.480,00" },
      { rotulo: "Total de saídas", valor: "R$ 17.230,00" },
      { rotulo: "Saldo do período", valor: "R$ 44.250,00" },
    ],
  },
];

export function RelatoriosGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {RELATORIOS.map((r) => (
        <RelatorioCard key={r.slug} relatorio={r} />
      ))}
    </div>
  );
}
