/**
 * Leitura e conferência de uma planilha de despesas, antes de qualquer
 * gravação.
 *
 * Este módulo é PURO: recebe as células já lidas e devolve o que seria
 * feito. Não conhece Supabase, não escreve nada, não depende de sessão —
 * é por isso que dá para testá-lo de ponta a ponta sem banco.
 *
 * A decisão de duplicidade (que precisa consultar o que já existe) entra
 * por parâmetro, em `classificar`, e não por consulta feita aqui dentro.
 */

import { paraNumero } from "../financeiro/formato";
import { CELULA_VAZIA, serialParaIso, type AbaLida, type CelulaLida } from "./xlsx-leitor";
import {
  CAMPOS_OBRIGATORIOS,
  DEFINICAO_POR_CAMPO,
  reconhecerColuna,
  type CampoAsa,
} from "./mapeamento";
import type {
  ColunaReconhecida,
  DadosOrigem,
  LinhaAnalisada,
  ResultadoAnalise,
  SituacaoLinha,
} from "./tipos";

/* ======================= leitura de cada tipo ======================= */

function lerTexto(celula: CelulaLida | undefined): string | null {
  if (!celula) return null;
  if (celula.tipo === "numero") {
    // Número usado como texto (nº de documento, parcela): sem casa
    // decimal artificial — 4587 não pode virar "4587.0".
    return Number.isInteger(celula.valor) ? String(celula.valor) : String(celula.valor);
  }
  if (celula.tipo === "data") return celula.valor;
  const t = celula.valor.trim();
  return t === "" ? null : t;
}

/**
 * Lê um valor em dinheiro.
 *
 * A distinção de tipo importa muito aqui. Uma célula NUMÉRICA já é o
 * número — usá-la direto é o único jeito correto. Só a célula de TEXTO
 * passa pelo leitor em português (`paraNumero`), que sabe que "1.500" é
 * mil e quinhentos. Mandar uma célula numérica de valor 1234.567 para o
 * leitor de texto devolveria 1.234.567 — o erro que a correção anterior
 * do projeto justamente eliminou.
 */
export function lerNumero(celula: CelulaLida | undefined): number | null {
  if (!celula) return null;
  if (celula.tipo === "numero") return celula.valor;
  if (celula.tipo === "data") return null;
  const t = celula.valor.trim();
  if (t === "") return null;
  // Contabilidade costuma escrever negativo entre parênteses.
  const negativo = /^\(.*\)$/.test(t);
  const n = paraNumero(negativo ? t.slice(1, -1) : t);
  if (n === 0 && !/\d/.test(t)) return null;
  return negativo ? -n : n;
}

const MESES_PT: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};

function dataValida(ano: number, mes: number, dia: number): boolean {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  if (ano < 1900 || ano > 2999) return false;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

const iso = (a: number, m: number, d: number) =>
  `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * Lê uma data.
 *
 * `undefined` = campo vazio (legítimo — nem toda linha tem liquidação).
 * `null` = veio alguma coisa que NÃO deu para entender com segurança; a
 * linha vira problema e é mostrada ao usuário, nunca importada em
 * silêncio (§12).
 *
 * Formatos aceitos: data nativa do Excel, ISO (2026-08-20), dd/mm/aaaa e
 * suas variações com "-" ou ".", mm/aaaa (competência) e "ago/2026".
 *
 * **Ambiguidade dd/mm × mm/dd:** quando os dois números são ≤ 12 não
 * existe como saber pelo dado. Fica assumido dd/mm — a ordem usada no
 * Brasil, e a origem é um sistema brasileiro. Este é o único palpite do
 * importador, e está aqui declarado: **precisa ser conferido contra o
 * arquivo real da AutEM**, porque errá-lo troca dia por mês em silêncio.
 */
export function lerData(celula: CelulaLida | undefined): string | null | undefined {
  if (!celula) return undefined;
  if (celula.tipo === "data") return celula.valor;

  if (celula.tipo === "numero") {
    // Número num campo de data é quase sempre serial do Excel numa
    // célula que perdeu a formatação.
    return serialParaIso(celula.valor) ?? null;
  }

  const t = celula.valor.trim();
  if (t === "") return undefined;

  const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(t);
  if (mIso) {
    const [, a, m, d] = mIso.map(Number);
    return dataValida(a, m, d) ? iso(a, m, d) : null;
  }

  const mCompleta = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t);
  if (mCompleta) {
    const dia = Number(mCompleta[1]);
    const mes = Number(mCompleta[2]);
    let ano = Number(mCompleta[3]);
    if (ano < 100) ano += ano < 70 ? 2000 : 1900;
    if (dataValida(ano, mes, dia)) return iso(ano, mes, dia);
    // dd/mm não fechou; se invertido fecha, o arquivo está em mm/dd e
    // isso é ambíguo demais para adivinhar sozinho.
    return null;
  }

  // Competência costuma vir só como mês/ano — vira o dia 1º.
  const mMesAno = /^(\d{1,2})[/.-](\d{4})$/.exec(t);
  if (mMesAno) {
    const mes = Number(mMesAno[1]);
    const ano = Number(mMesAno[2]);
    return dataValida(ano, mes, 1) ? iso(ano, mes, 1) : null;
  }

  const mMesTexto = /^([a-zç]{3,})[/.\- ](\d{2,4})$/i.exec(t.normalize("NFD").replace(/[̀-ͯ]/g, ""));
  if (mMesTexto) {
    const mes = MESES_PT[mMesTexto[1].slice(0, 3).toLowerCase()];
    let ano = Number(mMesTexto[2]);
    if (ano < 100) ano += 2000;
    if (mes && dataValida(ano, Number(mes), 1)) return iso(ano, Number(mes), 1);
    return null;
  }

  return null;
}

/* ===================== descoberta do cabeçalho ===================== */

/** Só dígitos — CNPJ/CPF entram e saem sempre no mesmo formato. */
export function apenasDigitos(texto: string | null): string | null {
  if (!texto) return null;
  const d = texto.replace(/\D/g, "");
  return d === "" ? null : d;
}

interface CabecalhoEncontrado {
  aba: AbaLida;
  indiceLinha: number;
  colunas: ColunaReconhecida[];
  reconhecidas: number;
}

/**
 * Acha a linha de cabeçalho.
 *
 * Não assume que é a linha 1 nem que existe uma aba só: varre as
 * primeiras linhas de cada aba e fica com a que reconhecer mais colunas.
 * É o que permite lidar com planilhas que começam com título, logo ou
 * linhas em branco — comum em exportação de sistema, e não sabemos como
 * a da AutEM virá.
 */
function acharCabecalho(abas: AbaLida[]): CabecalhoEncontrado | null {
  let melhor: CabecalhoEncontrado | null = null;

  for (const aba of abas) {
    const limite = Math.min(aba.linhas.length, 15);
    for (let i = 0; i < limite; i++) {
      const linha = aba.linhas[i] ?? [];
      const colunas: ColunaReconhecida[] = linha.map((celula) => {
        const cabecalho = celula.tipo === "texto" ? celula.valor.trim() : "";
        return { cabecalho, campo: cabecalho ? reconhecerColuna(cabecalho) : null };
      });
      const reconhecidas = colunas.filter((c) => c.campo !== null).length;

      // Duas colunas reconhecidas é o mínimo para não confundir uma
      // linha qualquer de dados com um cabeçalho.
      if (reconhecidas >= 2 && (!melhor || reconhecidas > melhor.reconhecidas)) {
        melhor = { aba, indiceLinha: i, colunas, reconhecidas };
      }
    }
  }

  return melhor;
}

/* ========================= chave de apoio ========================= */

/**
 * Chave de reconciliação — APOIO para suspeitar de duplicidade, nunca
 * prova de identidade (§7). Por isso ela não bloqueia nada sozinha:
 * quando é ela quem bate, a linha vira "possível duplicidade" e quem
 * decide é a pessoa.
 */
export function montarChave(dados: DadosOrigem): string | null {
  const cnpj = apenasDigitos(dados.cnpj);
  const doc = dados.numeroDocumento?.trim().toUpperCase();
  const fornecedor = dados.fornecedor?.trim().toLowerCase();
  const valor = dados.valor != null ? dados.valor.toFixed(2) : null;

  // Inclui parcela E vencimento. A parcela entra quando a exportação a
  // fornecer; o vencimento entra sempre, e é ele que separa uma parcela
  // da outra quando não há coluna de parcela — sem isto, a mesma nota
  // parcelada em duas vezes teria uma chave só, e a segunda parcela
  // seria lida como repetição da primeira.
  if (cnpj && doc && dados.vencimento) {
    return `d:${cnpj}|${doc}|${(dados.parcela ?? "").trim()}|${dados.vencimento}`;
  }
  if (fornecedor && valor && dados.vencimento) return `f:${fornecedor}|${valor}|${dados.vencimento}`;
  return null;
}

/* ============================ análise ============================ */

/** O que já existe na Plataforma ASA, para comparar. Montado por quem consulta o banco. */
export interface ExistentesConhecidos {
  /** Identificadores da origem já importados — identidade forte. */
  refs: Set<string>;
  /** `origem_chave` de contas já importadas — identidade forte, ver `montarChave`. */
  chaves: Set<string>;
  /** Chaves `cnpj|documento|vencimento` já existentes — identidade forte. */
  documentos: Set<string>;
  /** Chaves fracas `fornecedor|valor|vencimento` — só levantam suspeita. */
  fracas: Set<string>;
}

export const SEM_EXISTENTES: ExistentesConhecidos = {
  refs: new Set(),
  chaves: new Set(),
  documentos: new Set(),
  fracas: new Set(),
};

/**
 * Chave forte por documento fiscal, calculável IGUAL dos dois lados —
 * a partir de uma linha da planilha e a partir de uma conta do banco.
 *
 * Usa o vencimento, e não o número da parcela, como o que distingue uma
 * parcela da outra. Dois motivos, nesta ordem:
 *
 * 1. **É o único que existe dos dois lados.** A conta no banco guarda a
 *    data de vencimento; não guarda "esta é a parcela 2 da nota 4591 da
 *    exportação". Comparar por parcela exigiria um dado que só um dos
 *    lados tem — e comparação torta é pior que comparação simples.
 * 2. **Duas parcelas da mesma nota sempre vencem em datas diferentes** —
 *    é o que faz delas parcelas. Sem isto, a nota 4591 parcelada em duas
 *    vezes seria lida como a mesma conta repetida, e a segunda parcela
 *    nunca entraria.
 *
 * O número da parcela, quando a exportação trouxer, continua sendo
 * aproveitado: entra em `montarChave` (gravada em `origem_chave`) e no
 * registro da linha original.
 */
export function chaveDocumento(
  cnpj: string | null,
  documento: string | null,
  vencimento: string | null
): string | null {
  const c = apenasDigitos(cnpj);
  const d = documento?.trim().toUpperCase();
  if (!c || !d || !vencimento) return null;
  return `${c}|${d}|${vencimento}`;
}

/** Chave fraca. Nunca decide sozinha — só levanta "verificar". */
export function chaveFraca(fornecedor: string | null, valor: number | null, vencimento: string | null): string | null {
  const f = fornecedor?.trim().toLowerCase();
  if (!f || valor == null || !vencimento) return null;
  return `${f}|${valor.toFixed(2)}|${vencimento}`;
}

/**
 * Lê a planilha inteira e diz o que aconteceria com cada linha.
 *
 * Nada é gravado aqui. `existentes` é o retrato do que já há na
 * Plataforma ASA, montado por quem chamou com UMA consulta — nunca uma
 * consulta por linha.
 */
export function analisar(
  abas: AbaLida[],
  nomeArquivo: string,
  existentes: ExistentesConhecidos = SEM_EXISTENTES
): ResultadoAnalise | { ok: false; erro: string } {
  const cabecalho = acharCabecalho(abas);

  if (!cabecalho) {
    return {
      ok: false,
      erro:
        "Não foi possível reconhecer as colunas desta planilha. Confira se é o arquivo de despesas exportado e se a primeira linha traz os nomes das colunas.",
    };
  }

  const { aba, indiceLinha, colunas } = cabecalho;

  const posicaoPorCampo = new Map<CampoAsa, number>();
  colunas.forEach((c, i) => {
    if (c.campo && !posicaoPorCampo.has(c.campo)) posicaoPorCampo.set(c.campo, i);
  });

  const camposAusentes = CAMPOS_OBRIGATORIOS.filter((c) => !posicaoPorCampo.has(c));
  const colunasSemCorrespondencia = colunas
    .filter((c) => c.cabecalho !== "" && c.campo === null)
    .map((c) => c.cabecalho);

  if (camposAusentes.length > 0) {
    const nomes = camposAusentes.map((c) => DEFINICAO_POR_CAMPO.get(c)?.rotulo ?? c).join(" e ");
    return {
      ok: false,
      erro: `A planilha não tem a coluna de ${nomes}. Sem isso não é possível criar as contas — confira se exportou o arquivo completo.`,
    };
  }

  const pegar = (linha: CelulaLida[], campo: CampoAsa): CelulaLida | undefined => {
    const p = posicaoPorCampo.get(campo);
    return p === undefined ? undefined : (linha[p] ?? CELULA_VAZIA);
  };

  const linhasAnalisadas: LinhaAnalisada[] = [];
  // Duplicidade DENTRO do próprio arquivo também conta: a mesma nota
  // repetida duas vezes na planilha não pode entrar duas vezes.
  const vistasNoArquivo = new Set<string>();

  for (let i = indiceLinha + 1; i < aba.linhas.length; i++) {
    const linha = aba.linhas[i] ?? [];
    // Linha totalmente vazia: rodapé, separador, sobra de formatação.
    if (linha.every((c) => !c || (c.tipo === "texto" && c.valor.trim() === ""))) continue;

    const problemas: string[] = [];
    const avisos: string[] = [];

    const lerDataCampo = (campo: CampoAsa, rotulo: string): string | null => {
      const r = lerData(pegar(linha, campo));
      if (r === null) {
        problemas.push(`${rotulo}: não foi possível entender a data informada.`);
        return null;
      }
      return r ?? null;
    };

    const dados: DadosOrigem = {
      idExterno: lerTexto(pegar(linha, "idExterno")),
      vencimento: lerDataCampo("vencimento", "Vencimento"),
      liquidacao: lerDataCampo("liquidacao", "Liquidação"),
      dataLancamento: lerDataCampo("dataLancamento", "Data de lançamento"),
      competencia: lerDataCampo("competencia", "Competência"),
      tipo: lerTexto(pegar(linha, "tipo")),
      cnpj: lerTexto(pegar(linha, "cnpj")),
      numeroDocumento: lerTexto(pegar(linha, "numeroDocumento")),
      formaPagamento: lerTexto(pegar(linha, "formaPagamento")),
      fornecedor: lerTexto(pegar(linha, "fornecedor")),
      contaBancaria: lerTexto(pegar(linha, "contaBancaria")),
      descricao: lerTexto(pegar(linha, "descricao")),
      centroCusto: lerTexto(pegar(linha, "centroCusto")),
      categoria: lerTexto(pegar(linha, "categoria")),
      observacao: lerTexto(pegar(linha, "observacao")),
      recorrencia: lerTexto(pegar(linha, "recorrencia")),
      valor: lerNumero(pegar(linha, "valor")),
      valorPago: lerNumero(pegar(linha, "valorPago")),
      parcela: lerTexto(pegar(linha, "parcela")),
      extras: {},
    };

    // Colunas sem correspondência ficam guardadas junto da conta (§10):
    // não viram classificação inventada, mas também não se perdem.
    colunas.forEach((c, indice) => {
      if (c.campo !== null || c.cabecalho === "") return;
      const texto = lerTexto(linha[indice]);
      if (texto) dados.extras[c.cabecalho] = texto;
    });

    if (dados.valor == null) problemas.push("Valor: não informado ou não reconhecido como número.");
    else if (dados.valor <= 0) problemas.push("Valor: precisa ser maior que zero.");
    if (!dados.vencimento) problemas.push("Vencimento: não informado.");

    // Descrição é obrigatória na conta; sem ela, o nome do fornecedor é
    // o que a pessoa reconheceria na lista. Nada é inventado.
    if (!dados.descricao && dados.fornecedor) {
      dados.descricao = dados.fornecedor;
      avisos.push("Sem descrição na planilha — foi usado o nome do fornecedor.");
    }
    if (!dados.descricao) problemas.push("Descrição: não informada e sem fornecedor para usar no lugar.");

    // Campos que a origem trouxe e o ASA não tem para onde mandar
    // automaticamente. Avisa, não inventa (§10).
    for (const [campo, rotulo] of [
      ["categoria", "Categoria"],
      ["centroCusto", "Centro de custo"],
      ["tipo", "Tipo"],
    ] as const) {
      const valor = dados[campo];
      if (valor) avisos.push(`${rotulo} "${valor}": sem correspondência no ASA — classifique depois, se quiser.`);
    }

    const chaveDoc = chaveDocumento(dados.cnpj, dados.numeroDocumento, dados.vencimento);
    const chaveF = chaveFraca(dados.fornecedor, dados.valor, dados.vencimento);
    const chaveCompleta = montarChave(dados);

    let situacao: SituacaoLinha;
    let motivo: string;

    if (problemas.length > 0) {
      situacao = "erro";
      motivo = "Não pode ser importada";
    } else if (dados.idExterno && existentes.refs.has(dados.idExterno)) {
      situacao = "existente";
      motivo = "Já importada antes (mesmo identificador de origem)";
    } else if (chaveCompleta && existentes.chaves.has(chaveCompleta)) {
      situacao = "existente";
      motivo = "Já importada antes (mesma linha desta planilha)";
    } else if (chaveDoc && existentes.documentos.has(chaveDoc)) {
      situacao = "existente";
      motivo = "Já cadastrada (mesmo CNPJ, documento e vencimento)";
    } else if (dados.idExterno && vistasNoArquivo.has(`r:${dados.idExterno}`)) {
      situacao = "existente";
      motivo = "Repetida dentro do próprio arquivo";
    } else if (chaveDoc && vistasNoArquivo.has(`d:${chaveDoc}`)) {
      situacao = "existente";
      motivo = "Repetida dentro do próprio arquivo";
    } else if (chaveF && (existentes.fracas.has(chaveF) || vistasNoArquivo.has(`f:${chaveF}`))) {
      // Coincidência fraca NUNCA bloqueia sozinha — só levanta a mão.
      situacao = "duplicado_possivel";
      motivo = "Possível duplicidade — verificar";
    } else {
      situacao = "novo";
      motivo = "Será importada";
    }

    if (dados.idExterno) vistasNoArquivo.add(`r:${dados.idExterno}`);
    if (chaveDoc) vistasNoArquivo.add(`d:${chaveDoc}`);
    if (chaveF) vistasNoArquivo.add(`f:${chaveF}`);

    linhasAnalisadas.push({
      numeroLinha: i + 1,
      situacao,
      problemas,
      avisos,
      motivo,
      dados,
      chave: chaveCompleta,
    });
  }

  const conta = (s: SituacaoLinha) => linhasAnalisadas.filter((l) => l.situacao === s).length;

  return {
    ok: true,
    arquivo: nomeArquivo,
    aba: aba.nome,
    colunas,
    colunasSemCorrespondencia,
    camposAusentes: [],
    linhas: linhasAnalisadas,
    resumo: {
      total: linhasAnalisadas.length,
      novos: conta("novo"),
      existentes: conta("existente"),
      duplicadosPossiveis: conta("duplicado_possivel"),
      comProblema: conta("erro"),
    },
  };
}
