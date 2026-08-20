"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  Wallet2,
  CircleCheckBig,
  FileDown,
  FileSpreadsheet,
  MoreVertical,
  Pencil,
  Ban,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { StatusParcelaBadge } from "./status-parcela-badge";
import { FiltrosContasBar } from "./filtros-contas";
import { NovaContaDialog } from "./nova-conta-dialog";
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog";
import { EditarContaDialog } from "./editar-conta-dialog";
import { RemoverContaDialog } from "./remover-conta-dialog";
import { TiposDespesaParticularDialog } from "./tipos-despesa-particular-dialog";
import { formatarData, formatarMoeda } from "@/lib/financeiro/formato";
import { calcularIndicadores } from "@/lib/financeiro/indicadores";
import { aplicarFiltros, FILTROS_VAZIOS, type FiltrosContas } from "@/lib/financeiro/filtros";
import { exportarContasPdf, exportarContasXlsx } from "@/lib/financeiro/exportacoes";
import type {
  Banco,
  Classificacao,
  Estabelecimento,
  Fornecedor,
  LinhaParcela,
  NaturezaConta,
  TipoDespesaParticular,
} from "@/lib/financeiro/tipos";

interface Props {
  linhas: LinhaParcela[];
  natureza: NaturezaConta;
  classificacoes: Classificacao[];
  estabelecimentos: Estabelecimento[];
  bancos: Banco[];
  fornecedores: Fornecedor[];
  /** Tipos de despesa particular do usuário logado (D-044). */
  tiposDespesaParticular?: TipoDespesaParticular[];
  podeParticular: boolean;
}

export function ContasView({
  linhas,
  natureza,
  classificacoes,
  estabelecimentos,
  bancos,
  fornecedores,
  tiposDespesaParticular = [],
  podeParticular,
}: Props) {
  const [filtros, setFiltros] = useState<FiltrosContas>(FILTROS_VAZIOS);
  const [parcelaEmPagamento, setParcelaEmPagamento] = useState<LinhaParcela | null>(null);
  const [contaEmEdicaoId, setContaEmEdicaoId] = useState<string | null>(null);
  const [acaoRemocao, setAcaoRemocao] = useState<{ linha: LinhaParcela; modo: "remover" | "cancelar" } | null>(null);

  const visiveis = useMemo(() => aplicarFiltros(linhas, filtros), [linhas, filtros]);
  const indicadores = useMemo(() => calcularIndicadores(visiveis), [visiveis]);

  // Uma conta só pode ser apagada de vez se nunca recebeu pagamento —
  // calculado sobre TODAS as linhas (não só as filtradas), porque é uma
  // regra de negócio, não uma consequência do filtro ativo na tela.
  const contasComPagamento = useMemo(() => {
    const s = new Set<string>();
    for (const l of linhas) if (l.total_pago > 0) s.add(l.conta_id);
    return s;
  }, [linhas]);

  const opcoesClassificacao = useMemo(
    () => Array.from(new Set(linhas.map((l) => l.classificacao_nome ?? "Sem classificação"))).sort(),
    [linhas]
  );
  const opcoesEstabelecimento = useMemo(
    () => Array.from(new Set(linhas.map((l) => l.estabelecimento_nome ?? "Sem estabelecimento"))).sort(),
    [linhas]
  );

  const ehParticular = natureza === "particular";
  const contexto = {
    titulo: ehParticular ? "Contas Particulares" : "Contas da Empresa",
    arquivo: ehParticular ? "contas_particulares" : "contas_empresa",
    periodo:
      filtros.de || filtros.ate
        ? `${filtros.de ? formatarData(filtros.de) : "início"} a ${filtros.ate ? formatarData(filtros.ate) : "hoje"}`
        : undefined,
    aviso: ehParticular
      ? "Relatório de uso pessoal — estas contas NÃO são enviadas para a contabilidade da empresa."
      : undefined,
    comResumoGerencial: true,
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarClock}
          tone={indicadores.vencendoHoje > 0 ? "warn" : "ok"}
          label="Vencendo hoje"
          value={String(indicadores.vencendoHoje)}
          foot={formatarMoeda(indicadores.valorVencendoHoje)}
        />
        <KpiCard
          icon={AlertTriangle}
          tone={indicadores.vencidas > 0 ? "crit" : "ok"}
          label="Vencidas"
          value={String(indicadores.vencidas)}
          foot={formatarMoeda(indicadores.valorVencido)}
        />
        <KpiCard
          icon={Wallet2}
          tone="info"
          label="A pagar"
          value={String(indicadores.aPagar)}
          foot={formatarMoeda(indicadores.valorAPagar)}
        />
        <KpiCard
          icon={CircleCheckBig}
          tone="ok"
          label="Total pago"
          value={formatarMoeda(indicadores.valorPago)}
          foot={`${indicadores.totalPago} parcela(s) quitada(s)`}
        />
      </section>

      <Panel>
        <PanelHeader
          title={ehParticular ? "Minhas contas particulares" : "Contas a pagar da empresa"}
          subtitle={
            ehParticular
              ? "Controle pessoal — nunca entra no fechamento contábil da empresa."
              : "Tudo que a empresa tem a pagar, com o vencimento sob acompanhamento."
          }
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={visiveis.length === 0}
                onClick={() => exportarContasXlsx(visiveis, contexto)}
              >
                <FileSpreadsheet className="size-3.5" /> XLSX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={visiveis.length === 0}
                onClick={() => exportarContasPdf(visiveis, contexto)}
              >
                <FileDown className="size-3.5" /> PDF
              </Button>
              {ehParticular && <TiposDespesaParticularDialog tipos={tiposDespesaParticular} />}
              <NovaContaDialog
                classificacoes={classificacoes}
                estabelecimentos={estabelecimentos}
                fornecedores={fornecedores}
                tiposDespesaParticular={tiposDespesaParticular}
                podeParticular={podeParticular}
                naturezaInicial={natureza}
                rotulo={ehParticular ? "Nova conta particular" : "Nova conta"}
              />
            </div>
          }
        />

        <PanelBody className="flex flex-col gap-4">
          <FiltrosContasBar
            filtros={filtros}
            aoMudar={setFiltros}
            classificacoes={opcoesClassificacao}
            estabelecimentos={opcoesEstabelecimento}
            mostrarEstabelecimento={!ehParticular}
          />

          {visiveis.length === 0 ? (
            <EmptyState
              icon={Wallet2}
              title={linhas.length === 0 ? "Nenhuma conta cadastrada ainda" : "Nada encontrado com esses filtros"}
              description={
                linhas.length === 0
                  ? "Cadastre a primeira conta: a partir daí o sistema acompanha o vencimento, avisa na hora certa e monta os relatórios sozinho."
                  : "Ajuste os filtros para encontrar o que procura."
              }
            />
          ) : (
            <div className="-mx-5 -mb-5 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor / Descrição</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((l) => {
                    const quitada = l.status === "paga" || l.status === "cancelada";
                    return (
                      <TableRow key={l.parcela_id}>
                        <TableCell className="max-w-64">
                          <p className="truncate text-sm font-medium text-foreground">
                            {l.fornecedor_nome ?? "Sem fornecedor"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{l.descricao}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.numero_documento ?? "—"}</TableCell>
                        <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                          {l.classificacao_nome ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums text-muted-foreground">
                          {l.parcela_numero}/{l.parcela_total}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {formatarData(l.parcela_vencimento)}
                          {l.dias_em_atraso > 0 && (
                            <span className="ml-1.5 text-xs font-medium text-destructive">
                              +{l.dias_em_atraso}d
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatarMoeda(l.parcela_valor)}
                        </TableCell>
                        <TableCell>
                          <StatusParcelaBadge status={l.status} />
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {l.total_pago > 0 ? formatarMoeda(l.total_pago) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!quitada && (
                              <Button variant="outline" size="sm" onClick={() => setParcelaEmPagamento(l)}>
                                Pagar
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon" className="size-8" aria-label="Mais ações da conta" />}
                              >
                                <MoreVertical className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setContaEmEdicaoId(l.conta_id)}>
                                  <Pencil className="size-4" /> Editar conta
                                </DropdownMenuItem>
                                {contasComPagamento.has(l.conta_id) ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setAcaoRemocao({ linha: l, modo: "cancelar" })}
                                  >
                                    <Ban className="size-4" /> Cancelar conta
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setAcaoRemocao({ linha: l, modo: "remover" })}
                                  >
                                    <Trash2 className="size-4" /> Remover conta
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </PanelBody>
      </Panel>

      <RegistrarPagamentoDialog
        parcela={parcelaEmPagamento}
        bancos={bancos}
        aoFechar={() => setParcelaEmPagamento(null)}
      />
      <EditarContaDialog
        contaId={contaEmEdicaoId}
        classificacoes={classificacoes}
        estabelecimentos={estabelecimentos}
        fornecedores={fornecedores}
        tiposDespesaParticular={tiposDespesaParticular}
        aoFechar={() => setContaEmEdicaoId(null)}
      />
      <RemoverContaDialog alvo={acaoRemocao} aoFechar={() => setAcaoRemocao(null)} />
    </div>
  );
}
