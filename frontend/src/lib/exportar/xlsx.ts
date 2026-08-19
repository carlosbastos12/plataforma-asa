/**
 * Gerador de XLSX sem dependências.
 *
 * Por que não usar uma biblioteca: o pacote `xlsx` publicado no npm está
 * parado numa versão com vulnerabilidades conhecidas (prototype pollution
 * / ReDoS), e alternativas como `exceljs` pesam quase 1 MB no navegador
 * para o que aqui são poucas colunas. O formato é um ZIP com XML dentro —
 * escrever o mínimo necessário sai mais leve, mais seguro e auditável.
 *
 * O arquivo sai com números como número (para somar e montar dinâmica),
 * datas como data e moeda formatada — não texto — para o Excel conseguir
 * analisar depois, como pede o requisito.
 */

export type Celula =
  | string
  | number
  | null
  | { tipo: "data"; valor: string | null }
  | { tipo: "moeda"; valor: number };

export interface Planilha {
  nome: string;
  colunas: string[];
  linhas: Celula[][];
}

/* ------------------------- ZIP (armazenado) ------------------------- */

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface EntradaZip {
  nome: string;
  dados: Uint8Array;
  crc: number;
  offset: number;
}

function escrever16(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff);
}
function escrever32(arr: number[], v: number) {
  arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}

/** ZIP sem compressão (método "stored") — aceito pelo Excel e trivial de validar. */
function montarZip(arquivos: { nome: string; conteudo: string }[]): Blob {
  const codificador = new TextEncoder();
  const partes: Uint8Array[] = [];
  const entradas: EntradaZip[] = [];
  let offset = 0;

  for (const arquivo of arquivos) {
    const dados = codificador.encode(arquivo.conteudo);
    const nomeBytes = codificador.encode(arquivo.nome);
    const crc = crc32(dados);

    const cabecalho: number[] = [];
    escrever32(cabecalho, 0x04034b50);
    escrever16(cabecalho, 20); // versão necessária
    escrever16(cabecalho, 0x0800); // nomes em UTF-8
    escrever16(cabecalho, 0); // sem compressão
    escrever16(cabecalho, 0); // hora
    escrever16(cabecalho, 0x2821); // data (2020-01-01, fixa: build reproduzível)
    escrever32(cabecalho, crc);
    escrever32(cabecalho, dados.length);
    escrever32(cabecalho, dados.length);
    escrever16(cabecalho, nomeBytes.length);
    escrever16(cabecalho, 0);

    const bytesCabecalho = new Uint8Array(cabecalho);
    partes.push(bytesCabecalho, nomeBytes, dados);
    entradas.push({ nome: arquivo.nome, dados, crc, offset });
    offset += bytesCabecalho.length + nomeBytes.length + dados.length;
  }

  const inicioDiretorio = offset;
  for (const e of entradas) {
    const nomeBytes = codificador.encode(e.nome);
    const central: number[] = [];
    escrever32(central, 0x02014b50);
    escrever16(central, 20); // versão de origem
    escrever16(central, 20); // versão necessária
    escrever16(central, 0x0800);
    escrever16(central, 0);
    escrever16(central, 0);
    escrever16(central, 0x2821);
    escrever32(central, e.crc);
    escrever32(central, e.dados.length);
    escrever32(central, e.dados.length);
    escrever16(central, nomeBytes.length);
    escrever16(central, 0); // extra
    escrever16(central, 0); // comentário
    escrever16(central, 0); // disco
    escrever16(central, 0); // atributos internos
    escrever32(central, 0); // atributos externos
    escrever32(central, e.offset);

    const bytesCentral = new Uint8Array(central);
    partes.push(bytesCentral, nomeBytes);
    offset += bytesCentral.length + nomeBytes.length;
  }

  const fim: number[] = [];
  escrever32(fim, 0x06054b50);
  escrever16(fim, 0);
  escrever16(fim, 0);
  escrever16(fim, entradas.length);
  escrever16(fim, entradas.length);
  escrever32(fim, offset - inicioDiretorio);
  escrever32(fim, inicioDiretorio);
  escrever16(fim, 0);
  partes.push(new Uint8Array(fim));

  return new Blob(partes as BlobPart[], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/* --------------------------- XML da planilha --------------------------- */

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Caracteres de controle são inválidos em XML e quebrariam o arquivo.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function letraColuna(indice: number): string {
  let n = indice + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Serial de data do Excel: dias desde 30/12/1899. */
function serialData(iso: string): number | null {
  const partes = iso.slice(0, 10).split("-");
  if (partes.length !== 3) return null;
  const [a, m, d] = partes.map(Number);
  if (!a || !m || !d) return null;
  const utc = Date.UTC(a, m - 1, d);
  return Math.floor(utc / 86400000) + 25569;
}

function limparNomeAba(nome: string, indice: number): string {
  const limpo = nome.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31);
  return limpo || `Planilha${indice + 1}`;
}

function montarAba(planilha: Planilha): string {
  const linhas: string[] = [];

  const celulasCabecalho = planilha.colunas
    .map((c, i) => `<c r="${letraColuna(i)}1" s="1" t="inlineStr"><is><t>${escapar(c)}</t></is></c>`)
    .join("");
  linhas.push(`<row r="1">${celulasCabecalho}</row>`);

  planilha.linhas.forEach((linha, indiceLinha) => {
    const r = indiceLinha + 2;
    const celulas = linha
      .map((valor, i) => {
        const ref = `${letraColuna(i)}${r}`;
        if (valor === null || valor === undefined || valor === "") return "";

        if (typeof valor === "number") {
          return `<c r="${ref}"><v>${valor}</v></c>`;
        }
        if (typeof valor === "object") {
          if (valor.tipo === "moeda") {
            return `<c r="${ref}" s="3"><v>${valor.valor}</v></c>`;
          }
          const serial = valor.valor ? serialData(valor.valor) : null;
          if (serial === null) return "";
          return `<c r="${ref}" s="2"><v>${serial}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t>${escapar(String(valor))}</t></is></c>`;
      })
      .join("");
    linhas.push(`<row r="${r}">${celulas}</row>`);
  });

  const larguras = planilha.colunas
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(c.length + 6, 12), 46)}" customWidth="1"/>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${larguras}</cols><sheetData>${linhas.join(
    ""
  )}</sheetData></worksheet>`;
}

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Monta o arquivo .xlsx completo em memória. */
export function gerarXlsx(planilhas: Planilha[]): Blob {
  const abas = planilhas.map((p, i) => ({ ...p, nomeLimpo: limparNomeAba(p.nome, i) }));

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${abas
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join("")}
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas
    .map((a, i) => `<sheet name="${escapar(a.nomeLimpo)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("")}</sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
          i + 1
        }.xml"/>`
    )
    .join("")}<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

  const arquivos = [
    { nome: "[Content_Types].xml", conteudo: contentTypes },
    { nome: "_rels/.rels", conteudo: rels },
    { nome: "xl/workbook.xml", conteudo: workbook },
    { nome: "xl/_rels/workbook.xml.rels", conteudo: workbookRels },
    { nome: "xl/styles.xml", conteudo: ESTILOS },
    ...abas.map((a, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, conteudo: montarAba(a) })),
  ];

  return montarZip(arquivos);
}

/** Dispara o download no navegador. */
export function baixarXlsx(planilhas: Planilha[], nomeArquivo: string) {
  const blob = gerarXlsx(planilhas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.endsWith(".xlsx") ? nomeArquivo : `${nomeArquivo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
