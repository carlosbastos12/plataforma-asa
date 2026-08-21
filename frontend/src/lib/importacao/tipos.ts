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
  recorrencia: string | null;
  valor: number | null;
  valorPago: number | null;
  parcela: string | null;
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
