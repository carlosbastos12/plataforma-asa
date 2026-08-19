import { baixarXlsx, type Celula, type Planilha } from "@/lib/exportar/xlsx";
import { baixarPdf } from "@/lib/exportar/pdf";
import { formatarCnpj, formatarData, formatarMoeda } from "./formato";
import { calcularIndicadores, agruparPor } from "./indicadores";
import { STATUS_LABEL, type LinhaParcela } from "./tipos";

/** Colunas pedidas pelo cliente para o relatório de contas (§9 da missão). */
export const COLUNAS_CONTAS = [
  "Fornecedor",
  "CNPJ",
  "Documento",
  "Descrição",
  "Classificação",
  "Estabelecimento",
  "Parcela",
  "Vencimento",
  "Valor",
  "Status",
  "Dias em atraso",
  "Pagamento",
  "Banco",
  "Juros",
  "Multa",
  "Desconto",
  "Valor pago",
];

function linhaXlsx(l: LinhaParcela): Celula[] {
  return [
    l.fornecedor_nome ?? "",
    l.fornecedor_cnpj ? formatarCnpj(l.fornecedor_cnpj) : "",
    l.numero_documento ?? "",
    l.descricao,
    l.classificacao_nome ?? "",
    l.estabelecimento_nome ?? "",
    `${l.parcela_numero}/${l.parcela_total}`,
    { tipo: "data", valor: l.parcela_vencimento },
    { tipo: "moeda", valor: l.parcela_valor },
    STATUS_LABEL[l.status],
    l.dias_em_atraso > 0 ? l.dias_em_atraso : "",
    { tipo: "data", valor: l.ultima_data_pagamento },
    l.bancos_utilizados ?? "",
    { tipo: "moeda", valor: l.total_juros },
    { tipo: "moeda", valor: l.total_multa },
    { tipo: "moeda", valor: l.total_desconto },
    { tipo: "moeda", valor: l.total_pago },
  ];
}

function linhaPdf(l: LinhaParcela): string[] {
  return [
    l.fornecedor_nome ?? "—",
    l.numero_documento ?? "—",
    l.descricao.length > 34 ? `${l.descricao.slice(0, 33)}…` : l.descricao,
    l.classificacao_nome ?? "—",
    `${l.parcela_numero}/${l.parcela_total}`,
    formatarData(l.parcela_vencimento),
    formatarMoeda(l.parcela_valor),
    STATUS_LABEL[l.status],
    l.total_pago > 0 ? formatarMoeda(l.total_pago) : "—",
  ];
}

const COLUNAS_PDF = [
  "Fornecedor",
  "Doc.",
  "Descrição",
  "Classificação",
  "Parc.",
  "Vencimento",
  "Valor",
  "Status",
  "Pago",
];

function nomeArquivo(base: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${base}_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface ContextoExportacao {
  titulo: string;
  arquivo: string;
  periodo?: string;
  aviso?: string;
  /** Inclui a aba/seção de totais por classificação. */
  comResumoGerencial?: boolean;
}

export function exportarContasXlsx(linhas: LinhaParcela[], ctx: ContextoExportacao) {
  const i = calcularIndicadores(linhas);

  const planilhas: Planilha[] = [
    { nome: "Contas", colunas: COLUNAS_CONTAS, linhas: linhas.map(linhaXlsx) },
    {
      nome: "Resumo",
      colunas: ["Indicador", "Quantidade", "Valor"],
      linhas: [
        ["Contas vencendo hoje", i.vencendoHoje, { tipo: "moeda", valor: i.valorVencendoHoje }],
        ["Contas vencidas", i.vencidas, { tipo: "moeda", valor: i.valorVencido }],
        ["Contas a pagar (em aberto)", i.aPagar, { tipo: "moeda", valor: i.valorAPagar }],
        ["Parcelas quitadas", i.totalPago, { tipo: "moeda", valor: i.valorPago }],
        ["Juros pagos", "", { tipo: "moeda", valor: i.juros }],
        ["Multas pagas", "", { tipo: "moeda", valor: i.multas }],
        ["Descontos obtidos", "", { tipo: "moeda", valor: i.descontos }],
      ] as Celula[][],
    },
  ];

  if (ctx.comResumoGerencial) {
    planilhas.push({
      nome: "Por classificação",
      colunas: ["Classificação", "Quantidade", "Valor"],
      linhas: agruparPor(linhas, (l) => l.classificacao_nome).map(
        (g) => [g.label, g.quantidade, { tipo: "moeda", valor: g.valor }] as Celula[]
      ),
    });
    planilhas.push({
      nome: "Por fornecedor",
      colunas: ["Fornecedor", "Quantidade", "Valor"],
      linhas: agruparPor(linhas, (l) => l.fornecedor_nome).map(
        (g) => [g.label, g.quantidade, { tipo: "moeda", valor: g.valor }] as Celula[]
      ),
    });
  }

  baixarXlsx(planilhas, nomeArquivo(ctx.arquivo));
}

export function exportarContasPdf(linhas: LinhaParcela[], ctx: ContextoExportacao) {
  const i = calcularIndicadores(linhas);

  baixarPdf({
    titulo: ctx.titulo,
    subtitulo: `${linhas.length} registro(s)`,
    periodo: ctx.periodo,
    aviso: ctx.aviso,
    resumo: [
      { rotulo: "Total a pagar", valor: formatarMoeda(i.valorAPagar) },
      { rotulo: "Total pago", valor: formatarMoeda(i.valorPago) },
      { rotulo: "Vencidas", valor: `${i.vencidas} · ${formatarMoeda(i.valorVencido)}` },
      { rotulo: "Juros + multas", valor: formatarMoeda(i.juros + i.multas) },
    ],
    colunas: COLUNAS_PDF,
    linhas: linhas.map(linhaPdf),
    colunasNumericas: [6, 8],
    nomeArquivo: nomeArquivo(ctx.arquivo),
    paisagem: true,
  });
}
