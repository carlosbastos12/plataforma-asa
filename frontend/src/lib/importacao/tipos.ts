import type { CampoAsa } from "./mapeamento";

/**
 * Como cada linha do arquivo foi classificada. É o que decide a cor na
 * prévia e o que será (ou não) gravado.
 */
export type SituacaoLinha =
  /** Ainda não existe na Plataforma ASA — será criada. */
  | "novo"
  /** Já existe, reconhecida com segurança. Não é regravada nem alterada. */
  | "existente"
  /** Parece com algo que já existe, mas sem certeza. Fica para o usuário decidir. */
  | "duplicado_possivel"
  /** Falta informação essencial ou algum dado não pôde ser lido. Não é importada. */
  | "erro";

/** Os campos da origem, já lidos e normalizados. Nada aqui é inventado: ausente vira `null`. */
export interface DadosOrigem {
  idExterno: string | null;
  vencimento: string | null;
  liquidacao: string | null;
  dataLancamento: string | null;
  competencia: string | null;
  tipo: string | null;
  cnpj: string | null;
  numeroDocumento: string | null;
  formaPagamento: string | null;
  fornecedor: string | null;
  contaBancaria: string | null;
  descricao: string | null;
  centroCusto: string | null;
  categoria: string | null;
  observacao: string | null;
  /** Texto cru da coluna "Recorrência". Apesar do nome, traz a POSIÇÃO da parcela ("08/12"). */
  recorrencia: string | null;
  /** Valor da obrigação, já no jeito do ASA: sempre positivo. */
  valor: number | null;
  /** Valor exatamente como veio da origem — negativo, no caso da AutEM. Nunca descartado. */
  valorOriginal: number | null;
  /** Valor já pago, positivo. `null` ou 0 = ainda não liquidado. */
  valorPago: number | null;
  /** Valor pago como veio da origem. */
  valorPagoOriginal: number | null;
  /** Texto cru de uma coluna "Parcela", quando a exportação tiver uma. */
  parcela: string | null;
  /** Posição da parcela — de "Recorrência" (`08/12`) ou de uma coluna "Parcela". */
  parcelaNumero: number | null;
  parcelaTotal: number | null;
  /** Forma de pagamento traduzida para o vocabulário do ASA. `null` = sem correspondência. */
  formaPagamentoAsa: string | null;
  /** Classificação do ASA correspondente à Categoria da origem. `null` = completar à mão. */
  classificacaoId: string | null;
  classificacaoNome: string | null;
  /** Grupo contábil — da classificação encontrada ou do Centro de custo. `null` = completar à mão. */
  grupo: string | null;
  /** Banco do ASA correspondente à Conta bancária da origem. `null` = completar à mão. */
  bancoId: string | null;
  bancoNome: string | null;
  /** Colunas que a planilha trouxe e o ASA não sabe aproveitar (§10) — guardadas, nunca descartadas. */
  extras: Record<string, string>;
}

export interface LinhaAnalisada {
  /** Número da linha como aparece no Excel — para a pessoa achar o problema no arquivo. */
  numeroLinha: number;
  situacao: SituacaoLinha;
  /** Por que a linha não pode ser importada. Só preenchido quando `situacao = "erro"`. */
  problemas: string[];
  /** Observações que NÃO impedem a importação (ex.: categoria sem correspondência). */
  avisos: string[];
  /** Frase curta explicando a situação, para a coluna "Situação" da prévia. */
  motivo: string;
  dados: DadosOrigem;
  /** Chave de reconciliação — apoio para detectar duplicidade, nunca identidade sozinha. */
  chave: string | null;
}

export interface ColunaReconhecida {
  /** Cabeçalho exatamente como está no arquivo. */
  cabecalho: string;
  /** `null` = coluna sem correspondência no ASA. */
  campo: CampoAsa | null;
}

export interface ResumoAnalise {
  total: number;
  novos: number;
  existentes: number;
  duplicadosPossiveis: number;
  comProblema: number;
  /** Linhas que entram, mas trazem algo que a origem não resolve e alguém precisa completar depois. */
  comComplemento: number;
}

export interface ResultadoAnalise {
  ok: true;
  arquivo: string;
  /** Nome da aba de onde os dados foram lidos. */
  aba: string;
  colunas: ColunaReconhecida[];
  /** Cabeçalhos do arquivo sem correspondência no ASA (§10) — informados, não descartados. */
  colunasSemCorrespondencia: string[];
  /** Campos obrigatórios do ASA que o arquivo não trouxe. */
  camposAusentes: CampoAsa[];
  linhas: LinhaAnalisada[];
  resumo: ResumoAnalise;
}

export interface FalhaAnalise {
  ok: false;
  erro: string;
}

export interface ResultadoImportacao {
  ok: boolean;
  erro?: string;
  importados: number;
  jaExistentes: number;
  duplicadosIgnorados: number;
  naoImportados: number;
  /** Mensagens de linhas que falharam na gravação, para o relatório final. */
  falhas: { numeroLinha: number; motivo: string }[];
}
