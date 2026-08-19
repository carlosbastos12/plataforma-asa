import type { LinhaParcela } from "./tipos";

/**
 * Indicadores da Central Financeira — funções puras sobre as linhas já
 * carregadas. Ficam separadas da consulta para poderem ser reaproveitadas
 * na Home, nos relatórios e em testes, sem novo acesso ao banco.
 */
export interface IndicadoresFinanceiros {
  vencendoHoje: number;
  valorVencendoHoje: number;
  vencidas: number;
  valorVencido: number;
  aPagar: number;
  valorAPagar: number;
  totalPago: number;
  valorPago: number;
  juros: number;
  multas: number;
  descontos: number;
  /** Pendências que travam o fechamento contábil (§32). */
  semClassificacao: number;
  semDocumento: number;
}

export function calcularIndicadores(linhas: LinhaParcela[]): IndicadoresFinanceiros {
  // O status já vem calculado pelo banco (view `vw_parcelas_completo`),
  // então aqui não se recalcula data — só se agrega.
  const ativas = linhas.filter((l) => l.status !== "cancelada");

  const vencendoHoje = ativas.filter((l) => l.status === "vence_hoje");
  const vencidas = ativas.filter((l) => l.status === "vencida");
  // "A pagar" = tudo que ainda não foi quitado, incluindo o que vence hoje.
  const aPagar = ativas.filter(
    (l) => l.status === "a_vencer" || l.status === "vence_hoje" || l.status === "vencida" || l.status === "parcialmente_paga"
  );
  const pagas = ativas.filter((l) => l.status === "paga");

  const soma = (arr: LinhaParcela[], f: (l: LinhaParcela) => number) => arr.reduce((a, l) => a + f(l), 0);
  // No que está em aberto, o que falta é o saldo — não o valor cheio da parcela.
  const saldo = (l: LinhaParcela) => Math.max(l.parcela_valor - l.total_pago, 0);

  return {
    vencendoHoje: vencendoHoje.length,
    valorVencendoHoje: soma(vencendoHoje, saldo),
    vencidas: vencidas.length,
    valorVencido: soma(vencidas, saldo),
    aPagar: aPagar.length,
    valorAPagar: soma(aPagar, saldo),
    totalPago: pagas.length,
    valorPago: soma(ativas, (l) => l.total_pago),
    juros: soma(ativas, (l) => l.total_juros),
    multas: soma(ativas, (l) => l.total_multa),
    descontos: soma(ativas, (l) => l.total_desconto),
    semClassificacao: ativas.filter((l) => !l.classificacao_nome).length,
    semDocumento: ativas.filter((l) => !l.numero_documento).length,
  };
}

/** Agrupamento usado nos relatórios gerenciais e no dashboard. */
export function agruparPor(
  linhas: LinhaParcela[],
  chave: (l: LinhaParcela) => string | null
): { label: string; valor: number; quantidade: number }[] {
  const mapa = new Map<string, { valor: number; quantidade: number }>();
  for (const l of linhas) {
    if (l.status === "cancelada") continue;
    const k = chave(l) ?? "Sem classificação";
    const atual = mapa.get(k) ?? { valor: 0, quantidade: 0 };
    atual.valor += l.parcela_valor;
    atual.quantidade += 1;
    mapa.set(k, atual);
  }
  return Array.from(mapa.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.valor - a.valor);
}
