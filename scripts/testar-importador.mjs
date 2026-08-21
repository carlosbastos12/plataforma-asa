/**
 * Testes do importador de despesas por planilha.
 *
 * Roda com o Node puro (`node scripts/testar-importador.mjs`), usando o
 * type stripping nativo do Node 24 — sem framework de teste e sem
 * dependência nova no projeto.
 *
 * Cobre a leitura do XLSX, o reconhecimento das colunas, a conversão de
 * valores e datas e a classificação de cada linha. Não toca no banco: a
 * análise é pura de propósito, e é isso que permite testá-la inteira.
 * O que depende de sessão autenticada (gravar de fato) está listado como
 * pendente no relatório da missão.
 */

import { deflateRawSync } from "node:zlib";
import { gerarBytes, planilhasHomologacao } from "./gerar-planilha-homologacao.mjs";
import { gerarXlsx } from "../frontend/src/lib/exportar/xlsx.ts";
import { lerXlsx } from "../frontend/src/lib/importacao/xlsx-leitor.ts";
import { analisar, lerNumero, lerData, chaveDocumento } from "../frontend/src/lib/importacao/analise.ts";
import { normalizarCabecalho, reconhecerColuna } from "../frontend/src/lib/importacao/mapeamento.ts";
import { paraNumero } from "../frontend/src/lib/financeiro/formato.ts";

let passou = 0;
let falhou = 0;
const falhas = [];

function ok(nome, condicao, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  ok    ${nome}`);
  } else {
    falhou++;
    falhas.push(nome);
    console.log(`  FALHA ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

function igual(nome, obtido, esperado) {
  const iguais = JSON.stringify(obtido) === JSON.stringify(esperado);
  ok(nome, iguais, iguais ? "" : `obtido ${JSON.stringify(obtido)}, esperado ${JSON.stringify(esperado)}`);
}

function secao(titulo) {
  console.log(`\n${titulo}`);
}

/** Recomprime o ZIP com deflate, para exercitar o caminho que o Excel real usa. */
function recomprimirComDeflate(bytes) {
  const ler16 = (p) => bytes[p] | (bytes[p + 1] << 8);
  const ler32 = (p) => (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0;

  let fim = -1;
  for (let p = bytes.length - 22; p >= 0; p--) if (ler32(p) === 0x06054b50) { fim = p; break; }
  const total = ler16(fim + 10);
  let p = ler32(fim + 16);

  const arquivos = [];
  for (let i = 0; i < total; i++) {
    const tamanhoNome = ler16(p + 28);
    const tamanhoExtra = ler16(p + 30);
    const tamanhoComentario = ler16(p + 32);
    const tamanhoComprimido = ler32(p + 20);
    const offsetLocal = ler32(p + 42);
    const nome = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + tamanhoNome));

    const nomeLocal = ler16(offsetLocal + 26);
    const extraLocal = ler16(offsetLocal + 28);
    const inicio = offsetLocal + 30 + nomeLocal + extraLocal;
    arquivos.push({ nome, dados: bytes.subarray(inicio, inicio + tamanhoComprimido) });
    p += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  // Remonta o ZIP com método 8 (deflate).
  const partes = [];
  const entradas = [];
  let offset = 0;
  const cod = new TextEncoder();
  const p16 = (a, v) => a.push(v & 0xff, (v >>> 8) & 0xff);
  const p32 = (a, v) => a.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);

  const tabela = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; }
    return t;
  })();
  const crc32 = (d) => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = tabela[(c ^ d[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  for (const arq of arquivos) {
    const comprimido = new Uint8Array(deflateRawSync(arq.dados));
    const crc = crc32(arq.dados);
    const nomeBytes = cod.encode(arq.nome);
    const cab = [];
    p32(cab, 0x04034b50); p16(cab, 20); p16(cab, 0x0800); p16(cab, 8); p16(cab, 0); p16(cab, 0x2821);
    p32(cab, crc); p32(cab, comprimido.length); p32(cab, arq.dados.length);
    p16(cab, nomeBytes.length); p16(cab, 0);
    const bc = new Uint8Array(cab);
    partes.push(bc, nomeBytes, comprimido);
    entradas.push({ nome: arq.nome, crc, comprimido: comprimido.length, original: arq.dados.length, offset });
    offset += bc.length + nomeBytes.length + comprimido.length;
  }

  const inicioDir = offset;
  for (const e of entradas) {
    const nomeBytes = cod.encode(e.nome);
    const c = [];
    p32(c, 0x02014b50); p16(c, 20); p16(c, 20); p16(c, 0x0800); p16(c, 8); p16(c, 0); p16(c, 0x2821);
    p32(c, e.crc); p32(c, e.comprimido); p32(c, e.original);
    p16(c, nomeBytes.length); p16(c, 0); p16(c, 0); p16(c, 0); p16(c, 0); p32(c, 0); p32(c, e.offset);
    const bc = new Uint8Array(c);
    partes.push(bc, nomeBytes);
    offset += bc.length + nomeBytes.length;
  }

  const f = [];
  p32(f, 0x06054b50); p16(f, 0); p16(f, 0); p16(f, entradas.length); p16(f, entradas.length);
  p32(f, offset - inicioDir); p32(f, inicioDir); p16(f, 0);
  partes.push(new Uint8Array(f));

  const tamanho = partes.reduce((a, b) => a + b.length, 0);
  const saida = new Uint8Array(tamanho);
  let i = 0;
  for (const parte of partes) { saida.set(parte, i); i += parte.length; }
  return saida;
}

/* =================================================================== */

console.log("TESTES DO IMPORTADOR DE PLANILHA\n" + "=".repeat(60));

const bytes = await gerarBytes();

/* --- 1. arquivo válido ---------------------------------------------- */
secao("1. Arquivo válido");
const abas = lerXlsx(bytes);
ok("abre o arquivo e encontra as abas", abas.length === 2, `abas=${abas.length}`);
ok("acha a aba de despesas", abas.some((a) => a.nome === "Despesas"));

const analise = analisar(abas, "homologacao.xlsx");
ok("análise conclui com sucesso", analise.ok === true, analise.ok ? "" : analise.erro);
igual("total de linhas lidas", analise.linhas.length, 12);
ok("escolhe a aba certa (pula o LEIA-ME)", analise.aba === "Despesas", `aba=${analise.aba}`);

/* --- ZIP com deflate (o que o Excel real produz) -------------------- */
secao("1b. Mesmo arquivo comprimido com deflate (formato do Excel real)");
const bytesDeflate = recomprimirComDeflate(bytes);
const abasDeflate = lerXlsx(bytesDeflate);
const analiseDeflate = analisar(abasDeflate, "deflate.xlsx");
ok("lê ZIP comprimido com deflate", analiseDeflate.ok === true);
igual("mesmas linhas do arquivo não comprimido", analiseDeflate.linhas.length, 12);

/* --- 2. arquivo vazio ------------------------------------------------ */
secao("2. Arquivo vazio");
const vazio = new Uint8Array(await gerarXlsx([{ nome: "Despesas", colunas: [], linhas: [] }]).arrayBuffer());
const rVazio = analisar(lerXlsx(vazio), "vazio.xlsx");
ok("recusa arquivo sem cabeçalho reconhecível", rVazio.ok === false);

const soCabecalho = new Uint8Array(
  await gerarXlsx([{ nome: "Despesas", colunas: ["Vencimento", "Valor", "Fornecedor"], linhas: [] }]).arrayBuffer()
);
const rSoCabecalho = analisar(lerXlsx(soCabecalho), "so-cabecalho.xlsx");
ok("aceita cabeçalho sem linhas e devolve zero", rSoCabecalho.ok === true && rSoCabecalho.linhas.length === 0);

/* --- 3. coluna obrigatória ausente ---------------------------------- */
secao("3. Coluna obrigatória ausente");
const semValor = new Uint8Array(
  await gerarXlsx([
    { nome: "Despesas", colunas: ["Vencimento", "Fornecedor", "Descrição"], linhas: [[{ tipo: "data", valor: "2026-09-10" }, "ACME", "teste"]] },
  ]).arrayBuffer()
);
const rSemValor = analisar(lerXlsx(semValor), "sem-valor.xlsx");
ok("recusa planilha sem a coluna de Valor", rSemValor.ok === false);
ok("explica qual coluna falta", rSemValor.ok === false && /valor/i.test(rSemValor.erro), rSemValor.erro);

/* --- 4 e 5. valor e data inválidos ---------------------------------- */
secao("4 e 5. Valor e data inválidos");
const porObs = (texto) => analise.linhas.find((l) => l.dados.observacao?.includes(texto));

const semValorLinha = porObs("valor em branco");
ok("linha sem valor vira problema", semValorLinha?.situacao === "erro", semValorLinha?.situacao);
ok("diz que o valor faltou", semValorLinha?.problemas.some((p) => /Valor/.test(p)));

const valorZero = porObs("valor zero");
ok("linha com valor zero vira problema", valorZero?.situacao === "erro", valorZero?.situacao);

const dataRuim = porObs("30/02 nao existe");
ok("linha com data impossível vira problema", dataRuim?.situacao === "erro", dataRuim?.situacao);
ok("diz que a data não foi entendida", dataRuim?.problemas.some((p) => /data/i.test(p)));

igual("total com problema", analise.resumo.comProblema, 3);

/* --- 6. lançamento novo --------------------------------------------- */
secao("6. Lançamento novo");
const primeira = analise.linhas[0];
ok("primeira linha é nova", primeira.situacao === "novo", primeira.situacao);
igual("fornecedor lido", primeira.dados.fornecedor, "Distribuidora Norte Pecas LTDA");
igual("documento lido", primeira.dados.numeroDocumento, "4587");
igual("vencimento lido", primeira.dados.vencimento, "2026-09-10");
igual("liquidação lida", primeira.dados.liquidacao, "2026-09-09");
igual("competência lida", primeira.dados.competencia, "2026-09-01");
igual("valor pago lido", primeira.dados.valorPago, 1500);

/* --- 7. lançamento já existente ------------------------------------- */
secao("7. Lançamento já existente");
const existentes = {
  refs: new Set(),
  chaves: new Set(),
  documentos: new Set([chaveDocumento("11.222.333/0001-81", "4587", "2026-09-10")]),
  fracas: new Set(),
};
const comExistente = analisar(abas, "homologacao.xlsx", existentes);
const linha1 = comExistente.linhas[0];
ok("reconhece conta já cadastrada por CNPJ+documento", linha1.situacao === "existente", linha1.situacao);
ok("explica o motivo", /CNPJ/.test(linha1.motivo), linha1.motivo);

/* --- 8. possível duplicidade ---------------------------------------- */
secao("8. Possível duplicidade (coincidência fraca)");
const semDoc = porObs("sem CNPJ e sem documento");
const fraca = {
  refs: new Set(),
  chaves: new Set(),
  documentos: new Set(),
  fracas: new Set([`servicos gerais aurora|890.75|2026-09-25`]),
};
const comFraca = analisar(abas, "homologacao.xlsx", fraca);
const linhaFraca = comFraca.linhas.find((l) => l.dados.observacao?.includes("sem CNPJ"));
ok("coincidência fraca vira 'verificar', não bloqueio", linhaFraca?.situacao === "duplicado_possivel", linhaFraca?.situacao);
ok("pede verificação em vez de afirmar", /verificar/i.test(linhaFraca?.motivo ?? ""), linhaFraca?.motivo);
ok("sem coincidência, a mesma linha é nova", semDoc?.situacao === "novo", semDoc?.situacao);

/* --- 9. múltiplos lançamentos e parcelas ---------------------------- */
secao("9. Múltiplos lançamentos");
const parcelas = analise.linhas.filter((l) => l.dados.numeroDocumento === "4591");
igual("duas parcelas do mesmo documento foram lidas", parcelas.length, 2);
// Mesma nota, vencimentos diferentes: são parcelas, não repetição.
ok("parcelas diferentes NÃO viram duplicidade", parcelas.every((l) => l.situacao === "novo"),
   parcelas.map((l) => l.situacao).join(","));
ok("as parcelas têm chaves distintas", parcelas[0].chave !== parcelas[1].chave);

const repetida = porObs("repetida dentro do proprio arquivo");
ok("repetição dentro do arquivo é detectada", repetida?.situacao === "existente", repetida?.situacao);
ok("explica que a repetição é do próprio arquivo", /arquivo/i.test(repetida?.motivo ?? ""), repetida?.motivo);

/* --- 10 e 11. valores 1.500 e 1.500,50 ------------------------------ */
secao("10 e 11. Valores em português");
const milQuinhentos = porObs("1.500 como texto");
igual("'1.500' em texto vira 1500 (e não 1,50)", milQuinhentos?.dados.valor, 1500);

const comCentavos = porObs("1.500,50 como texto");
igual("'1.500,50' em texto vira 1500.50", comCentavos?.dados.valor, 1500.5);

igual("célula numérica 1500 continua 1500", primeira.dados.valor, 1500);
igual("célula numérica 890.75 continua 890.75", semDoc?.dados.valor, 890.75);

for (const [entrada, esperado] of [["1.500", 1500], ["1.500,00", 1500], ["1.500,50", 1500.5], ["1500", 1500], ["1500,50", 1500.5]]) {
  igual(`paraNumero(${JSON.stringify(entrada)})`, paraNumero(entrada), esperado);
}

// A armadilha que a distinção de tipo evita: célula NUMÉRICA 1234.567.
igual("célula numérica 1234.567 não vira 1.234.567", lerNumero({ tipo: "numero", valor: 1234.567 }), 1234.567);
igual("mesmo texto passaria pelo leitor pt-BR", lerNumero({ tipo: "texto", valor: "1.234" }), 1234);

/* --- datas em vários formatos --------------------------------------- */
secao("Datas em formatos diferentes");
igual("data nativa do Excel", lerData({ tipo: "data", valor: "2026-09-10" }), "2026-09-10");
igual("texto dd/mm/aaaa", lerData({ tipo: "texto", valor: "05/10/2026" }), "2026-10-05");
igual("texto ISO", lerData({ tipo: "texto", valor: "2026-10-05" }), "2026-10-05");
igual("texto dd-mm-aaaa", lerData({ tipo: "texto", valor: "05-10-2026" }), "2026-10-05");
igual("competência mm/aaaa vira dia 1", lerData({ tipo: "texto", valor: "10/2026" }), "2026-10-01");
igual("mês por extenso", lerData({ tipo: "texto", valor: "out/2026" }), "2026-10-01");
igual("serial do Excel", lerData({ tipo: "numero", valor: 46275 }), "2026-09-10");
// Ida e volta contra o gerador do próprio projeto: o serial que ele
// escreve tem que ser o mesmo que o leitor entende.
const serialEscrito = Math.floor(Date.UTC(2026, 8, 10) / 86400000) + 25569;
igual("serial escrito e lido dão a mesma data", lerData({ tipo: "numero", valor: serialEscrito }), "2026-09-10");
igual("vazio é ausência, não erro", lerData({ tipo: "texto", valor: "" }), undefined);
igual("data impossível vira null (problema)", lerData({ tipo: "texto", valor: "30/02/2026" }), null);
igual("texto sem sentido vira null", lerData({ tipo: "texto", valor: "amanha" }), null);

const linhaDatasTexto = porObs("dd/mm/aaaa como texto");
igual("linha com datas em texto foi entendida", linhaDatasTexto?.dados.vencimento, "2026-10-05");
ok("e não virou problema", linhaDatasTexto?.situacao === "novo", linhaDatasTexto?.situacao);

/* --- reconhecimento de colunas -------------------------------------- */
secao("Reconhecimento de colunas (independe de ordem e grafia)");
igual("'Nº do Documento'", reconhecerColuna("Nº do Documento"), "numeroDocumento");
igual("'NUMERO DOCUMENTO'", reconhecerColuna("NUMERO DOCUMENTO"), "numeroDocumento");
igual("'Data de Vencimento'", reconhecerColuna("Data de Vencimento"), "vencimento");
igual("'Competência'", reconhecerColuna("Competência"), "competencia");
igual("'Centro de Custo'", reconhecerColuna("Centro de Custo"), "centroCusto");
igual("coluna desconhecida", reconhecerColuna("Coluna Que Nao Existe"), null);
igual("normalização remove acento e conectivo", normalizarCabecalho("Nº do Documento"), "n documento");

// Ordem trocada: mesmo resultado.
const trocada = new Uint8Array(
  await gerarXlsx([
    { nome: "X", colunas: ["Valor", "Fornecedor", "Vencimento"], linhas: [[1500, "ACME", { tipo: "data", valor: "2026-09-10" }]] },
  ]).arrayBuffer()
);
const rTrocada = analisar(lerXlsx(trocada), "trocada.xlsx");
ok("colunas em ordem diferente funcionam", rTrocada.ok === true && rTrocada.linhas[0].dados.valor === 1500);
igual("fornecedor vira descrição quando não há descrição", rTrocada.linhas[0].dados.descricao, "ACME");

/* --- 10. campos sem correspondência (§10) ---------------------------- */
secao("Campos sem correspondência no ASA");
ok("categoria é avisada, não classificada sozinha",
   primeira.avisos.some((a) => /Categoria/.test(a) && /sem correspond/i.test(a)),
   primeira.avisos.join(" | "));
ok("centro de custo também é avisado", primeira.avisos.some((a) => /Centro de custo/.test(a)));

const comExtras = new Uint8Array(
  await gerarXlsx([
    { nome: "X", colunas: ["Valor", "Vencimento", "Fornecedor", "Coluna Estranha"], linhas: [[10, { tipo: "data", valor: "2026-09-10" }, "ACME", "conteudo"]] },
  ]).arrayBuffer()
);
const rExtras = analisar(lerXlsx(comExtras), "extras.xlsx");
igual("coluna sem correspondência é listada", rExtras.colunasSemCorrespondencia, ["Coluna Estranha"]);
igual("e o conteúdo é guardado, não descartado", rExtras.linhas[0].dados.extras["Coluna Estranha"], "conteudo");

/* --- 14. reimportação sem duplicar ---------------------------------- */
secao("14. Reimportação do mesmo arquivo");
// Simula o estado do banco DEPOIS de uma importação: todas as chaves de
// documento das linhas válidas passam a existir.
const novasNaPrimeira = analise.linhas.filter((l) => l.situacao === "novo");
const aposImportar = {
  refs: new Set(),
  // É esta a chave que a gravação registra em `origem_chave`.
  chaves: new Set(novasNaPrimeira.map((l) => l.chave).filter(Boolean)),
  documentos: new Set(
    novasNaPrimeira
      .map((l) => chaveDocumento(l.dados.cnpj, l.dados.numeroDocumento, l.dados.vencimento))
      .filter(Boolean)
  ),
  fracas: new Set(
    novasNaPrimeira
      .map((l) => (l.dados.fornecedor && l.dados.valor != null && l.dados.vencimento
        ? `${l.dados.fornecedor.toLowerCase()}|${l.dados.valor.toFixed(2)}|${l.dados.vencimento}`
        : null))
      .filter(Boolean)
  ),
};
const segundaVez = analisar(abas, "homologacao.xlsx", aposImportar);
igual("nenhuma linha nova na segunda importação", segundaVez.resumo.novos, 0);
ok("as válidas viram 'já existente' ou 'verificar'",
   segundaVez.resumo.existentes + segundaVez.resumo.duplicadosPossiveis === analise.resumo.novos + analise.resumo.existentes,
   `existentes=${segundaVez.resumo.existentes} verificar=${segundaVez.resumo.duplicadosPossiveis}`);
igual("os problemas continuam problemas", segundaVez.resumo.comProblema, 3);

/* --- resumo geral da prévia ----------------------------------------- */
secao("Resumo da prévia");
console.log(`  total=${analise.resumo.total} novos=${analise.resumo.novos} existentes=${analise.resumo.existentes} verificar=${analise.resumo.duplicadosPossiveis} problema=${analise.resumo.comProblema}`);
igual("soma do resumo bate com o total",
  analise.resumo.novos + analise.resumo.existentes + analise.resumo.duplicadosPossiveis + analise.resumo.comProblema,
  analise.resumo.total);

/* --- arquivo que não é xlsx ------------------------------------------ */
secao("Arquivo que não é uma planilha");
let recusou = false;
try {
  lerXlsx(new TextEncoder().encode("isto nao e um xlsx"));
} catch (e) {
  recusou = e.message === "ARQUIVO_INVALIDO";
}
ok("recusa arquivo que não é xlsx", recusou);

/* =================================================================== */

console.log("\n" + "=".repeat(60));
console.log(`${passou} passaram, ${falhou} falharam`);
if (falhou > 0) {
  console.log("\nFalhas:");
  for (const f of falhas) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("TODOS OS TESTES PASSARAM");
