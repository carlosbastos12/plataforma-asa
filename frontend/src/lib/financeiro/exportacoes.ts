import { baixarXlsx, type Celula, type Planilha } from "@/lib/exportar/xlsx";
import { baixarPdf } from "@/lib/exportar/pdf";
import { formatarCnpj, formatarData, formatarMoeda } from "./formato";
import { calcularIndicadores, agruparPor } from "./indicadores";
import { STATUS_LABEL, type LinhaPagamento, type LinhaParcela } from "./tipos";

/**
 * Colunas pedidas pelo cliente para o relatório de contas (§9 da missão),
 * ampliadas com Grupo/Observações/Histórico (D-047, Etapa 3) — os 3
 * campos que o relatório de ajustes apontou como faltantes.
 *
 * Esta é a exportação de "o que devo/devi" (grão de PARCELA — uma linha
 * por parcela, some ela paga ou não). NÃO é o formato que a
 * contabilidade usa: para isso existe `exportarFechamentoContabilXlsx`
 * abaixo, no grão de PAGAMENTO. Ver a explicação completa lá.
 */
export const COLUNAS_CONTAS = [
  "Fornecedor",
  "CNPJ",
  "Documento",
  "Descrição",
  "Grupo",
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
  "Observações",
  "Histórico",
];

function linhaXlsx(l: LinhaParcela): Celula[] {
  return [
    l.fornecedor_nome ?? "",
    l.fornecedor_cnpj ? formatarCnpj(l.fornecedor_cnpj) : "",
    l.numero_documento ?? "",
    l.descricao,
    l.classificacao_grupo ?? "",
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
    l.observacoes ?? "",
    l.historico ?? "",
  ];
}

function linhaPdf(l: LinhaParcela): string[] {
  return [
    l.fornecedor_nome ?? "—",
    l.numero_documento ?? "—",
    l.descricao.length > 34 ? `${l.descricao.slice(0, 33)}…` : l.descricao,
    l.classificacao_grupo ?? "—",
    l.classificacao_nome ?? "—",
    `${l.parcela_numero}/${l.parcela_total}`,
    formatarData(l.parcela_vencimento),
    formatarMoeda(l.parcela_valor),
    STATUS_LABEL[l.status],
    l.total_pago > 0 ? formatarMoeda(l.total_pago) : "—",
  ];
}

// Observações e Histórico ficam de fora do PDF de propósito: são texto
// livre, muitas vezes longo, e já quebrariam a tabela impressa mesmo em
// paisagem. Estão completos na exportação XLSX (acima) e no fechamento
// contábil (abaixo) — o PDF aqui é o resumo de leitura rápida.
const COLUNAS_PDF = [
  "Fornecedor",
  "Doc.",
  "Descrição",
  "Grupo",
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
    colunasNumericas: [7, 9], // Valor e Pago — deslocados pela coluna Grupo nova
    nomeArquivo: nomeArquivo(ctx.arquivo),
    paisagem: true,
  });
}

/* =======================================================================
 * FECHAMENTO PARA A CONTABILIDADE (D-047, Etapa 3) — grão de PAGAMENTO
 *
 * Decisão de arquitetura registrada em DECISIONS.md (D-047): as duas
 * exportações acima (`exportarContasXlsx`/`exportarContasPdf`) mostram
 * uma linha por PARCELA — correto para "o que a empresa deve", errado
 * para a planilha que vai para o contador. A planilha real do escritório
 * contábil (Lucro Real) tem uma linha por PAGAMENTO: se uma parcela foi
 * paga em duas vezes, são duas linhas, cada uma com sua data e banco —
 * informação que se perde ao somar tudo na parcela.
 *
 * Por isso esta exportação parte de `LinhaPagamento` (view
 * `vw_pagamentos_completo`, migration 0004), não de `LinhaParcela`. As
 * 13 colunas abaixo reproduzem exatamente o cabeçalho real da planilha
 * do escritório contábil (Data do PAGTO … Histórico) — nenhuma coluna a
 * mais, nenhuma a menos.
 * ======================================================================= */

export const COLUNAS_FECHAMENTO_CONTABIL = [
  "Data do PAGTO",
  "Estabelecimento",
  "Fornecedor",
  "Nº Doc/NF/NFS",
  "Pago via",
  "Classificação",
  "Valor Inicial",
  "Juros",
  "Multa",
  "Desconto",
  "Valor Pago",
  "Observações",
  "Histórico",
];

function linhaFechamentoXlsx(l: LinhaPagamento): Celula[] {
  return [
    { tipo: "data", valor: l.data_pagamento },
    l.estabelecimento_nome ?? "",
    l.fornecedor_nome ?? "",
    l.numero_documento ?? "",
    l.banco_nome ?? "",
    l.classificacao_nome ?? "",
    { tipo: "moeda", valor: l.valor_inicial },
    { tipo: "moeda", valor: l.juros },
    { tipo: "moeda", valor: l.multa },
    { tipo: "moeda", valor: l.desconto },
    { tipo: "moeda", valor: l.valor_pago },
    l.observacoes ?? "",
    l.historico ?? "",
  ];
}

/** Agregação simples por grupo contábil, no grão de pagamento — mesmo formato de `agruparPor`, mas sobre `LinhaPagamento`. */
function agruparPagamentosPorGrupo(
  linhas: LinhaPagamento[]
): { label: string; valor: number; quantidade: number }[] {
  const mapa = new Map<string, { valor: number; quantidade: number }>();
  for (const l of linhas) {
    const chave = l.classificacao_grupo ?? "Sem grupo";
    const atual = mapa.get(chave) ?? { valor: 0, quantidade: 0 };
    atual.valor += l.valor_pago;
    atual.quantidade += 1;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.valor - a.valor);
}

export function exportarFechamentoContabilXlsx(pagamentos: LinhaPagamento[], ctx: ContextoExportacao) {
  const totalPago = pagamentos.reduce((a, l) => a + l.valor_pago, 0);
  const totalJuros = pagamentos.reduce((a, l) => a + l.juros, 0);
  const totalMulta = pagamentos.reduce((a, l) => a + l.multa, 0);
  const totalDesconto = pagamentos.reduce((a, l) => a + l.desconto, 0);

  const planilhas: Planilha[] = [
    { nome: "Fechamento", colunas: COLUNAS_FECHAMENTO_CONTABIL, linhas: pagamentos.map(linhaFechamentoXlsx) },
    {
      nome: "Resumo",
      colunas: ["Indicador", "Quantidade", "Valor"],
      linhas: [
        ["Pagamentos no período", pagamentos.length, { tipo: "moeda", valor: totalPago }],
        ["Juros pagos", "", { tipo: "moeda", valor: totalJuros }],
        ["Multas pagas", "", { tipo: "moeda", valor: totalMulta }],
        ["Descontos obtidos", "", { tipo: "moeda", valor: totalDesconto }],
      ] as Celula[][],
    },
    {
      nome: "Por grupo contábil",
      colunas: ["Grupo", "Quantidade", "Valor"],
      linhas: agruparPagamentosPorGrupo(pagamentos).map(
        (g) => [g.label, g.quantidade, { tipo: "moeda", valor: g.valor }] as Celula[]
      ),
    },
  ];

  baixarXlsx(planilhas, nomeArquivo(ctx.arquivo));
}

// PDF do fechamento: Juros/Multa/Desconto viram uma coluna só (efeito
// líquido) para caber em paisagem sem truncar Fornecedor/Classificação.
// Observações e Histórico não entram — texto livre, disponível completo
// no XLSX acima, que é o arquivo que de fato vai para o contador.
const COLUNAS_FECHAMENTO_PDF = [
  "Data PAGTO",
  "Estabelecimento",
  "Fornecedor",
  "Doc./NF",
  "Classificação",
  "Pago via",
  "Valor Inicial",
  "Juros+Multa−Desc.",
  "Valor Pago",
];

function linhaFechamentoPdf(l: LinhaPagamento): string[] {
  return [
    formatarData(l.data_pagamento),
    l.estabelecimento_nome ?? "—",
    l.fornecedor_nome ?? "—",
    l.numero_documento ?? "—",
    l.classificacao_nome ?? "—",
    l.banco_nome ?? "—",
    formatarMoeda(l.valor_inicial),
    formatarMoeda(l.juros + l.multa - l.desconto),
    formatarMoeda(l.valor_pago),
  ];
}

export function exportarFechamentoContabilPdf(pagamentos: LinhaPagamento[], ctx: ContextoExportacao) {
  const totalPago = pagamentos.reduce((a, l) => a + l.valor_pago, 0);
  const totalJuros = pagamentos.reduce((a, l) => a + l.juros, 0);
  const totalMulta = pagamentos.reduce((a, l) => a + l.multa, 0);
  const totalDesconto = pagamentos.reduce((a, l) => a + l.desconto, 0);

  baixarPdf({
    titulo: ctx.titulo,
    subtitulo: `${pagamentos.length} pagamento(s)`,
    periodo: ctx.periodo,
    aviso: ctx.aviso,
    resumo: [
      { rotulo: "Total pago", valor: formatarMoeda(totalPago) },
      { rotulo: "Juros", valor: formatarMoeda(totalJuros) },
      { rotulo: "Multas", valor: formatarMoeda(totalMulta) },
      { rotulo: "Descontos", valor: formatarMoeda(totalDesconto) },
    ],
    colunas: COLUNAS_FECHAMENTO_PDF,
    linhas: pagamentos.map(linhaFechamentoPdf),
    colunasNumericas: [6, 7, 8],
    nomeArquivo: nomeArquivo(ctx.arquivo),
    paisagem: true,
  });
}
