/**
 * COLUNA DA PLANILHA → CAMPO DA PLATAFORMA ASA.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ ATENÇÃO — ESTE NÃO É O LAYOUT OFICIAL DA AUTEM.                  │
 * │                                                                  │
 * │ Até esta data não recebemos nenhum arquivo real de exportação de │
 * │ despesas da AutEM. Os nomes de coluna listados abaixo são        │
 * │ APELIDOS ACEITOS, montados a partir da lista de campos que o     │
 * │ Vitor informou e das variações mais prováveis de escrita.        │
 * │ Nenhum deles foi confirmado contra um arquivo verdadeiro.        │
 * │                                                                  │
 * │ Quando o XLSX real chegar, o trabalho deve ser: comparar os      │
 * │ cabeçalhos reais com esta tabela, acrescentar/ajustar apelidos,  │
 * │ testar e validar com o Vitor. NENHUM outro arquivo do importador │
 * │ precisa mudar por causa de um nome de coluna.                    │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * O reconhecimento é por apelido normalizado (sem acento, sem
 * pontuação, minúsculo), não por posição: a ordem das colunas no arquivo
 * é irrelevante, e uma coluna a mais no meio não quebra nada.
 */

/** Cada campo que o importador sabe aproveitar. */
export type CampoAsa =
  | "idExterno"
  | "vencimento"
  | "liquidacao"
  | "dataLancamento"
  | "competencia"
  | "tipo"
  | "cnpj"
  | "numeroDocumento"
  | "formaPagamento"
  | "fornecedor"
  | "contaBancaria"
  | "descricao"
  | "centroCusto"
  | "categoria"
  | "observacao"
  | "recorrencia"
  | "valor"
  | "valorPago"
  | "parcela";

export type NaturezaDoCampo = "data" | "numero" | "texto";

export interface DefinicaoCampo {
  campo: CampoAsa;
  /** Como aparece na tela, para o usuário conferir o que foi reconhecido. */
  rotulo: string;
  natureza: NaturezaDoCampo;
  /** Nomes de coluna aceitos. O primeiro é o mais provável; o resto são variações. */
  apelidos: string[];
}

/**
 * Ordem intencional: é a mesma da lista de campos informada pelo Vitor,
 * para facilitar a conferência lado a lado quando o arquivo real chegar.
 */
export const CAMPOS: DefinicaoCampo[] = [
  {
    campo: "idExterno",
    rotulo: "Identificador na origem",
    natureza: "texto",
    // Se a exportação trouxer um identificador próprio, ele é a forma
    // mais confiável de saber que um lançamento já foi importado (§7).
    // Ainda não sabemos se existe — por isso é opcional.
    apelidos: ["id", "codigo", "cod", "id lancamento", "codigo lancamento", "id despesa", "codigo despesa", "identificador", "nº lancamento", "numero lancamento"],
  },
  {
    campo: "vencimento",
    rotulo: "Vencimento",
    natureza: "data",
    apelidos: ["vencimento", "data vencimento", "data de vencimento", "dt vencimento", "venc"],
  },
  {
    campo: "liquidacao",
    rotulo: "Liquidação",
    natureza: "data",
    apelidos: ["liquidacao", "data liquidacao", "data de liquidacao", "dt liquidacao", "liquidado em", "data pagamento", "data de pagamento", "dt pagamento", "pagamento em"],
  },
  {
    campo: "dataLancamento",
    rotulo: "Data de lançamento",
    natureza: "data",
    apelidos: ["data lancamento", "data de lancamento", "dt lancamento", "lancamento", "data emissao", "data de emissao", "emissao"],
  },
  {
    campo: "competencia",
    rotulo: "Competência",
    natureza: "data",
    apelidos: ["competencia", "mes competencia", "mes de competencia", "referencia", "mes referencia"],
  },
  {
    campo: "tipo",
    rotulo: "Tipo",
    natureza: "texto",
    apelidos: ["tipo", "tipo lancamento", "tipo de lancamento", "tipo despesa", "tipo de despesa", "natureza"],
  },
  {
    campo: "cnpj",
    rotulo: "CNPJ",
    natureza: "texto",
    apelidos: ["cnpj", "cnpj cpf", "cnpj/cpf", "cpf cnpj", "documento fornecedor", "cnpj fornecedor"],
  },
  {
    campo: "numeroDocumento",
    rotulo: "Nº do documento",
    natureza: "texto",
    apelidos: ["numero documento", "nº documento", "n documento", "documento", "num documento", "nf", "nota fiscal", "numero nf", "nº nf", "numero da nota", "doc"],
  },
  {
    campo: "formaPagamento",
    rotulo: "Forma de pagamento",
    natureza: "texto",
    apelidos: ["forma pagamento", "forma de pagamento", "meio pagamento", "meio de pagamento", "modo pagamento"],
  },
  {
    campo: "fornecedor",
    rotulo: "Fornecedor",
    natureza: "texto",
    apelidos: ["fornecedor", "favorecido", "credor", "razao social", "nome fornecedor", "beneficiario"],
  },
  {
    campo: "contaBancaria",
    rotulo: "Conta bancária",
    natureza: "texto",
    apelidos: ["conta bancaria", "conta", "banco", "conta corrente", "conta pagamento"],
  },
  {
    campo: "descricao",
    rotulo: "Descrição",
    natureza: "texto",
    apelidos: ["descricao", "historico", "historico lancamento", "discriminacao", "detalhe", "descricao despesa"],
  },
  {
    campo: "centroCusto",
    rotulo: "Centro de custo",
    natureza: "texto",
    apelidos: ["centro custo", "centro de custo", "cc", "centro resultado", "setor"],
  },
  {
    campo: "categoria",
    rotulo: "Categoria",
    natureza: "texto",
    apelidos: ["categoria", "classificacao", "plano contas", "plano de contas", "conta contabil", "grupo"],
  },
  {
    campo: "observacao",
    rotulo: "Observação",
    natureza: "texto",
    apelidos: ["observacao", "observacoes", "obs", "anotacao", "complemento"],
  },
  {
    campo: "recorrencia",
    rotulo: "Recorrência",
    natureza: "texto",
    apelidos: ["recorrencia", "recorrente", "periodicidade", "repeticao", "frequencia"],
  },
  {
    campo: "valor",
    rotulo: "Valor",
    natureza: "numero",
    apelidos: ["valor", "valor documento", "valor total", "valor bruto", "valor original", "valor lancamento", "vlr", "vlr documento"],
  },
  {
    campo: "valorPago",
    rotulo: "Valor pago",
    natureza: "numero",
    apelidos: ["valor pago", "vlr pago", "valor liquidado", "valor baixa", "valor quitado", "pago"],
  },
  {
    campo: "parcela",
    rotulo: "Parcela",
    natureza: "texto",
    apelidos: ["parcela", "parcelas", "nº parcela", "numero parcela", "n parcela", "parc"],
  },
];

/**
 * Campos sem os quais não é possível criar uma conta na Plataforma ASA.
 *
 * Curto de propósito: são exatamente as três colunas obrigatórias de
 * `contas` (descrição, valor, vencimento). Tudo o mais é aproveitado se
 * vier e simplesmente não é preenchido se não vier — nada é inventado.
 *
 * "Descrição" tem uma folga: se a planilha não trouxer descrição mas
 * trouxer fornecedor, a análise usa o fornecedor como descrição, porque
 * é isso que a pessoa reconheceria na lista.
 */
export const CAMPOS_OBRIGATORIOS: CampoAsa[] = ["valor", "vencimento"];

/** Conectivos que não distinguem uma coluna de outra. */
const CONECTIVOS = new Set(["de", "do", "da", "dos", "das", "e", "em", "no", "na"]);

/**
 * Normaliza um cabeçalho para comparação: minúsculo, sem acento, sem
 * pontuação, sem conectivos, espaços colapsados.
 *
 * Com isso "Nº do Documento", "numero documento" e "N. DOCUMENTO" viram
 * a mesma chave. Vale a pena ser generoso aqui justamente porque não
 * conhecemos a grafia exata que a AutEM usa — quanto mais variações a
 * normalização absorve, menos apelidos precisam ser adivinhados.
 */
export function normalizarCabecalho(texto: string): string {
  return texto
    .normalize("NFD")
    // Remove os acentos que o NFD separou. Precisa vir ANTES da troca
    // por espaço abaixo: sem isto "descrição" viraria "descric a o".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((palavra) => palavra !== "" && !CONECTIVOS.has(palavra))
    .join(" ");
}

const APELIDOS_PARA_CAMPO = (() => {
  const mapa = new Map<string, CampoAsa>();
  for (const definicao of CAMPOS) {
    for (const apelido of definicao.apelidos) {
      const chave = normalizarCabecalho(apelido);
      // O primeiro a registrar vence: apelidos ambíguos entre campos
      // (ex.: "grupo") ficam com o campo declarado antes na lista.
      if (!mapa.has(chave)) mapa.set(chave, definicao.campo);
    }
  }
  return mapa;
})();

export const DEFINICAO_POR_CAMPO = new Map(CAMPOS.map((d) => [d.campo, d]));

/** Reconhece um cabeçalho. `null` = coluna que o ASA não sabe aproveitar (§10). */
export function reconhecerColuna(cabecalho: string): CampoAsa | null {
  const chave = normalizarCabecalho(cabecalho);
  if (!chave) return null;
  return APELIDOS_PARA_CAMPO.get(chave) ?? null;
}

/* ===================================================================
 * SEPARAÇÃO DE RESPONSABILIDADE SOBRE CADA CAMPO (§8)
 *
 * Esta é a regra que protege o trabalho feito à mão na Plataforma ASA.
 * =================================================================== */

/**
 * Colunas de `contas` que a importação tem direito de escrever — são as
 * que descrevem o documento como ele veio da origem.
 */
export const COLUNAS_DA_ORIGEM = [
  "natureza",
  "fornecedor_id",
  "numero_documento",
  "descricao",
  "valor_inicial",
  "data_documento",
  "competencia",
  "vencimento",
  "forma_pagamento",
  "observacoes",
  "origem",
  "origem_ref",
  "origem_chave",
  "origem_dados",
] as const;

/**
 * Colunas que pertencem ao trabalho feito dentro da Plataforma ASA e que
 * a importação **nunca** escreve: enquadramento contábil, filial, texto
 * da contabilidade e o que mais a pessoa completar depois.
 *
 * A lista existe para ser conferida: qualquer caminho futuro que venha a
 * ATUALIZAR contas já importadas precisa restringir seu `patch` a
 * `COLUNAS_DA_ORIGEM` e nunca tocar em nada daqui. Hoje o importador
 * sequer atualiza — lançamento já existente é pulado —, então a garantia
 * é por construção; esta lista é o contrato para quando isso mudar.
 */
export const COLUNAS_DO_ASA = [
  "classificacao_id",
  "estabelecimento_id",
  "tipo_despesa_particular_id",
  "historico",
  "recorrente",
  "recorrencia_tipo",
  "periodicidade",
  "valor_aproximado",
  "ocorrencias",
  "cancelada",
] as const;
