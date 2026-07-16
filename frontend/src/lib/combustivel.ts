import { TODAY } from "./mock-data";

/**
 * Combustível (Missão P033, estendida na P036 — VDC-001 dores 5 e 15):
 * dois fluxos que hoje vivem separados — o tanque da base e o abastecimento
 * em posto durante viagem. Dados 100% fictícios (D-005). A partir da P036,
 * a tela demonstra o ciclo completo: entrada de combustível → estoque →
 * abastecimento (interno ou externo) → histórico → inteligência.
 */

export const FORNECEDORES_DIESEL = ["Distribuidora Rota Sul", "Distribuidora Vale Norte", "Petro Serra Distribuidora"];
export const POSTOS_EXTERNOS = ["Posto Estrela do Vale", "Posto Horizonte", "Posto Âncora"];
export const FORMAS_PAGAMENTO = ["Cartão frota", "PIX", "Espécie"] as const;

export type TipoEntrada = "compra" | "complemento" | "ajuste";

export const TIPO_ENTRADA_LABEL: Record<TipoEntrada, string> = {
  compra: "Compra",
  complemento: "Complemento",
  ajuste: "Ajuste de estoque",
};

export interface MovimentacaoTanque {
  data: string;
  hora: string;
  tipo: "entrada" | "saida";
  litros: number;
  descricao: string;
  placa?: string;
  responsavel: string;
  /** Só para entradas. */
  fornecedor?: string;
  notaFiscal?: string;
  tipoEntrada?: TipoEntrada;
}

export const TANQUE_BASE = {
  capacidadeLitros: 8000,
  fornecedor: "Distribuidora Rota Sul",
  ultimaEntrada: "2026-08-12",
};

/** Referência só para estimar valor de abastecimentos internos no histórico — não é preço de compra real. */
export const VALOR_REFERENCIA_LITRO = 6.15;

export const MOVIMENTACOES_TANQUE: MovimentacaoTanque[] = [
  { data: "2026-08-17", hora: "07:40", tipo: "saida", litros: 180, descricao: "Abastecimento antes da rota", placa: "RDX4A17", responsavel: "Renê Salgado" },
  { data: "2026-08-16", hora: "17:10", tipo: "saida", litros: 140, descricao: "Abastecimento antes da rota", placa: "BLN2C88", responsavel: "Otávio Bezerra" },
  { data: "2026-08-16", hora: "08:05", tipo: "saida", litros: 165, descricao: "Abastecimento antes da rota", placa: "VYX1E92", responsavel: "Théo Aragão" },
  { data: "2026-08-15", hora: "13:30", tipo: "saida", litros: 150, descricao: "Abastecimento antes da rota", placa: "KPT9F03", responsavel: "Cassiano Freire" },
  {
    data: "2026-08-12",
    hora: "09:00",
    tipo: "entrada",
    litros: 4000,
    descricao: "Recebimento de carga — NF 18420",
    responsavel: "Distribuidora Rota Sul",
    fornecedor: "Distribuidora Rota Sul",
    notaFiscal: "18420",
    tipoEntrada: "compra",
  },
  { data: "2026-08-10", hora: "16:45", tipo: "saida", litros: 175, descricao: "Abastecimento antes da rota", placa: "HQF6K05", responsavel: "Iolanda Prado" },
];

/** Saldo em conta corrente: soma entradas, subtrai saídas, a partir de um saldo de abertura fictício. */
export function estoqueAtualLitros(movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE): number {
  return movs.reduce((acc, m) => acc + (m.tipo === "entrada" ? m.litros : -m.litros), 3120);
}

export function consumoMedioDiarioLitros(movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE): number {
  const saidas = movs.filter((m) => m.tipo === "saida");
  const dias = new Set(saidas.map((m) => m.data)).size || 1;
  const total = saidas.reduce((acc, m) => acc + m.litros, 0);
  return Math.round(total / dias) || 480;
}

export function diasDeAutonomiaTanque(movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE): number {
  return Math.floor(estoqueAtualLitros(movs) / consumoMedioDiarioLitros(movs));
}

export function percentualTanque(movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE): number {
  return Math.round((estoqueAtualLitros(movs) / TANQUE_BASE.capacidadeLitros) * 100);
}

export interface AbastecimentoExterno {
  id: string;
  data: string;
  posto: string;
  cidade: string;
  motorista: string;
  placa: string;
  viagem: string;
  litros: number;
  valor: number;
  formaPagamento: string;
  quemRegistrou: string;
  status: "confirmado" | "pendente";
  observacoes?: string;
}

export const ABASTECIMENTOS_EXTERNOS: AbastecimentoExterno[] = [
  { id: "AB-4410", data: "2026-08-16", posto: "Posto Estrela do Vale", cidade: "Fortaleza", motorista: "Renê Salgado", placa: "RDX4A17", viagem: "BR-116 — atendimento em rota", litros: 220, valor: 1320, formaPagamento: "Cartão frota", quemRegistrou: "Renê Salgado", status: "confirmado" },
  { id: "AB-4409", data: "2026-08-15", posto: "Posto Horizonte", cidade: "Maracanaú", motorista: "Cassiano Freire", placa: "KPT9F03", viagem: "Anel Viário — remoção", litros: 190, valor: 1148.5, formaPagamento: "Cartão frota", quemRegistrou: "Cassiano Freire", status: "confirmado" },
  { id: "AB-4408", data: "2026-08-14", posto: "Posto Âncora", cidade: "Eusébio", motorista: "Otávio Bezerra", placa: "BLN2C88", viagem: "Rodovia do Contorno — reboque", litros: 165, valor: 995.85, formaPagamento: "PIX", quemRegistrou: "Otávio Bezerra", status: "confirmado" },
  { id: "AB-4407", data: "2026-08-12", posto: "Posto Estrela do Vale", cidade: "Fortaleza", motorista: "Théo Aragão", placa: "VYX1E92", viagem: "BR-116, km 40 — pane elétrica", litros: 210, valor: 1260, formaPagamento: "Cartão frota", quemRegistrou: "Théo Aragão", status: "confirmado" },
  { id: "AB-4406", data: "2026-08-10", posto: "Posto Horizonte", cidade: "Maracanaú", motorista: "Iolanda Prado", placa: "HQF6K05", viagem: "Av. Beira Rio — remoção", litros: 180, valor: 1080, formaPagamento: "Espécie", quemRegistrou: "Administrativo — Gilvania", status: "pendente" },
];

export function totalLitrosExternos30dias(): number {
  return ABASTECIMENTOS_EXTERNOS.reduce((acc, a) => acc + a.litros, 0);
}

export function totalGastoExternos30dias(): number {
  return ABASTECIMENTOS_EXTERNOS.reduce((acc, a) => acc + a.valor, 0);
}

export function abastecimentosPorPlaca(placa: string): AbastecimentoExterno[] {
  return ABASTECIMENTOS_EXTERNOS.filter((a) => a.placa === placa);
}

/* ---------------- Histórico unificado (base + externo) ---------------- */

export interface LinhaHistorico {
  id: string;
  data: string;
  placa: string;
  motorista: string;
  origem: "Tanque da Base" | "Posto Externo";
  litros: number;
  valor: number;
  quemRegistrou: string;
  status: "Confirmado" | "Pendente";
}

export function historicoAbastecimentos(
  movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE,
  externos: AbastecimentoExterno[] = ABASTECIMENTOS_EXTERNOS
): LinhaHistorico[] {
  const internos: LinhaHistorico[] = movs.filter((m) => m.tipo === "saida" && m.placa).map((m, i) => ({
    id: `INT-${i}`,
    data: m.data,
    placa: m.placa!,
    motorista: m.responsavel,
    origem: "Tanque da Base" as const,
    litros: m.litros,
    valor: Math.round(m.litros * VALOR_REFERENCIA_LITRO * 100) / 100,
    quemRegistrou: m.responsavel,
    status: "Confirmado" as const,
  }));

  const linhasExternas: LinhaHistorico[] = externos.map((a) => ({
    id: a.id,
    data: a.data,
    placa: a.placa,
    motorista: a.motorista,
    origem: "Posto Externo" as const,
    litros: a.litros,
    valor: a.valor,
    quemRegistrou: a.quemRegistrou,
    status: a.status === "confirmado" ? ("Confirmado" as const) : ("Pendente" as const),
  }));

  return [...internos, ...linhasExternas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/* ---------------- Inteligência operacional (P036) ---------------- */

function diasEntre(dataISO: string): number {
  return Math.round((TODAY.getTime() - new Date(dataISO + "T00:00:00").getTime()) / 86_400_000);
}

export interface InsightCombustivel {
  texto: string;
  atencao?: boolean;
}

/**
 * Frases fictícias, mas ancoradas no dataset real — cada uma soma um dado
 * que já está na tela, só que traduzido em decisão (P036).
 */
export function insightsCombustivel(
  movs: MovimentacaoTanque[] = MOVIMENTACOES_TANQUE,
  externos: AbastecimentoExterno[] = ABASTECIMENTOS_EXTERNOS
): InsightCombustivel[] {
  const autonomia = diasDeAutonomiaTanque(movs);
  const consumoMedio = consumoMedioDiarioLitros(movs);
  const foraDaBaseSemana = new Set(externos.filter((a) => diasEntre(a.data) <= 7).map((a) => a.placa)).size;
  const acimaDaMedia = externos.filter((a) => a.litros > consumoMedio * 0.6).length;
  const proximaCompra = Math.max(autonomia - 2, 1);

  return [
    { texto: `Estoque suficiente para aproximadamente ${autonomia} dias no ritmo atual de consumo.`, atencao: autonomia <= 3 },
    {
      texto: acimaDaMedia === 0 ? "Nenhum abastecimento acima da média nos últimos registros." : `${acimaDaMedia} abastecimento(s) acima da média recente — vale conferir.`,
      atencao: acimaDaMedia > 0,
    },
    {
      texto: foraDaBaseSemana === 0 ? "Nenhum veículo abasteceu fora da base nesta semana." : `${foraDaBaseSemana} veículo(s) abasteceram fora da base nesta semana.`,
    },
    { texto: `Próxima compra recomendada em aproximadamente ${proximaCompra} dias, para não zerar o estoque.`, atencao: proximaCompra <= 2 },
  ];
}
