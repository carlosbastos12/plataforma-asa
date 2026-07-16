/**
 * Séries ilustrativas dos gráficos do Dashboard (P036).
 *
 * Diferente do resto de `mock-data.ts`, estas séries não derivam de nenhuma
 * regra de negócio real — a base de Caixa Particular e Multas do produto
 * tem poucos dias/meses de histórico para alimentar um gráfico de 30 dias
 * ou 6 meses. São números fictícios de demonstração (D-005), só para o
 * gráfico ter uma forma plausível de ler.
 */

export const CAIXA_ULTIMOS_30_DIAS: number[] = [
  420, 610, 380, 720, 860, 540, 690, 910, 730, 610, 480, 820, 940, 760, 650, 880, 1020, 790, 610, 540, 720, 860, 940,
  1080, 860, 720, 980, 1120, 940, 1180,
];

export const CAIXA_30_DIAS_LABELS: string[] = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  return d % 5 === 0 || d === 1 ? String(d).padStart(2, "0") : "";
});

export const MULTAS_POR_MES: { label: string; value: number }[] = [
  { label: "Fev", value: 5 },
  { label: "Mar", value: 8 },
  { label: "Abr", value: 4 },
  { label: "Mai", value: 9 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
];
