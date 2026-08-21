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

/**
 * Modelo de texto para o campo `historico` de uma conta — catálogo
 * extraído da coluna "Base do Histórico" da planilha real do escritório
 * contábil (D-047). Serve só como ponto de partida: o campo de registro
 * continua sendo texto livre, editável depois de escolhido um modelo.
 */
export interface ModeloHistorico {
  id: string;
  texto: string;
}

export type TipoDocumento = "nf" | "boleto" | "comprovante" | "outro";

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  nf: "Nota Fiscal",
  boleto: "Boleto",
  comprovante: "Comprovante de pagamento",
  outro: "Outro",
};

/** Um arquivo anexado a uma conta (NF, boleto, comprovante...) — D-047, Etapa 4. */
export interface Documento {
  id: string;
  conta_id: string;
  parcela_id: string | null;
  pagamento_id: string | null;
  tipo: TipoDocumento;
  nome: string;
  storage_path: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
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

/**
 * Tipo de despesa particular (Água, Aluguel, Internet...), cadastrado
 * pela própria pessoa. Não confundir com `Classificacao` — aquela é a
 * estrutura contábil da empresa (D-043/D-044).
 */
export interface TipoDespesaParticular {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Perfil {
  id: string;
  nome: string;
  papel: "gestora" | "administrativo" | "logistico" | "consulta";
  pode_ver_particular: boolean;
}

/** Rótulo de exibição para cada papel — mesmos valores do enum `papel_usuario` do banco. */
export const PAPEL_LABEL: Record<Perfil["papel"], string> = {
  gestora: "Gestora",
  administrativo: "Administrativo",
  logistico: "Logístico",
  consulta: "Consulta",
};

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
  tipo_despesa_particular_nome: string | null;
  total_pago: number;
  total_juros: number;
  total_multa: number;
  total_desconto: number;
  ultima_data_pagamento: string | null;
  bancos_utilizados: string | null;
  status: StatusParcela;
  dias_em_atraso: number;
  /** Texto contábil do lançamento (D-047) — NÃO é auditoria; ver comentário na migration 0004. */
  historico: string | null;
  /**
   * De onde a conta veio (migration 0005). Opcional porque a coluna só
   * existe depois dessa migration — antes dela a view não devolve o campo.
   */
  origem?: "manual" | "planilha";
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

/**
 * Uma linha da view `vw_pagamentos_completo` (D-047) — grão de
 * PAGAMENTO, não de parcela. É a fonte da exportação para a
 * contabilidade (Etapa 3): a planilha real do escritório contábil tem
 * uma linha por pagamento, não por parcela — uma parcela paga em duas
 * vezes precisa virar duas linhas na exportação, cada uma com sua
 * própria data e banco. `vw_parcelas_completo` (acima) continua sendo a
 * fonte de "o que devo": ali os pagamentos de uma parcela são somados
 * num total, porque para esse propósito o que importa é o saldo, não o
 * histórico de cada evento de pagamento.
 */
export interface LinhaPagamento {
  pagamento_id: string;
  parcela_id: string;
  conta_id: string;
  parcela_numero: number;
  parcela_total: number;
  data_pagamento: string;
  natureza: NaturezaConta;
  descricao: string;
  numero_documento: string | null;
  historico: string | null;
  observacoes: string | null;
  cancelada: boolean;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
  estabelecimento_nome: string | null;
  classificacao_grupo: string | null;
  classificacao_nome: string | null;
  banco_nome: string | null;
  forma_pagamento: string | null;
  valor_inicial: number;
  juros: number;
  multa: number;
  desconto: number;
  valor_pago: number;
}

export function normalizarLinhaPagamento(bruta: Record<string, unknown>): LinhaPagamento {
  const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
  return {
    ...(bruta as unknown as LinhaPagamento),
    parcela_numero: num(bruta.parcela_numero),
    parcela_total: num(bruta.parcela_total),
    valor_inicial: num(bruta.valor_inicial),
    juros: num(bruta.juros),
    multa: num(bruta.multa),
    desconto: num(bruta.desconto),
    valor_pago: num(bruta.valor_pago),
  };
}
