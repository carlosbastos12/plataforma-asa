/**
 * Formatação da Central Financeira.
 *
 * Independente de `mock-data.ts` de propósito: aquele módulo formata o
 * dataset fictício da demonstração; este trata dado real de dinheiro.
 */

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aceita "2026-08-20" sem deslocar o dia por fuso horário. */
export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

/** Data de hoje em ISO (YYYY-MM-DD), no fuso local — nunca UTC. */
export function hojeISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Primeiro e último dia do mês corrente, para filtros de período. */
export function mesCorrente(): { inicio: string; fim: string } {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = d.getMonth();
  const p = (n: number) => String(n).padStart(2, "0");
  const ultimo = new Date(ano, mes + 1, 0).getDate();
  return {
    inicio: `${ano}-${p(mes + 1)}-01`,
    fim: `${ano}-${p(mes + 1)}-${p(ultimo)}`,
  };
}

export function formatarCnpj(cnpj: string | null): string {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Regra do cliente (§12), replicada no cliente apenas para dar retorno
 * imediato enquanto o usuário digita. O valor que vale é o calculado
 * pelo banco (coluna gerada `valor_pago`) — aqui é só espelho.
 */
export function calcularValorPago(
  valorInicial: number,
  juros: number,
  multa: number,
  desconto: number
): number {
  return Number((valorInicial + juros + multa - desconto).toFixed(2));
}
