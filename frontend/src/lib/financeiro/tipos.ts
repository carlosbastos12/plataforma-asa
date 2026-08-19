/**
 * Tipos da Central Financeira.
 *
 * Espelham o schema real do Supabase (supabase/migrations/0001_central_financeira.sql).
 * Nada aqui é dado fictício: este módulo opera sobre o banco de verdade,
 * ao contrário do restante da plataforma, que segue em demonstração.
 */

export type NaturezaConta = "empresa" | "particular";

export type StatusParcela =
  | "a_vencer"
  | "vence_hoje"
  | "vencida"
  | "paga"
  | "parcialmente_paga"
  | "cancelada";

export type TipoRecorrencia = "fixa" | "variavel" | "reajustavel";

export type Periodicidade =
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

export const STATUS_LABEL: Record<StatusParcela, string> = {
  a_vencer: "A vencer",
  vence_hoje: "Vence hoje",
  vencida: "Vencida",
  paga: "Paga",
  parcialmente_paga: "Parcialmente paga",
  cancelada: "Cancelada",
};

/** Formas de pagamento padronizadas (§25 do documento de requisitos do cliente). */
export const FORMAS_PAGAMENTO = [
  "Boleto",
  "PIX",
  "Transferência",
  "Cartão",
  "Débito automático",
  "Outros",
] as const;

export const TIPOS_RECORRENCIA: { valor: TipoRecorrencia; label: string; ajuda: string }[] = [
  { valor: "fixa", label: "Fixa", ajuda: "Mesmo valor todo período (ex.: aluguel)." },
  { valor: "variavel", label: "Variável", ajuda: "O valor muda a cada período (ex.: energia)." },
  { valor: "reajustavel", label: "Reajustável", ajuda: "Valor fixo que sofre reajuste periódico." },
];

export const PERIODICIDADES: { valor: Periodicidade; label: string }[] = [
  { valor: "semanal", label: "Semanal" },
  { valor: "quinzenal", label: "Quinzenal" },
  { valor: "mensal", label: "Mensal" },
  { valor: "bimestral", label: "Bimestral" },
  { valor: "trimestral", label: "Trimestral" },
  { valor: "semestral", label: "Semestral" },
  { valor: "anual", label: "Anual" },
];

export interface Classificacao {
  id: string;
  grupo: string;
  nome: string;
  confirmacao_pendente: boolean;
}

export interface Estabelecimento {
  id: string;
  nome: string;
}

export interface Banco {
  id: string;
  nome: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
}

export interface Perfil {
  id: string;
  nome: string;
  papel: "gestora" | "administrativo" | "logistico" | "consulta";
  pode_ver_particular: boolean;
}

/** Uma linha da visão consolidada `vw_parcelas_completo`. */
export interface LinhaParcela {
  parcela_id: string;
  conta_id: string;
  parcela_numero: number;
  parcela_total: number;
  parcela_valor: number;
  parcela_vencimento: string;
  natureza: NaturezaConta;
  descricao: string;
  numero_documento: string | null;
  conta_valor: number;
  data_documento: string | null;
  competencia: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  recorrente: boolean;
  recorrencia_tipo: TipoRecorrencia | null;
  periodicidade: Periodicidade | null;
  cancelada: boolean;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
  estabelecimento_nome: string | null;
  classificacao_grupo: string | null;
  classificacao_nome: string | null;
  total_pago: number;
  total_juros: number;
  total_multa: number;
  total_desconto: number;
  ultima_data_pagamento: string | null;
  bancos_utilizados: string | null;
  status: StatusParcela;
  dias_em_atraso: number;
}

/**
 * O PostgREST devolve `numeric` como string em alguns casos. Normalizar
 * na fronteira evita bug silencioso de soma ("10" + "5" = "105").
 */
export function normalizarLinha(bruta: Record<string, unknown>): LinhaParcela {
  const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
  return {
    ...(bruta as unknown as LinhaParcela),
    parcela_numero: num(bruta.parcela_numero),
    parcela_total: num(bruta.parcela_total),
    parcela_valor: num(bruta.parcela_valor),
    conta_valor: num(bruta.conta_valor),
    total_pago: num(bruta.total_pago),
    total_juros: num(bruta.total_juros),
    total_multa: num(bruta.total_multa),
    total_desconto: num(bruta.total_desconto),
    dias_em_atraso: num(bruta.dias_em_atraso),
  };
}
