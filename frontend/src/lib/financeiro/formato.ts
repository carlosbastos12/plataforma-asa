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

/**
 * Lê um valor em dinheiro digitado à mão e devolve o número.
 *
 * Existe porque `Number(texto.replace(",", "."))` — o que era usado antes
 * em todo campo de dinheiro — troca só a PRIMEIRA vírgula e não conhece
 * separador de milhar. Com isso, alguém digitando do jeito brasileiro
 * errava de dois modos, um barulhento e um silencioso:
 *
 *   "1.500,50"  ->  "1.500.50"  ->  NaN  ->  0   (a conta era recusada com
 *                                                 "informe um valor maior
 *                                                 que zero", com o campo
 *                                                 visivelmente preenchido)
 *   "1.500"     ->  1,5                          (gravava R$ 1,50 no lugar
 *                                                 de R$ 1.500,00, SEM erro
 *                                                 nenhum na tela)
 *
 * A regra aqui: descarta o que não é número (R$, espaço); quando vírgula
 * e ponto aparecem juntos, o último dos dois é o separador decimal e o
 * outro é de milhar; separador repetido é sempre de milhar; e um ponto
 * único seguido de exatamente 3 dígitos é milhar ("1.500"), a não ser que
 * a parte inteira seja zero ("0.500" continua sendo meio).
 */
export function paraNumero(texto: string): number {
  const limpo = String(texto ?? "").replace(/[^\d.,-]/g, "");
  if (limpo === "" || limpo === "-") return 0;

  const virgulas = (limpo.match(/,/g) ?? []).length;
  const pontos = (limpo.match(/\./g) ?? []).length;

  let normalizado: string;

  if (virgulas > 0 && pontos > 0) {
    // Os dois presentes: quem aparece por último é o decimal.
    const decimal = limpo.lastIndexOf(",") > limpo.lastIndexOf(".") ? "," : ".";
    const milhar = decimal === "," ? "." : ",";
    normalizado = limpo.split(milhar).join("").replace(decimal, ".");
  } else if (virgulas > 1 || pontos > 1) {
    // Separador repetido só pode ser de milhar.
    normalizado = limpo.replace(/[.,]/g, "");
  } else if (virgulas === 1) {
    normalizado = limpo.replace(",", ".");
  } else if (pontos === 1) {
    const [inteiro, decimais] = limpo.split(".");
    const ehMilhar = decimais.length === 3 && inteiro.replace("-", "") !== "0" && inteiro !== "";
    normalizado = ehMilhar ? inteiro + decimais : limpo;
  } else {
    normalizado = limpo;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/** Tamanho de arquivo em KB/MB, para a lista de documentos anexados (Etapa 4). */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
