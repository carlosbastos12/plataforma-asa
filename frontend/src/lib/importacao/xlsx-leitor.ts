/**
 * Leitor de XLSX — contraparte de `lib/exportar/xlsx.ts`, que escreve.
 *
 * Por que sem biblioteca, pelo mesmo motivo já registrado no gerador: o
 * pacote `xlsx` do npm está parado numa versão com vulnerabilidades
 * conhecidas e o `exceljs` é grande demais para o que aqui é "abrir um
 * arquivo e devolver as células". Um .xlsx é um ZIP com XML dentro; o
 * Node já traz o `inflate` de que precisamos.
 *
 * **Roda só no servidor.** É chamado a partir de Server Action — nada
 * disto vai para o navegador, e o arquivo do usuário nunca precisa ser
 * processado no cliente.
 *
 * O leitor não sabe nada sobre AutEM, nem sobre finanças: devolve abas e
 * células cruas, com o tipo que a planilha declarou. Quem interpreta
 * significado é `analise.ts`, e quem sabe nomes de coluna é
 * `mapeamento.ts` — a separação existe justamente para que o layout real
 * da AutEM, quando chegar, mexa em um arquivo só.
 */

import { inflateRawSync } from "node:zlib";

/**
 * Uma célula com o tipo que a planilha declarou.
 *
 * A distinção entre `numero` e `texto` é o que impede o erro clássico:
 * uma célula numérica 1234.567 já É mil duzentos e trinta e quatro
 * vírgula quinhentos e sessenta e sete, e não pode passar pelo leitor de
 * texto em português (que trataria o ponto como separador de milhar e
 * devolveria 1.234.567). Ver `lerNumero` em `analise.ts`.
 */
export type CelulaLida =
  | { tipo: "texto"; valor: string }
  | { tipo: "numero"; valor: number }
  /** Célula numérica com formato de data — já convertida para ISO (YYYY-MM-DD). */
  | { tipo: "data"; valor: string };

export interface AbaLida {
  nome: string;
  /** Matriz de células, linha a linha. Linhas e colunas vazias são preenchidas com texto "". */
  linhas: CelulaLida[][];
}

export const CELULA_VAZIA: CelulaLida = { tipo: "texto", valor: "" };

/* ============================== ZIP ============================== */

interface ArquivoZip {
  nome: string;
  metodo: number;
  offsetLocal: number;
  tamanhoComprimido: number;
}

function ler16(b: Uint8Array, p: number): number {
  return b[p] | (b[p + 1] << 8);
}
function ler32(b: Uint8Array, p: number): number {
  return (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
}

/**
 * Lê o diretório central do ZIP. É a fonte autoritativa do que existe no
 * arquivo — varrer cabeçalhos locais em sequência falha em arquivos com
 * "data descriptor", que o Excel usa.
 */
function lerDiretorioZip(bytes: Uint8Array): Map<string, ArquivoZip> {
  // O fim do diretório central (EOCD) fica no final, depois de um
  // comentário de tamanho variável — daí a varredura de trás para frente.
  const limite = Math.max(0, bytes.length - 66_000);
  let fim = -1;
  for (let p = bytes.length - 22; p >= limite; p--) {
    if (ler32(bytes, p) === 0x06054b50) {
      fim = p;
      break;
    }
  }
  if (fim < 0) throw new Error("ARQUIVO_INVALIDO");

  const total = ler16(bytes, fim + 10);
  let p = ler32(bytes, fim + 16);

  const mapa = new Map<string, ArquivoZip>();
  const decodificador = new TextDecoder("utf-8");

  for (let i = 0; i < total; i++) {
    if (ler32(bytes, p) !== 0x02014b50) break;
    const metodo = ler16(bytes, p + 10);
    const tamanhoComprimido = ler32(bytes, p + 20);
    const tamanhoNome = ler16(bytes, p + 28);
    const tamanhoExtra = ler16(bytes, p + 30);
    const tamanhoComentario = ler16(bytes, p + 32);
    const offsetLocal = ler32(bytes, p + 42);
    const nome = decodificador.decode(bytes.subarray(p + 46, p + 46 + tamanhoNome));

    mapa.set(nome, { nome, metodo, offsetLocal, tamanhoComprimido });
    p += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  return mapa;
}

function extrair(bytes: Uint8Array, entrada: ArquivoZip): string {
  const p = entrada.offsetLocal;
  if (ler32(bytes, p) !== 0x04034b50) throw new Error("ARQUIVO_INVALIDO");

  const tamanhoNome = ler16(bytes, p + 26);
  const tamanhoExtra = ler16(bytes, p + 28);
  const inicio = p + 30 + tamanhoNome + tamanhoExtra;

  // O tamanho no cabeçalho local pode vir zerado quando há data
  // descriptor; o do diretório central é o confiável.
  const conteudo = bytes.subarray(inicio, inicio + entrada.tamanhoComprimido);

  // 0 = armazenado (é o que o nosso próprio gerador produz), 8 = deflate
  // (é o que o Excel produz). Os dois são aceitos.
  const cru = entrada.metodo === 0 ? conteudo : inflateRawSync(conteudo);
  return new TextDecoder("utf-8").decode(cru);
}

/* ============================== XML ============================== */

function desescapar(texto: string): string {
  if (!texto.includes("&")) return texto;
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

/** Junta o texto de todos os `<t>` de um trecho (uma string pode vir quebrada em vários `<r>`). */
function textoDeT(trecho: string): string {
  let saida = "";
  const re = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trecho)) !== null) saida += desescapar(m[1]);
  return saida;
}

function lerSharedStrings(xml: string): string[] {
  const itens: string[] = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) itens.push(m[1] === undefined ? "" : textoDeT(m[1]));
  return itens;
}

/* ------------------------- formatos de data ------------------------- */

// Formatos de data embutidos do Excel. Um número só é data porque o
// ESTILO da célula diz que é — o valor em si é sempre um número.
const FORMATOS_DATA_EMBUTIDOS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);

/**
 * Devolve, para cada índice de estilo (`s` da célula), se aquele estilo é
 * de data. Cobre tanto os formatos embutidos quanto os personalizados
 * (reconhecidos pelo código de formato conter dia/mês/ano).
 */
function lerEstilosDeData(xml: string | null): boolean[] {
  if (!xml) return [];

  const personalizados = new Set<number>();
  const reFmt = /<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = reFmt.exec(xml)) !== null) {
    // Ignora o que estiver entre aspas (texto literal do formato) antes
    // de procurar por marcadores de data.
    const codigo = desescapar(m[2]).replace(/"[^"]*"/g, "").toLowerCase();
    if (/[dmy]/.test(codigo) && !/^[^dmy]*$/.test(codigo)) personalizados.add(Number(m[1]));
  }

  const blocoCellXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
  if (!blocoCellXfs) return [];

  const resultado: boolean[] = [];
  const reXf = /<xf\b[^>]*?numFmtId="(\d+)"[^>]*?\/?>/g;
  while ((m = reXf.exec(blocoCellXfs[1])) !== null) {
    const id = Number(m[1]);
    resultado.push(FORMATOS_DATA_EMBUTIDOS.has(id) || personalizados.has(id));
  }
  return resultado;
}

/** Serial do Excel (dias desde 30/12/1899) para ISO. Inverso de `serialData` do gerador. */
export function serialParaIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0 || serial > 2_958_465) return null;
  const ms = Math.round((serial - 25569) * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/* ---------------------------- células ---------------------------- */

/** "BC12" -> 54 (índice 0-based da coluna). */
function indiceColuna(ref: string): number {
  let n = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

function lerAba(xml: string, nome: string, textos: string[], estilosData: boolean[]): AbaLida {
  const linhas: CelulaLida[][] = [];

  const reLinha = /<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g;
  let mLinha: RegExpExecArray | null;

  while ((mLinha = reLinha.exec(xml)) !== null) {
    const conteudo = mLinha[1] ?? "";
    const celulas: CelulaLida[] = [];

    const reCelula = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let mCelula: RegExpExecArray | null;

    while ((mCelula = reCelula.exec(conteudo)) !== null) {
      const atributos = mCelula[1] ?? "";
      const corpo = mCelula[2] ?? "";

      const ref = /r="([A-Z]+)\d+"/.exec(atributos)?.[1];
      const destino = ref ? indiceColuna(ref) : celulas.length;
      while (celulas.length < destino) celulas.push(CELULA_VAZIA);

      const tipo = /t="([^"]+)"/.exec(atributos)?.[1] ?? "n";
      const estilo = Number(/s="(\d+)"/.exec(atributos)?.[1] ?? "-1");

      let celula: CelulaLida = CELULA_VAZIA;

      if (tipo === "s") {
        const indice = Number(/<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1] ?? "-1");
        celula = { tipo: "texto", valor: textos[indice] ?? "" };
      } else if (tipo === "inlineStr") {
        celula = { tipo: "texto", valor: textoDeT(corpo) };
      } else if (tipo === "str") {
        celula = { tipo: "texto", valor: desescapar(/<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1] ?? "") };
      } else if (tipo === "b") {
        celula = { tipo: "texto", valor: /<v>1<\/v>/.test(corpo) ? "VERDADEIRO" : "FALSO" };
      } else if (tipo === "e") {
        // Célula com erro de fórmula (#REF!, #N/D...): vira texto, e a
        // análise decide se aquilo era um campo obrigatório.
        celula = { tipo: "texto", valor: desescapar(/<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1] ?? "") };
      } else {
        const bruto = /<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1];
        if (bruto === undefined || bruto === "") {
          celula = CELULA_VAZIA;
        } else {
          const numero = Number(bruto);
          if (!Number.isFinite(numero)) {
            celula = { tipo: "texto", valor: desescapar(bruto) };
          } else if (estilosData[estilo]) {
            const iso = serialParaIso(numero);
            celula = iso ? { tipo: "data", valor: iso } : { tipo: "numero", valor: numero };
          } else {
            celula = { tipo: "numero", valor: numero };
          }
        }
      }

      celulas[destino] = celula;
    }

    const numeroLinha = Number(/<row\b[^>]*\br="(\d+)"/.exec(mLinha[0])?.[1] ?? "0");
    // Linhas puladas no XML (planilha esparsa) viram linhas vazias, para
    // o número da linha na tela bater com o do Excel.
    if (numeroLinha > 0) while (linhas.length < numeroLinha - 1) linhas.push([]);
    linhas.push(celulas);
  }

  return { nome, linhas };
}

/**
 * Abre um .xlsx e devolve TODAS as abas.
 *
 * Devolve todas de propósito: o requisito diz para não assumir quantas
 * abas o arquivo da AutEM terá, então quem escolhe é a análise — ela
 * procura a primeira aba com um cabeçalho reconhecível.
 *
 * Lança `Error("ARQUIVO_INVALIDO")` quando o arquivo não é um xlsx legível.
 */
export function lerXlsx(conteudo: ArrayBuffer | Uint8Array): AbaLida[] {
  const bytes = conteudo instanceof Uint8Array ? conteudo : new Uint8Array(conteudo);
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("ARQUIVO_INVALIDO");

  const zip = lerDiretorioZip(bytes);

  const pegar = (nome: string): string | null => {
    const entrada = zip.get(nome);
    return entrada ? extrair(bytes, entrada) : null;
  };

  const textos = lerSharedStrings(pegar("xl/sharedStrings.xml") ?? "");
  const estilosData = lerEstilosDeData(pegar("xl/styles.xml"));

  // Nome e ordem das abas vêm do workbook; o caminho de cada uma, das
  // relações. Sem isso, "sheet1.xml" nem sempre é a primeira aba.
  const relacoes = new Map<string, string>();
  const xmlRels = pegar("xl/_rels/workbook.xml.rels") ?? "";
  const reRel = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let mRel: RegExpExecArray | null;
  while ((mRel = reRel.exec(xmlRels)) !== null) {
    const alvo = mRel[2].replace(/^\/?xl\//, "").replace(/^\//, "");
    relacoes.set(mRel[1], `xl/${alvo}`);
  }

  const abas: AbaLida[] = [];
  const xmlWorkbook = pegar("xl/workbook.xml") ?? "";
  const reAba = /<sheet\b[^>]*\/>/g;
  let mAba: RegExpExecArray | null;
  let indice = 0;

  while ((mAba = reAba.exec(xmlWorkbook)) !== null) {
    indice++;
    const tag = mAba[0];
    const nome = desescapar(/name="([^"]*)"/.exec(tag)?.[1] ?? `Planilha${indice}`);
    const idRelacao = /r:id="([^"]+)"/.exec(tag)?.[1];
    const caminho = (idRelacao && relacoes.get(idRelacao)) || `xl/worksheets/sheet${indice}.xml`;
    const xml = pegar(caminho);
    if (xml) abas.push(lerAba(xml, nome, textos, estilosData));
  }

  // Arquivo sem workbook.xml legível: tenta as abas pelo caminho padrão.
  if (abas.length === 0) {
    for (let i = 1; i <= 20; i++) {
      const xml = pegar(`xl/worksheets/sheet${i}.xml`);
      if (!xml) break;
      abas.push(lerAba(xml, `Planilha${i}`, textos, estilosData));
    }
  }

  if (abas.length === 0) throw new Error("ARQUIVO_INVALIDO");
  return abas;
}
