import { rotuloMes } from "./formato";
import type { LinhaParcela } from "./tipos";

/**
 * Agrupamento da lista de Contas a Pagar por mês de vencimento.
 *
 * Função pura, separada da tela pelo mesmo motivo de `filtros.ts` e
 * `indicadores.ts`: é regra de organização do dado, não de desenho. A
 * tela só recebe os grupos prontos e desenha.
 */
export interface GrupoMes {
  /** "2026-08" — serve de chave do React e de critério de ordenação. */
  chave: string;
  /** "Agosto 2026" — o texto que aparece no cabeçalho do grupo. */
  rotulo: string;
  linhas: LinhaParcela[];
  /** Soma de `parcela_valor` do mês, para conferência rápida. */
  total: number;
}

/** "2026-08-31" -> "2026-08". Devolve "" para data ausente ou fora do padrão. */
function chaveDoMes(iso: string | null): string {
  const chave = (iso ?? "").slice(0, 7);
  return /^\d{4}-\d{2}$/.test(chave) ? chave : "";
}

/**
 * Agrupa por mês de vencimento, com os meses em ordem cronológica e as
 * contas ordenadas por vencimento dentro de cada mês.
 *
 * A ordenação é refeita aqui em vez de confiar na ordem que veio do
 * banco: assim o agrupamento continua correto mesmo que a consulta mude
 * de ordem um dia. `sort` é estável, então contas que vencem no mesmo
 * dia mantêm exatamente a ordem que já tinham — nada se mexe de lugar
 * em relação ao que a tela mostrava antes.
 */
export function agruparPorMesVencimento(linhas: LinhaParcela[]): GrupoMes[] {
  const porMes = new Map<string, LinhaParcela[]>();

  for (const l of linhas) {
    const chave = chaveDoMes(l.parcela_vencimento);
    const grupo = porMes.get(chave);
    if (grupo) grupo.push(l);
    else porMes.set(chave, [l]);
  }

  return Array.from(porMes.entries())
    .sort(([a], [b]) => {
      // Data ausente (não deveria existir) vai para o fim, nunca some.
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    })
    .map(([chave, doMes]) => {
      const ordenadas = [...doMes].sort((a, b) => a.parcela_vencimento.localeCompare(b.parcela_vencimento));
      return {
        chave,
        rotulo: chave === "" ? "Sem vencimento" : rotuloMes(`${chave}-01`),
        linhas: ordenadas,
        total: ordenadas.reduce((s, l) => s + l.parcela_valor, 0),
      };
    });
}
