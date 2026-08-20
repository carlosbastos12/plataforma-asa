"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileDown,
  ShieldCheck,
  Building2,
  User,
  Lock,
  TriangleAlert,
  CircleCheckBig,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { ComoFunciona, type TopicoAjuda } from "@/components/ajuda/como-funciona";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StatusParcelaBadge } from "./status-parcela-badge";
import { formatarData, formatarMoeda, mesCorrente } from "@/lib/financeiro/formato";
import { agruparPor, calcularIndicadores } from "@/lib/financeiro/indicadores";
import {
  exportarContasPdf,
  exportarContasXlsx,
  exportarFechamentoContabilPdf,
  exportarFechamentoContabilXlsx,
} from "@/lib/financeiro/exportacoes";
import type { LinhaPagamento, LinhaParcela } from "@/lib/financeiro/tipos";
import { cn } from "@/lib/utils";

type Aba = "empresa" | "particular" | "fechamento";

interface Props {
  linhas: LinhaParcela[];
  /** Grão de pagamento (D-047) — fonte da exportação do fechamento contábil. */
  pagamentos: LinhaPagamento[];
  podeParticular: boolean;
}

export function RelatoriosView({ linhas, pagamentos, podeParticular }: Props) {
  const inicial = mesCorrente();
  const [aba, setAba] = useState<Aba>("empresa");
  const [de, setDe] = useState(inicial.inicio);
  const [ate, setAte] = useState(inicial.fim);

  const noPeriodo = useMemo(
    () => linhas.filter((l) => (!de || l.parcela_vencimento >= de) && (!ate || l.parcela_vencimento <= ate)),
    [linhas, de, ate]
  );

  // A separação acontece aqui e é a regra mais importante da tela:
  // nada com natureza "particular" atravessa para o lado da empresa.
  const daEmpresa = useMemo(() => noPeriodo.filter((l) => l.natureza === "empresa"), [noPeriodo]);
  const particulares = useMemo(() => noPeriodo.filter((l) => l.natureza === "particular"), [noPeriodo]);

  // Filtro por DATA DE PAGAMENTO, não por vencimento — de propósito,
  // diferente do filtro acima. O fechamento contábil é "o que foi pago
  // neste período", não "o que venceu neste período" (mesma lógica da
  // planilha real: a aba "AGOSTO 2026" reúne os pagamentos feitos em
  // agosto, não as contas com vencimento em agosto).
  const pagamentosDaEmpresaNoPeriodo = useMemo(
    () =>
      pagamentos.filter(
        (p) =>
          p.natureza === "empresa" &&
          !p.cancelada &&
          (!de || p.data_pagamento >= de) &&
          (!ate || p.data_pagamento <= ate)
      ),
    [pagamentos, de, ate]
  );

  const periodoTexto = `${formatarData(de)} a ${formatarData(ate)}`;

  const abas: { id: Aba; label: string; icone: typeof Building2; bloqueada?: boolean }[] = [
    { id: "empresa", label: "Contas da Empresa", icone: Building2 },
    { id: "particular", label: "Contas Particulares", icone: User, bloqueada: !podeParticular },
    { id: "fechamento", label: "Fechamento para Contabilidade", icone: ShieldCheck },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelBody className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Período — de</label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">até</label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {abas.map((a) => (
              <button
                key={a.id}
                onClick={() => !a.bloqueada && setAba(a.id)}
                disabled={a.bloqueada}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                  aba === a.id
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  a.bloqueada && "cursor-not-allowed opacity-50 hover:border-border"
                )}
              >
                {a.bloqueada ? <Lock className="size-3.5" /> : <a.icone className="size-3.5" />}
                {a.label}
              </button>
            ))}
          </div>
        </PanelBody>
      </Panel>

      {aba === "empresa" && (
        <RelatorioTabela
          titulo="Contas da Empresa"
          subtitulo="Todas as obrigações da ASA no período — é esta a base dos relatórios empresariais."
          linhas={daEmpresa}
          periodo={periodoTexto}
          arquivo="relatorio_contas_empresa"
        />
      )}

      {aba === "particular" && podeParticular && (
        <RelatorioTabela
          titulo="Contas Particulares"
          subtitulo="Controle pessoal da gestora. Visível apenas para quem tem permissão."
          linhas={particulares}
          periodo={periodoTexto}
          arquivo="relatorio_contas_particulares"
          aviso="Uso pessoal — estas contas NÃO são enviadas para a contabilidade da empresa."
        />
      )}

      {aba === "fechamento" && (
        <Fechamento
          linhas={daEmpresa}
          pagamentos={pagamentosDaEmpresaNoPeriodo}
          periodo={periodoTexto}
          quantidadeParticulares={particulares.length}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */

function RelatorioTabela({
  titulo,
  subtitulo,
  linhas,
  periodo,
  arquivo,
  aviso,
}: {
  titulo: string;
  subtitulo: string;
  linhas: LinhaParcela[];
  periodo: string;
  arquivo: string;
  aviso?: string;
}) {
  const i = calcularIndicadores(linhas);
  const ctx = { titulo, arquivo, periodo, aviso, comResumoGerencial: true };

  return (
    <Panel>
      <PanelHeader
        title={titulo}
        subtitle={subtitulo}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={linhas.length === 0}
              onClick={() => exportarContasXlsx(linhas, ctx)}
            >
              <FileSpreadsheet className="size-3.5" /> XLSX
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={linhas.length === 0}
              onClick={() => exportarContasPdf(linhas, ctx)}
            >
              <FileDown className="size-3.5" /> PDF
            </Button>
          </div>
        }
      />
      <PanelBody className="flex flex-col gap-4">
        {aviso && (
          <p className="flex items-center gap-2 rounded-lg bg-info-soft px-3 py-2 text-[12.5px] text-info">
            <Lock className="size-3.5 shrink-0" />
            {aviso}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Indicador rotulo="Registros" valor={String(linhas.length)} />
          <Indicador rotulo="Total no período" valor={formatarMoeda(linhas.reduce((a, l) => a + l.parcela_valor, 0))} />
          <Indicador rotulo="Pago" valor={formatarMoeda(i.valorPago)} />
          <Indicador rotulo="Em aberto" valor={formatarMoeda(i.valorAPagar)} />
        </div>

        {linhas.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Nenhum registro neste período"
            description="Ajuste as datas acima ou cadastre contas para vê-las aqui."
            compact
          />
        ) : (
          <TabelaSimples linhas={linhas} />
        )}
      </PanelBody>
    </Panel>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-[17px] font-bold text-foreground tabular-nums">{valor}</p>
    </div>
  );
}

function TabelaSimples({ linhas }: { linhas: LinhaParcela[] }) {
  return (
    <div className="-mx-5 -mb-5 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Classificação</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead className="text-right">Juros/Multa</TableHead>
            <TableHead className="text-right">Pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.parcela_id}>
              <TableCell className="max-w-56">
                <p className="truncate text-sm font-medium text-foreground">{l.fornecedor_nome ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{l.descricao}</p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{l.numero_documento ?? "—"}</TableCell>
              <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                {l.classificacao_nome ?? "—"}
              </TableCell>
              <TableCell className="text-sm tabular-nums">{formatarData(l.parcela_vencimento)}</TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums">
                {formatarMoeda(l.parcela_valor)}
              </TableCell>
              <TableCell>
                <StatusParcelaBadge status={l.status} />
              </TableCell>
              <TableCell className="max-w-36 truncate text-sm text-muted-foreground">
                {l.bancos_utilizados ?? "—"}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                {l.total_juros + l.total_multa > 0 ? formatarMoeda(l.total_juros + l.total_multa) : "—"}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {l.total_pago > 0 ? formatarMoeda(l.total_pago) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* --------------------------------------------------------------------- */

/**
 * Conteúdo da ajuda desta tela. Fica separado do JSX de propósito: é
 * texto de produto, revisado por quem entende do negócio, não parte da
 * montagem visual. Linguagem do dia a dia — nada de termo técnico.
 */
const AJUDA_FECHAMENTO: TopicoAjuda[] = [
  {
    titulo: "Período",
    texto:
      "Define quais pagamentos entram no fechamento. Entram os que foram pagos dentro das datas escolhidas — não os que venceram no período.",
  },
  {
    titulo: "Pendências",
    texto:
      "Aviso do que ainda falta preencher antes de enviar: uma conta sem classificação, sem número de nota ou um pagamento sem o banco informado. Se aparecer alguma, corrija na tela de Contas a Pagar e volte aqui.",
  },
  {
    titulo: "Histórico",
    texto:
      "É o texto que a contabilidade lê para saber a que se refere cada pagamento. Ao cadastrar ou editar a conta, você escolhe um modelo pronto e completa com a informação que faltar — o número da nota, por exemplo.",
    exemplo: "Pg.Despesa Ref. NF 4587",
  },
  {
    titulo: "XLSX",
    texto: "Gera a planilha com os pagamentos do período — é este o arquivo que você envia para a contabilidade.",
  },
  {
    titulo: "PDF",
    texto: "Gera a mesma lista em formato de leitura, para você conferir na tela ou imprimir antes de enviar.",
  },
  {
    titulo: "E as contas particulares?",
    texto:
      "Nunca entram aqui. O fechamento reúne apenas contas da empresa — as particulares ficam de fora automaticamente, sem você precisar fazer nada.",
  },
];

function Fechamento({
  linhas,
  pagamentos,
  periodo,
  quantidadeParticulares,
}: {
  linhas: LinhaParcela[];
  pagamentos: LinhaPagamento[];
  periodo: string;
  quantidadeParticulares: number;
}) {
  const semClassificacao = linhas.filter((l) => !l.classificacao_nome);
  const semDocumento = linhas.filter((l) => !l.numero_documento);
  const pagamentoSemBanco = linhas.filter((l) => l.total_pago > 0 && !l.bancos_utilizados);

  const pendencias = [
    { rotulo: "contas sem classificação", itens: semClassificacao },
    { rotulo: "contas sem número de documento/NF", itens: semDocumento },
    { rotulo: "pagamentos sem banco informado", itens: pagamentoSemBanco },
  ].filter((p) => p.itens.length > 0);

  const porGrupo = agruparPor(linhas, (l) => l.classificacao_grupo);
  const total = linhas.reduce((a, l) => a + l.parcela_valor, 0);
  const totalPagoNoPeriodo = pagamentos.reduce((a, p) => a + p.valor_pago, 0);

  const ctx = {
    titulo: "Fechamento Contábil",
    arquivo: "fechamento_contabil",
    periodo,
    aviso: "Contém exclusivamente contas da EMPRESA. Contas particulares foram excluídas automaticamente.",
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader
          title="Fechamento para a Contabilidade"
          subtitle={`Período ${periodo} — somente contas da empresa.`}
          action={
            <div className="flex items-center gap-2">
              <ComoFunciona
                titulo="Fechamento para a Contabilidade"
                resumo="Esta tela prepara os pagamentos da empresa para você enviar à contabilidade — já conferidos e no formato que o escritório espera receber."
                topicos={AJUDA_FECHAMENTO}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={pagamentos.length === 0}
                onClick={() => exportarFechamentoContabilXlsx(pagamentos, ctx)}
              >
                <FileSpreadsheet className="size-3.5" /> XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={pagamentos.length === 0}
                onClick={() => exportarFechamentoContabilPdf(pagamentos, ctx)}
              >
                <FileDown className="size-3.5" /> PDF
              </Button>
            </div>
          }
        />
        <PanelBody className="flex flex-col gap-4">
          {/* A garantia mais importante desta tela, dita de forma explícita. */}
          <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} />
            <div className="min-w-0 text-[12.5px] leading-relaxed text-foreground">
              <p className="font-semibold text-success">Contas particulares excluídas automaticamente.</p>
              <p className="text-muted-foreground">
                {quantidadeParticulares > 0
                  ? `${quantidadeParticulares} conta(s) particular(es) existem neste período e ficaram de fora deste fechamento.`
                  : "Nenhuma conta particular neste período. O fechamento contém apenas obrigações da empresa."}
              </p>
            </div>
          </div>

          {/* Distinção importante (D-047): a lista abaixo mostra as
              OBRIGAÇÕES do período (por vencimento) para checar pendências;
              o botão XLSX/PDF exporta os PAGAMENTOS de fato realizados no
              período (por data de pagamento) — é esse o formato que a
              contabilidade usa, uma linha por pagamento, igual à planilha
              real do escritório contábil. */}
          <p className="rounded-lg bg-info-soft px-3 py-2 text-[12px] leading-relaxed text-info">
            A exportação XLSX/PDF lista os <strong>pagamentos realizados</strong> no período — não as contas
            vencidas. É o formato que a contabilidade usa (uma linha por pagamento).
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador rotulo="Contas no fechamento" valor={String(linhas.length)} />
            <Indicador rotulo="Valor total (vencimento)" valor={formatarMoeda(total)} />
            <Indicador rotulo="Pagamentos no período" valor={String(pagamentos.length)} />
            <Indicador rotulo="Pago no período" valor={formatarMoeda(totalPagoNoPeriodo)} />
          </div>

          {/* Verificação antes do fechamento (§32 do documento do cliente) */}
          {pendencias.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2.5 text-[12.5px] text-success">
              <CircleCheckBig className="size-4 shrink-0" />
              Nenhuma pendência encontrada — este período está pronto para ser enviado à contabilidade.
            </p>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3.5">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-warning">
                <TriangleAlert className="size-4 shrink-0" />
                Corrija antes de enviar para a contabilidade
              </p>
              <ul className="flex flex-col gap-1 pl-6 text-[12.5px] text-foreground">
                {pendencias.map((p) => (
                  <li key={p.rotulo} className="list-disc">
                    <span className="font-semibold tabular-nums">{p.itens.length}</span> {p.rotulo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {porGrupo.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-foreground">Totais por grupo contábil</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Contas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porGrupo.map((g) => (
                      <TableRow key={g.label}>
                        <TableCell className="text-sm font-medium">{g.label}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{g.quantidade}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatarMoeda(g.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {linhas.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhuma conta da empresa neste período"
              description="Escolha outro período ou cadastre contas para montar o fechamento."
              compact
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
