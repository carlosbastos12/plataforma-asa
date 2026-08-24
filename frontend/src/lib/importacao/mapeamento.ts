/**
 * COLUNA DA PLANILHA → CAMPO DA PLATAFORMA ASA.
 *
 * LAYOUT REAL CONFERIDO. Os 18 cabeçalhos da exportação de despesas da
 * AutEM foram verificados contra o arquivo verdadeiro e são reconhecidos:
 *
 *   Vencimento · Liquidação · Lançamento · Competência · Tipo · CNPJ ·
 *   Nº Documento · Forma de Pgto. · Cliente / Fornecedor · Conta Bancaria ·
 *   Descrição · Centro de Custo · Categoria · Observação · Recorrência ·
 *   Valor Pago (R$) · Valor (R$) · Diferença (R$)
 *
 * Os demais apelidos de cada campo continuam aceitos de propósito: se a
 * AutEM mudar a grafia de uma coluna numa atualização, o importador
 * continua funcionando. É este o único arquivo que precisa mudar quando
 * um cabeçalho novo aparecer.
 *
 * `Diferença (R$)` é reconhecida como coluna SEM correspondência, e isso
 * é correto: ela não descreve a despesa e no arquivo real vem com escala
 * inconsistente. Fica guardada em `origem_dados`, nunca interpretada.
 *
 * O reconhecimento é por apelido normalizado (sem acento, sem unidade
 * entre parênteses, sem pontuação, minúsculo), não por posição: a ordem
 * das colunas é irrelevante e uma coluna a mais no meio não quebra nada.
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
    apelidos: ["forma pagamento", "forma de pagamento", "forma pgto", "forma de pgto", "forma pagto", "meio pagamento", "meio de pagamento", "modo pagamento", "pgto", "pagto"],
  },
  {
    campo: "fornecedor",
    rotulo: "Fornecedor",
    natureza: "texto",
    apelidos: ["fornecedor", "cliente fornecedor", "fornecedor cliente", "favorecido", "credor", "razao social", "nome fornecedor", "beneficiario", "cliente"],
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
 * unidade entre parênteses, sem pontuação, sem conectivos.
 *
 * Com isso "Nº do Documento", "numero documento" e "N. DOCUMENTO" viram
 * a mesma chave.
 *
 * **O trecho entre parênteses é removido inteiro, e é o que consertou o
 * caso real.** "Valor (R$)" perdia o cifrão e os parênteses na limpeza
 * de pontuação e virava `"valor r"` — que não batia com apelido nenhum,
 * e por isso a planilha inteira era recusada com "não tem a coluna de
 * Valor". Parênteses em cabeçalho carregam unidade ou qualificador
 * ("(R$)", "(un)", "(%)"), nunca o nome do campo, então descartá-los
 * antes de tudo resolve a família inteira de casos em vez de só este.
 */
export function normalizarCabecalho(texto: string): string {
  return texto
    // Precisa vir ANTES de tudo: depois da limpeza de pontuação já não
    // dá para saber o que era unidade entre parênteses.
    .replace(/\([^)]*\)/g, " ")
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
 * FORMA DE PAGAMENTO — vocabulário da origem × vocabulário do ASA
 * =================================================================== */

/**
 * Correspondência entre como a origem escreve a forma de pagamento e as
 * opções que o ASA já usa (`FORMAS_PAGAMENTO` em `financeiro/tipos.ts`).
 *
 * As chaves passam pela mesma normalização dos cabeçalhos, então
 * "BOLETO BANCARIO", "Boleto Bancário" e "boleto bancario" caem no mesmo
 * lugar. Os quatro valores encontrados no arquivo real da AutEM são
 * BOLETO BANCARIO, PIX, CARNE e DEBITO AUTOMATICO — os três primeiros
 * mapeados abaixo; **"carnê" não tem equivalente no ASA e por isso NÃO
 * está aqui**: inventar uma tradução seria pior que deixar o campo em
 * branco para a pessoa escolher.
 */
const FORMA_PAGAMENTO_DA_ORIGEM: Record<string, string> = {
  boleto: "Boleto",
  "boleto bancario": "Boleto",
  "boleto bancario registrado": "Boleto",
  pix: "PIX",
  "transferencia": "Transferência",
  "transferencia bancaria": "Transferência",
  ted: "Transferência",
  doc: "Transferência",
  cartao: "Cartão",
  "cartao credito": "Cartão",
  "cartao debito": "Cartão",
  "debito automatico": "Débito automático",
  debito: "Débito automático",
};

/**
 * Traduz a forma de pagamento da origem para o vocabulário do ASA.
 *
 * `null` = veio algo que o ASA não conhece (ex.: "CARNE"). Nesse caso o
 * campo fica em branco na conta e a prévia avisa que precisa ser
 * escolhido à mão — o texto original nunca é descartado: vai inteiro
 * para `origem_dados`.
 */
export function traduzirFormaPagamento(bruto: string | null): string | null {
  if (!bruto) return null;
  return FORMA_PAGAMENTO_DA_ORIGEM[normalizarCabecalho(bruto)] ?? null;
}

/* ===================================================================
 * CENTRO DE CUSTO → GRUPO  e  CATEGORIA → CLASSIFICAÇÃO
 *
 * Decisão de negócio confirmada: o Centro de Custo da origem é o Grupo
 * contábil do ASA, e a Categoria é a Classificação.
 *
 * O casamento acontece em duas etapas, nesta ordem:
 *
 *   1. NOME IGUAL — o texto da origem, normalizado, bate com o nome de
 *      um Grupo ou de uma Classificação que já existe no banco. É
 *      automático, vale para qualquer valor novo que apareça e não
 *      depende de ninguém manter lista.
 *   2. TABELA DE SINÔNIMOS — abaixo. Só para quando as duas pontas
 *      dizem a mesma coisa com palavras diferentes.
 *
 * Não havendo nem um nem outro, o campo fica VAZIO e a prévia avisa que
 * aquele lançamento precisa ser completado. Nunca é atribuído um grupo
 * ou uma classificação "parecida": errar o enquadramento contábil é pior
 * do que deixar em branco para alguém escolher.
 * =================================================================== */

/**
 * Sinônimos de Centro de custo → Grupo.
 *
 * Deliberadamente curta. Só entram aqui os casos em que a origem e o ASA
 * usam **a mesma palavra**, mudando apenas número ou complemento:
 * "DESPESA ADMINISTRATIVA" e "ADMINISTRATIVAS"; "FUNCIONARIOS" e
 * "FUNCIONÁRIOS/PESSOAL".
 *
 * O que NÃO está aqui, e por quê: "MANUTENCAO FROTA", "ABASTECIMENTO
 * FROTA", "MONITORAMENTO DE FROTA", "INFORMATICA TI" e "MARKETING" são
 * centros de custo operacionais que **podem** pertencer a ADMINISTRATIVAS
 * na estrutura do escritório contábil — mas afirmar isso é uma decisão
 * contábil, não uma tradução de palavras. Ficam em branco, sinalizados na
 * prévia, até a contabilidade confirmar.
 *
 * Para acrescentar depois: uma linha aqui, com a chave já normalizada.
 */
const GRUPO_POR_CENTRO_CUSTO: Record<string, string> = {
  "despesa administrativa": "ADMINISTRATIVAS",
  "despesas administrativas": "ADMINISTRATIVAS",
  administrativa: "ADMINISTRATIVAS",
  funcionarios: "FUNCIONÁRIOS/PESSOAL",
  pessoal: "FUNCIONÁRIOS/PESSOAL",
  "funcionarios pessoal": "FUNCIONÁRIOS/PESSOAL",
};

/**
 * Sinônimos de Categoria → Classificação.
 *
 * **Começa vazia de propósito.** Conferido contra o arquivo real: das 26
 * categorias distintas, só 2 têm nome igual a uma classificação do ASA
 * ("MULTA DE TRANSITO" e "INTERNET") e essas o casamento por nome já
 * resolve sozinho. Todo o resto exige uma decisão contábil que não cabe
 * ao sistema tomar — alguns são até ambíguos entre duas classificações
 * existentes (uma categoria "IMPOSTO/ISS" pode ser "ISS Próprio" ou "ISS
 * Substituição Tributária"; "IMPOSTO/PISCOFINS" junta dois tributos que
 * no ASA são separados).
 *
 * Preencher esta tabela é trabalho de quem entende a contabilidade da
 * empresa. O relatório da missão lista as categorias sem correspondência
 * para essa decisão ser tomada de uma vez.
 */
const CLASSIFICACAO_POR_CATEGORIA: Record<string, string> = {};

/** Um item do catálogo de classificações, como vem do banco. */
export interface ClassificacaoConhecida {
  id: string;
  grupo: string;
  nome: string;
}

/** Um banco cadastrado no ASA. */
export interface BancoConhecido {
  id: string;
  nome: string;
}

/** Catálogos do ASA usados para resolver os campos contábeis. */
export interface Catalogos {
  classificacoes: ClassificacaoConhecida[];
  bancos: BancoConhecido[];
}

export const CATALOGOS_VAZIOS: Catalogos = { classificacoes: [], bancos: [] };

/**
 * Acha a Classificação do ASA correspondente a uma Categoria da origem.
 *
 * Só devolve resultado quando o nome bate (normalizado) ou quando existe
 * sinônimo declarado. Devolve o item inteiro — o **grupo vem junto, e é
 * o grupo verdadeiro daquela classificação**, o que torna desnecessário
 * adivinhar o grupo quando a categoria é reconhecida.
 */
export function acharClassificacao(
  categoria: string | null,
  catalogo: ClassificacaoConhecida[]
): ClassificacaoConhecida | null {
  if (!categoria) return null;
  const chave = normalizarCabecalho(categoria);
  if (!chave) return null;

  const alvo = CLASSIFICACAO_POR_CATEGORIA[chave] ?? null;
  for (const c of catalogo) {
    if (alvo && c.nome === alvo) return c;
    if (!alvo && normalizarCabecalho(c.nome) === chave) return c;
  }
  return null;
}

/**
 * Acha o Grupo do ASA correspondente a um Centro de custo da origem.
 *
 * Usado só quando a Categoria não resolveu a classificação — quando
 * resolve, o grupo correto vem dela e este caminho nem é consultado.
 */
export function acharGrupo(centroCusto: string | null, catalogo: ClassificacaoConhecida[]): string | null {
  if (!centroCusto) return null;
  const chave = normalizarCabecalho(centroCusto);
  if (!chave) return null;

  const grupos = [...new Set(catalogo.map((c) => c.grupo))];
  const sinonimo = GRUPO_POR_CENTRO_CUSTO[chave];
  if (sinonimo) return grupos.find((g) => g === sinonimo) ?? null;
  return grupos.find((g) => normalizarCabecalho(g) === chave) ?? null;
}

/* ===================================================================
 * CONTA BANCÁRIA DA ORIGEM → BANCO DO ASA
 * =================================================================== */

/**
 * A coluna "Conta Bancaria" da origem às vezes traz a conta de fato e às
 * vezes traz só o meio de pagamento ("PIX"). Os dois casos são tratados
 * de forma diferente — ver `resolverContaBancaria`.
 */
const BANCO_POR_CONTA_ORIGEM: Record<string, string> = {
  // A razão social da empresa é "Aguanambi Freios Ltda" (ver CLAUDE.md),
  // e o cadastro de bancos do ASA tem DUAS contas na Caixa: "Banco 1 -
  // CEF" e "Banco 5 - CEF - Asa Serviços". A segunda é de outra pessoa
  // jurídica do grupo ("Asa Serviços", que também aparece como filial),
  // então a conta da Aguanambi Freios é a primeira.
  //
  // É o único caso em que o nome da conta na origem identifica sem
  // ambiguidade uma conta do cadastro. Qualquer outro texto cai no
  // casamento por nome ou fica em branco.
  "cef aguanambi freios ltda": "Banco 1 - CEF",
};

/**
 * Valores que, na coluna de conta bancária, descrevem apenas COMO se
 * pagou — não em qual conta. Regra confirmada: preenchem a forma de
 * pagamento e deixam o banco em branco, porque a conta de origem do PIX
 * só é conhecida pelo comprovante.
 */
const MEIO_DE_PAGAMENTO_NA_CONTA: Record<string, string> = {
  pix: "PIX",
};

export interface ContaBancariaResolvida {
  /** Banco do ASA, quando identificado com segurança. `null` = completar à mão. */
  bancoId: string | null;
  bancoNome: string | null;
  /** Forma de pagamento deduzida da própria coluna de conta (caso do PIX). */
  formaPagamento: string | null;
}

/**
 * Traduz a conta bancária da origem.
 *
 * Três desfechos possíveis:
 * - **"PIX"** → não é conta, é meio de pagamento: devolve a forma de
 *   pagamento e deixa o banco em branco, de propósito.
 * - **nome que identifica uma conta do cadastro** → devolve o banco.
 * - **qualquer outra coisa** → tudo em branco, para ser completado. Nada
 *   é chutado; o texto original fica guardado em `origem_dados`.
 */
export function resolverContaBancaria(
  contaBancaria: string | null,
  bancos: BancoConhecido[]
): ContaBancariaResolvida {
  const vazio: ContaBancariaResolvida = { bancoId: null, bancoNome: null, formaPagamento: null };
  if (!contaBancaria) return vazio;

  const chave = normalizarCabecalho(contaBancaria);
  if (!chave) return vazio;

  const meio = MEIO_DE_PAGAMENTO_NA_CONTA[chave];
  if (meio) return { bancoId: null, bancoNome: null, formaPagamento: meio };

  const alvo = BANCO_POR_CONTA_ORIGEM[chave];
  const achado = alvo
    ? bancos.find((b) => b.nome === alvo)
    : bancos.find((b) => normalizarCabecalho(b.nome) === chave);

  if (!achado) return vazio;
  return { bancoId: achado.id, bancoNome: achado.nome, formaPagamento: null };
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
  "total_parcelas",
  // Preenchida na CRIAÇÃO, quando a Categoria da origem corresponde com
  // segurança a uma classificação existente. Nunca sobrescrita depois —
  // ver a nota em COLUNAS_DO_ASA.
  "classificacao_id",
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
  // `classificacao_id` NÃO está nesta lista porque a importação pode
  // preenchê-la ao CRIAR a conta (quando a Categoria corresponde a uma
  // classificação existente). Mas ela é, a partir daí, do usuário: uma
  // reimportação nunca a regrava — hoje porque lançamento existente é
  // simplesmente pulado, e no futuro porque qualquer caminho de
  // atualização deve tratá-la como intocável.
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
