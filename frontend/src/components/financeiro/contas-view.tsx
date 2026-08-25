"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CalendarClock,
  AlertTriangle,
  Wallet2,
  CircleCheckBig,
  FileDown,
  FileSpreadsheet,
  MoreVertical,
  Paperclip,
  Pencil,
  Ban,
  Trash2,
  Banknote,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/empty-state";
import { StatusParcelaBadge } from "./status-parcela-badge";
import { FiltrosContasBar } from "./filtros-contas";
import { NovaContaDialog } from "./nova-conta-dialog";
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog";
import { EditarContaDialog } from "./editar-conta-dialog";
import { RemoverContaDialog } from "./remover-conta-dialog";
import { TiposDespesaParticularDialog } from "./tipos-despesa-particular-dialog";
import { DocumentosContaDialog } from "./documentos-conta-dialog";
import { ImportarPlanilhaDialog } from "./importar-planilha-dialog";
import { formatarData, formatarMoeda } from "@/lib/financeiro/formato";
import { calcularIndicadores } from "@/lib/financeiro/indicadores";
import { aplicarFiltros, FILTROS_VAZIOS, type FiltrosContas } from "@/lib/financeiro/filtros";
import { agruparPorMesVencimento } from "@/lib/financeiro/agrupamento";
import { exportarContasPdf, exportarContasXlsx } from "@/lib/financeiro/exportacoes";
import type {
  Banco,
  Classificacao,
  Estabelecimento,
  Fornecedor,
  LinhaParcela,
  ModeloHistorico,
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
  /** Modelos de texto para o campo Histórico (D-047). */
  modelosHistorico?: ModeloHistorico[];
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
  modelosHistorico = [],
  podeParticular,
}: Props) {
  const [filtros, setFiltros] = useState<FiltrosContas>(FILTROS_VAZIOS);
  const [parcelaEmPagamento, setParcelaEmPagamento] = useState<LinhaParcela | null>(null);
  const [contaEmEdicaoId, setContaEmEdicaoId] = useState<string | null>(null);
  const [contaDocumentosId, setContaDocumentosId] = useState<string | null>(null);
  const [acaoRemocao, setAcaoRemocao] = useState<{ linha: LinhaParcela; modo: "remover" | "cancelar" } | null>(null);

  const visiveis = useMemo(() => aplicarFiltros(linhas, filtros), [linhas, filtros]);
  const indicadores = useMemo(() => calcularIndicadores(visiveis), [visiveis]);

  // Agrupa o que JÁ passou pelo filtro (não a lista completa): assim a
  // separação por mês acompanha o resultado filtrado sozinha, sem
  // precisar saber que filtro existe.
  const grupos = useMemo(() => agruparPorMesVencimento(visiveis), [visiveis]);

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
              {/* Só do lado Empresa: a importação traz a exportação do
                  sistema da empresa e cria exclusivamente conta de
                  empresa — conta particular continua sendo cadastrada à
                  mão por quem é dona dela. */}
              {!ehParticular && <ImportarPlanilhaDialog />}
              {ehParticular && <TiposDespesaParticularDialog tipos={tiposDespesaParticular} />}
              <NovaContaDialog
                classificacoes={classificacoes}
                estabelecimentos={estabelecimentos}
                fornecedores={fornecedores}
                tiposDespesaParticular={tiposDespesaParticular}
                modelosHistorico={modelosHistorico}
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
              {/*
                Larguras fixas por coluna (colgroup + table-fixed), não
                largura "no tamanho do conteúdo": cada coluna recebe uma
                fatia percentual da tabela, então a tabela inteira sempre
                cabe na largura disponível — de um monitor grande a uma
                janela ocupando só metade dele. O texto livre (Fornecedor,
                Documento, Classificação) trunca com "…" quando a fatia é
                pequena demais; nenhuma informação é removida, só passa a
                caber inteira num detalhe (editar conta) quando não cabe
                na linha.

                As fatias foram calibradas pelo conteúdo real de cada
                coluna (medido, não estimado): o rótulo mais longo de
                status ("Parcialmente paga"), o par de botões de Ações, a
                data completa, o valor em moeda com casas decimais. Nenhuma
                delas pode encolher mais sem cortar informação, o que
                define `min-w-[850px]` como piso — abaixo disso não dá
                para encolher mais sem virar ilegível ou sobrepor
                elementos, e aí sim aparece a rolagem horizontal, só em
                telas muito pequenas.
              */}
              <Table
                className="table-fixed min-w-[850px] [&_td]:px-1.5 [&_th]:truncate [&_th]:px-1.5 min-[1600px]:[&_td]:px-4 min-[1600px]:[&_th]:px-4"
              >
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                  <col className="w-[11%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <TableHeader>
                  <TableRow>
                    {/* "Fornecedor" basta: a descrição aparece logo abaixo
                        do nome, dentro da própria célula. */}
                    <TableHead>Fornecedor</TableHead>
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
                  {grupos.map((g) => (
                    <Fragment key={g.chave}>
                      {/*
                        Faixa de mês: uma linha da própria tabela, com
                        colSpan cobrindo todas as colunas. Feita assim, e
                        não como uma tabela por mês, porque mantém uma
                        única tabela — as colunas continuam alinhadas de
                        um mês para o outro, o cabeçalho não se repete e
                        a largura segue governada pelo colgroup acima
                        (nada aqui pode reintroduzir rolagem horizontal).
                        O colSpan precisa acompanhar o número de colunas
                        do colgroup.
                      */}
                      <tr className="border-b border-border bg-secondary/60">
                        <td colSpan={9} className="py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
                              {g.rotulo}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-faint">
                              {g.linhas.length} conta{g.linhas.length > 1 ? "s" : ""} · {formatarMoeda(g.total)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {g.linhas.map((l) => {
                        const quitada = l.status === "paga" || l.status === "cancelada";
                        return (
                          <TableRow key={l.parcela_id}>
                            <TableCell>
                              <p className="truncate text-sm font-medium text-foreground">
                                {l.fornecedor_nome ?? "Sem fornecedor"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{l.descricao}</p>
                            </TableCell>
                            <TableCell className="truncate text-sm text-muted-foreground">
                              {l.numero_documento ?? "—"}
                            </TableCell>
                            <TableCell className="truncate text-sm text-muted-foreground">
                              {l.classificacao_nome ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums text-muted-foreground">
                              {l.parcela_numero}/{l.parcela_total}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums">
                              <p>{formatarData(l.parcela_vencimento)}</p>
                              {/* Atraso embaixo da data, não do lado: assim a
                                  coluna não precisa reservar espaço horizontal
                                  extra só para os dias em atraso. */}
                              {l.dias_em_atraso > 0 && (
                                <p className="text-xs font-medium text-destructive">+{l.dias_em_atraso}d</p>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">
                              {formatarMoeda(l.parcela_valor)}
                            </TableCell>
                            <TableCell>
                              <StatusParcelaBadge status={l.status} compacto />
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                              {l.total_pago > 0 ? formatarMoeda(l.total_pago) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!quitada && (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <Button
                                          variant="outline"
                                          size="icon-xs"
                                          aria-label="Registrar pagamento"
                                          onClick={() => setParcelaEmPagamento(l)}
                                        />
                                      }
                                    >
                                      <Banknote className="size-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Registrar pagamento</TooltipContent>
                                  </Tooltip>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={<Button variant="ghost" size="icon-xs" aria-label="Mais ações da conta" />}
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setContaEmEdicaoId(l.conta_id)}>
                                      <Pencil className="size-4" /> Editar conta
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setContaDocumentosId(l.conta_id)}>
                                      <Paperclip className="size-4" /> Documentos
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
                    </Fragment>
                  ))}
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
        modelosHistorico={modelosHistorico}
        aoFechar={() => setContaEmEdicaoId(null)}
      />
      <DocumentosContaDialog contaId={contaDocumentosId} aoFechar={() => setContaDocumentosId(null)} />
      <RemoverContaDialog alvo={acaoRemocao} aoFechar={() => setAcaoRemocao(null)} />
    </div>
  );
}
