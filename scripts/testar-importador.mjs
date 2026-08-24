/**
 * Testes do importador de despesas por planilha.
 *
 * Rodam sobre a planilha de homologação, que reproduz o LAYOUT REAL da
 * exportação da AutEM com DADOS FICTÍCIOS — nenhum dado real da empresa
 * entra aqui (ver `gerar-planilha-homologacao.mjs`).
 *
 * Executa com Node puro (type stripping nativo do Node 24), sem
 * framework de teste e sem dependência nova no projeto:
 *
 *   node --import ./scripts/registrar-resolucao-ts.mjs scripts/testar-importador.mjs
 *
 * Cobre leitura do XLSX, reconhecimento de colunas, conversão de valores
 * e datas, parcelamento, duplicidade e reimportação. Não toca no banco:
 * a análise é pura de propósito, e é isso que permite testá-la inteira.
 */

import { deflateRawSync } from "node:zlib";
import { gerarBytes } from "./gerar-planilha-homologacao.mjs";
import { gerarXlsx } from "../frontend/src/lib/exportar/xlsx.ts";
import { lerXlsx } from "../frontend/src/lib/importacao/xlsx-leitor.ts";
import {
  analisar,
  chaveDocumento,
  lerData,
  lerNumero,
  lerParcela,
  valorParaAsa,
} from "../frontend/src/lib/importacao/analise.ts";
import {
  acharClassificacao,
  acharGrupo,
  normalizarCabecalho,
  reconhecerColuna,
  resolverContaBancaria,
  traduzirFormaPagamento,
} from "../frontend/src/lib/importacao/mapeamento.ts";
import { paraNumero } from "../frontend/src/lib/financeiro/formato.ts";

/**
 * Catálogo de teste — imita o cadastro do ASA (grupos, classificações e
 * bancos) sem depender do banco de dados. Nomes reais da estrutura
 * contábil; nenhum dado financeiro real.
 */
const CATALOGOS = {
  classificacoes: [
    { id: "cl1", grupo: "IMPOSTOS", nome: "Multa de Trânsito" },
    { id: "cl2", grupo: "IMPOSTOS", nome: "IPTU" },
    { id: "cl3", grupo: "ADMINISTRATIVAS", nome: "Internet" },
    { id: "cl4", grupo: "ADMINISTRATIVAS", nome: "Energia Elétrica" },
    { id: "cl5", grupo: "ADMINISTRATIVAS", nome: "Manutenção de Veículos" },
    { id: "cl6", grupo: "FUNCIONÁRIOS/PESSOAL", nome: "Salário" },
    { id: "cl7", grupo: "FINANCEIRAS", nome: "Tarifa Bancária" },
    { id: "cl8", grupo: "OUTRAS", nome: "Adiantamento a Sócios" },
  ],
  bancos: [
    { id: "b1", nome: "Tesouraria - Dinheiro" },
    { id: "b2", nome: "Banco 1 - CEF" },
    { id: "b3", nome: "Banco 2 - BB" },
    { id: "b4", nome: "Banco 5 - CEF - Asa Serviços" },
  ],
};

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

const secao = (t) => console.log(`\n${t}`);

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

  const saida = new Uint8Array(partes.reduce((a, b) => a + b.length, 0));
  let i = 0;
  for (const parte of partes) { saida.set(parte, i); i += parte.length; }
  return saida;
}

const SEM_EXISTENTES = { refs: new Set(), chaves: new Set(), documentos: new Set(), fracas: new Set() };

/* =================================================================== */

console.log("TESTES DO IMPORTADOR — layout real, dados fictícios\n" + "=".repeat(62));

const bytes = await gerarBytes();
const abas = lerXlsx(bytes);
const analise = analisar(abas, "homologacao.xlsx", undefined, CATALOGOS);
const porObs = (t) => analise.linhas.find((l) => l.dados.observacao?.includes(t));

/* --- 1. cabeçalhos reais -------------------------------------------- */
secao("1. Cabeçalhos reais da exportação");
const CABECALHOS_REAIS = [
  ["Vencimento", "vencimento"],
  ["Liquidação", "liquidacao"],
  ["Lançamento", "dataLancamento"],
  ["Competência", "competencia"],
  ["Tipo", "tipo"],
  ["CNPJ", "cnpj"],
  ["Nº Documento", "numeroDocumento"],
  ["Forma de Pgto.", "formaPagamento"],
  ["Cliente / Fornecedor", "fornecedor"],
  ["Conta Bancaria", "contaBancaria"],
  ["Descrição", "descricao"],
  ["Centro de Custo", "centroCusto"],
  ["Categoria", "categoria"],
  ["Observação", "observacao"],
  ["Recorrência", "recorrencia"],
  ["Valor Pago (R$)", "valorPago"],
  ["Valor (R$)", "valor"],
];
for (const [cabecalho, campo] of CABECALHOS_REAIS) {
  igual(`"${cabecalho}"`, reconhecerColuna(cabecalho), campo);
}
igual('"Diferença (R$)" fica sem correspondência (correto)', reconhecerColuna("Diferença (R$)"), null);

secao("1b. A unidade entre parênteses não atrapalha (era o defeito)");
igual('normalizar "Valor (R$)"', normalizarCabecalho("Valor (R$)"), "valor");
igual('normalizar "Valor Pago (R$)"', normalizarCabecalho("Valor Pago (R$)"), "valor pago");
igual('normalizar "Forma de Pgto."', normalizarCabecalho("Forma de Pgto."), "forma pgto");
igual('normalizar "Cliente / Fornecedor"', normalizarCabecalho("Cliente / Fornecedor"), "cliente fornecedor");
igual('"Valor (un)" também', reconhecerColuna("Valor (un)"), "valor");

/* --- 2. leitura do arquivo ------------------------------------------ */
secao("2. Leitura do arquivo");
igual("uma aba", abas.length, 1);
ok("análise conclui", analise.ok === true, analise.ok ? "" : analise.erro);
igual("todas as linhas lidas", analise.linhas.length, 13);
igual("nenhuma coluna obrigatória faltando", analise.camposAusentes, []);

const analiseDeflate = analisar(lerXlsx(recomprimirComDeflate(bytes)), "deflate.xlsx");
igual("ZIP deflate (formato do Excel real) lê igual", analiseDeflate.linhas.length, 13);

/* --- 3. valores negativos ------------------------------------------- */
secao("3. Valores negativos da origem");
igual("valorParaAsa(-1500)", valorParaAsa(-1500), 1500);
igual("valorParaAsa(-104.13)", valorParaAsa(-104.13), 104.13);
igual("valorParaAsa(1500) não muda o positivo", valorParaAsa(1500), 1500);
igual("valorParaAsa(null)", valorParaAsa(null), null);

const validas = analise.linhas.filter((l) => l.situacao !== "erro");
ok("todo valor importável ficou positivo", validas.every((l) => l.dados.valor > 0));
ok("nenhuma linha foi recusada por 'valor maior que zero'",
   !analise.linhas.some((l) => l.problemas.some((p) => /maior que zero/.test(p))));

const liquidada = porObs("linha liquidada");
igual("valor convertido para positivo", liquidada.dados.valor, 1500);
igual("original negativo preservado", liquidada.dados.valorOriginal, -1500);
igual("valor pago convertido", liquidada.dados.valorPago, 1500);
igual("valor pago original preservado", liquidada.dados.valorPagoOriginal, -1500);

/* --- 4. datas e liquidação ------------------------------------------ */
secao("4. Datas e liquidação");
igual("dd/mm/aaaa", lerData({ tipo: "texto", valor: "05/08/2026" }), "2026-08-05");
igual("data impossível vira problema", lerData({ tipo: "texto", valor: "30/02/2026" }), null);
igual('marcador "------" é ausência, não erro', lerData({ tipo: "texto", valor: "------" }), undefined);
igual('marcador "---"', lerData({ tipo: "texto", valor: "---" }), undefined);
igual('marcador "N/A"', lerData({ tipo: "texto", valor: "N/A" }), undefined);
igual("célula vazia", lerData({ tipo: "texto", valor: "" }), undefined);

const emAberto = porObs("em aberto");
igual("liquidação vazia vira null", emAberto.dados.liquidacao, null);
ok("e a linha NÃO vira problema", emAberto.situacao !== "erro", emAberto.situacao);
igual("valor pago zero", emAberto.dados.valorPago, 0);

igual("liquidação preenchida é lida", liquidada.dados.liquidacao, "2026-08-11");
const geramPagamento = analise.linhas.filter((l) => l.dados.liquidacao && l.dados.valorPago > 0);
igual("linhas que geram pagamento", geramPagamento.length, 4);

/* --- 5. parcelamento ------------------------------------------------ */
secao("5. Recorrência N/M = parcela N de M");
igual('lerParcela("08/12")', lerParcela("08/12"), { numero: 8, total: 12 });
igual('lerParcela("01/01")', lerParcela("01/01"), { numero: 1, total: 1 });
igual('lerParcela("25/38")', lerParcela("25/38"), { numero: 25, total: 38 });
igual('lerParcela("3/3")', lerParcela("3/3"), { numero: 3, total: 3 });
igual('lerParcela("13/12") é incoerente -> null', lerParcela("13/12"), null);
igual('lerParcela("mensal") -> null', lerParcela("mensal"), null);
igual("lerParcela(null)", lerParcela(null), null);

const p8 = porObs("parcela 8 de 12");
igual("parcela 8", p8.dados.parcelaNumero, 8);
igual("de 12", p8.dados.parcelaTotal, 12);
ok("NÃO virou 1/1", !(p8.dados.parcelaNumero === 1 && p8.dados.parcelaTotal === 1));

const p9 = porObs("parcela 9 de 12");
ok("parcelas da mesma nota são lançamentos distintos",
   p8.situacao === "novo" && p9.situacao === "novo", `${p8.situacao}/${p9.situacao}`);
ok("e têm chaves diferentes", p8.chave !== p9.chave);

/* --- 6. fornecedor e CNPJ ------------------------------------------- */
secao("6. Fornecedor e CNPJ");
igual("fornecedor vem de Cliente / Fornecedor", liquidada.dados.fornecedor, "Distribuidora Norte Pecas");
ok("CNPJ é lido (para preservar)", !!liquidada.dados.cnpj);
// O CNPJ da origem é do PAGADOR: o mesmo se repete em credores distintos.
const cnpjs = new Set(analise.linhas.map((l) => l.dados.cnpj));
const fornecedores = new Set(analise.linhas.map((l) => l.dados.fornecedor));
ok("poucos CNPJs para muitos fornecedores (prova que não é do credor)",
   cnpjs.size < fornecedores.size, `cnpjs=${cnpjs.size} fornecedores=${fornecedores.size}`);
ok("o CNPJ não entra em nenhuma chave de identidade",
   !analise.linhas.some((l) => l.chave && [...cnpjs].some((c) => c && l.chave.includes(c.replace(/\D/g, "")))));

/* --- 7. forma de pagamento ------------------------------------------ */
secao("7. Forma de pagamento");
igual('"BOLETO BANCARIO"', traduzirFormaPagamento("BOLETO BANCARIO"), "Boleto");
igual('"PIX"', traduzirFormaPagamento("PIX"), "PIX");
igual('"DEBITO AUTOMATICO"', traduzirFormaPagamento("DEBITO AUTOMATICO"), "Débito automático");
igual('"Boleto Bancário" com acento', traduzirFormaPagamento("Boleto Bancário"), "Boleto");
igual('"CARNE" não existe no ASA -> null', traduzirFormaPagamento("CARNE"), null);
igual("nulo", traduzirFormaPagamento(null), null);

const carne = porObs("forma de pagamento sem correspondencia");
igual("campo fica em branco", carne.dados.formaPagamentoAsa, null);
igual("texto original preservado", carne.dados.formaPagamento, "CARNE");
ok("e a linha avisa que precisa completar",
   carne.avisos.some((a) => /CARNE/.test(a)), carne.avisos.join(" | "));
ok("mas continua importável", carne.situacao === "novo", carne.situacao);

/* --- 8. observação --------------------------------------------------- */
secao("8. Observação preservada por inteiro");
const longa = porObs("observacao longa");
ok("quebras de linha mantidas", /\r?\n/.test(longa.dados.observacao));
igual("linhas do texto", longa.dados.observacao.split(/\r?\n/).length, 4);
ok("nada truncado", longa.dados.observacao.includes("quarta linha final"));

/* --- 9. duplicidade -------------------------------------------------- */
secao("9. Duplicidade — nenhuma despesa some");
const chaves = new Set(analise.linhas.filter((l) => l.chave).map((l) => l.chave));
const comChave = analise.linhas.filter((l) => l.chave).length;
igual("uma chave por lançamento", chaves.size, comChave);

// Documento genérico repetido: fornecedor e valor diferentes -> as duas entram.
const genA = porObs("documento generico - fornecedor A");
const genB = porObs("documento generico - fornecedor B");
igual("mesmo número de documento", genA.dados.numeroDocumento, genB.dados.numeroDocumento);
igual("mesmo vencimento", genA.dados.vencimento, genB.dados.vencimento);
ok("as duas entram — nenhuma vira 'repetida'",
   genA.situacao === "novo" && genB.situacao === "novo", `${genA.situacao}/${genB.situacao}`);
ok("porque a chave inclui fornecedor e valor", genA.chave !== genB.chave);

// Mesmo fornecedor/valor/vencimento com documentos diferentes: ambíguo.
const amb1 = porObs("par ambiguo - documento diferente (1 de 2)");
const amb2 = porObs("par ambiguo - documento diferente (2 de 2)");
igual("a primeira entra normalmente", amb1.situacao, "novo");
igual("a segunda pede verificação", amb2.situacao, "duplicado_possivel");
ok("com texto que pede conferência", /verificar/i.test(amb2.motivo), amb2.motivo);
ok("nenhuma das duas é descartada em silêncio", amb1.situacao !== "existente" && amb2.situacao !== "existente");

secao("9b. A chave de identidade");
igual("mesma linha, mesma chave",
  chaveDocumento("ACME", "NF1", "2026-08-05", 100),
  chaveDocumento("acme", "nf1", "2026-08-05", 100));
ok("valor diferente muda a chave",
  chaveDocumento("ACME", "NF1", "2026-08-05", 100) !== chaveDocumento("ACME", "NF1", "2026-08-05", 200));
ok("fornecedor diferente muda a chave",
  chaveDocumento("ACME", "NF1", "2026-08-05", 100) !== chaveDocumento("OUTRO", "NF1", "2026-08-05", 100));
ok("sinal do valor não muda a chave (origem manda negativo)",
  chaveDocumento("ACME", "NF1", "2026-08-05", -100) === chaveDocumento("ACME", "NF1", "2026-08-05", 100));
igual("sem fornecedor não há chave forte", chaveDocumento(null, "NF1", "2026-08-05", 100), null);
ok("documento ausente ainda gera chave", chaveDocumento("ACME", null, "2026-08-05", 100) !== null);

/* --- 10. problemas --------------------------------------------------- */
secao("10. Linhas com problema");
igual("total com problema", analise.resumo.comProblema, 2);
const semValor = porObs("valor em branco");
ok("sem valor vira problema", semValor.situacao === "erro", semValor.situacao);
const vencRuim = porObs("30/02 nao existe");
ok("vencimento impossível vira problema", vencRuim.situacao === "erro", vencRuim.situacao);
ok("e diz qual é o problema", vencRuim.problemas.some((p) => /data/i.test(p)));

/* --- 11. reimportação e não sobrescrita ------------------------------ */
secao("11. Reimportação do mesmo arquivo");
const novasNaPrimeira = analise.linhas.filter((l) => l.situacao === "novo");
const jaImportado = {
  refs: new Set(),
  chaves: new Set(novasNaPrimeira.map((l) => l.chave).filter(Boolean)),
  documentos: new Set(),
  fracas: new Set(),
};
const segunda = analisar(abas, "reimport.xlsx", jaImportado, CATALOGOS);
igual("nenhuma linha nova na segunda vez", segunda.resumo.novos, 0);
igual("as que entraram viram 'já existente'", segunda.resumo.existentes, novasNaPrimeira.length);
igual("os problemas continuam problemas", segunda.resumo.comProblema, analise.resumo.comProblema);
ok("nenhuma linha é gravada de novo",
   segunda.linhas.every((l) => l.situacao !== "novo"));

secao("11b. Reconhecimento por chave gravada, mesmo com o banco vazio de documento");
const soPorChave = { ...SEM_EXISTENTES, chaves: new Set([liquidada.chave]) };
const r = analisar(abas, "x.xlsx", soPorChave, CATALOGOS);
const linhaLiq = r.linhas.find((l) => l.dados.observacao?.includes("linha liquidada"));
igual("reconhecida pela chave da importação anterior", linhaLiq.situacao, "existente");

/* --- 12. valores em português ---------------------------------------- */
secao("12. Leitura de valores");
for (const [entrada, esperado] of [["1.500", 1500], ["1.500,00", 1500], ["1.500,50", 1500.5], ["1500", 1500], ["1500,50", 1500.5]]) {
  igual(`paraNumero(${JSON.stringify(entrada)})`, paraNumero(entrada), esperado);
}
igual("célula numérica 1234.567 não vira 1.234.567", lerNumero({ tipo: "numero", valor: 1234.567 }), 1234.567);
igual("célula numérica negativa mantém o sinal aqui", lerNumero({ tipo: "numero", valor: -104.13 }), -104.13);
igual('marcador "------" em campo numérico', lerNumero({ tipo: "texto", valor: "------" }), null);

/* --- 13. tolerância de formato --------------------------------------- */
secao("13. Tolerância — título antes do cabeçalho e colunas deslocadas");
const comTitulo = new Uint8Array(
  await gerarXlsx([
    {
      nome: "Sheet1",
      colunas: ["exportGrid_AutEM_xls"],
      linhas: [
        [],
        ["", "", "Vencimento", "Cliente / Fornecedor", "Valor (R$)"],
        ["", "", "05/08/2026", "Fornecedor Ficticio", -250.5],
      ],
    },
  ]).arrayBuffer()
);
const rTitulo = analisar(lerXlsx(comTitulo), "com-titulo.xlsx");
ok("acha o cabeçalho abaixo do título", rTitulo.ok === true, rTitulo.ok ? "" : rTitulo.erro);
igual("e lê a linha de dados", rTitulo.linhas.length, 1);
igual("com o valor convertido", rTitulo.linhas[0].dados.valor, 250.5);

const semColunaValor = new Uint8Array(
  await gerarXlsx([{ nome: "S", colunas: ["Vencimento", "Cliente / Fornecedor", "Descrição"], linhas: [["05/08/2026", "ACME", "x"]] }]).arrayBuffer()
);
const rSemValor = analisar(lerXlsx(semColunaValor), "sem-valor.xlsx");
ok("planilha sem coluna de Valor é recusada", rSemValor.ok === false);
ok("e a mensagem diz qual coluna falta", rSemValor.ok === false && /valor/i.test(rSemValor.erro), rSemValor.ok === false ? rSemValor.erro : "");

/* --- 14. Centro de Custo → Grupo e Categoria → Classificação --------- */
secao("14. Centro de Custo → Grupo");
igual('"IMPOSTOS" (nome igual)', acharGrupo("IMPOSTOS", CATALOGOS.classificacoes), "IMPOSTOS");
igual('"impostos" (caixa diferente)', acharGrupo("impostos", CATALOGOS.classificacoes), "IMPOSTOS");
igual('"DESPESA ADMINISTRATIVA" (sinônimo)', acharGrupo("DESPESA ADMINISTRATIVA", CATALOGOS.classificacoes), "ADMINISTRATIVAS");
igual('"FUNCIONARIOS" (sinônimo, sem acento)', acharGrupo("FUNCIONARIOS", CATALOGOS.classificacoes), "FUNCIONÁRIOS/PESSOAL");
igual('"MANUTENCAO FROTA" é decisão contábil -> null', acharGrupo("MANUTENCAO FROTA", CATALOGOS.classificacoes), null);
igual('"MARKETING" -> null', acharGrupo("MARKETING", CATALOGOS.classificacoes), null);
igual("centro de custo vazio -> null", acharGrupo(null, CATALOGOS.classificacoes), null);
igual("sem catálogo -> null", acharGrupo("IMPOSTOS", []), null);

secao("14b. Categoria → Classificação");
igual('"MULTA DE TRANSITO" -> "Multa de Trânsito"',
  acharClassificacao("MULTA DE TRANSITO", CATALOGOS.classificacoes)?.nome, "Multa de Trânsito");
igual("e traz o grupo verdadeiro da classificação",
  acharClassificacao("MULTA DE TRANSITO", CATALOGOS.classificacoes)?.grupo, "IMPOSTOS");
igual('"ENERGIA ELETRICA" (sem acento) -> "Energia Elétrica"',
  acharClassificacao("ENERGIA ELETRICA", CATALOGOS.classificacoes)?.nome, "Energia Elétrica");
igual('"IMPOSTO/ISS" é ambíguo -> null', acharClassificacao("IMPOSTO/ISS", CATALOGOS.classificacoes), null);
igual('"MANUTENCAO AUTOMOTIVA" -> null (não é "Manutenção de Veículos" com certeza)',
  acharClassificacao("MANUTENCAO AUTOMOTIVA", CATALOGOS.classificacoes), null);
igual("categoria vazia -> null", acharClassificacao(null, CATALOGOS.classificacoes), null);

secao("14c. Aplicado às linhas da planilha");
const multa = porObs("par ambiguo - documento diferente (1 de 2)");
igual("classificação preenchida", multa.dados.classificacaoNome, "Multa de Trânsito");
igual("grupo veio da classificação", multa.dados.grupo, "IMPOSTOS");
ok("sem aviso de classificação nesta linha",
   !multa.avisos.some((a) => /^Classificação/.test(a)), multa.avisos.join(" | "));

const energia = porObs("valor com centavos, pago por PIX");
igual("categoria ENERGIA ELETRICA resolveu", energia.dados.classificacaoNome, "Energia Elétrica");
igual("grupo ADMINISTRATIVAS", energia.dados.grupo, "ADMINISTRATIVAS");

const semCorresp = porObs("parcela 8 de 12");
igual("categoria desconhecida fica em branco", semCorresp.dados.classificacaoId, null);
ok("e avisa que precisa completar",
   semCorresp.avisos.some((a) => /Classificação/.test(a)), semCorresp.avisos.join(" | "));
ok("grupo também avisa quando não resolve",
   semCorresp.dados.grupo === null && semCorresp.avisos.some((a) => /Grupo/.test(a)));

/* --- 15. Conta bancária: CEF e PIX ----------------------------------- */
secao("15. Conta bancária → Banco");
const cef = resolverContaBancaria("CEF EMPRESA FICTICIA LTDA", CATALOGOS.bancos);
igual("conta desconhecida não vira banco nenhum", cef.bancoId, null);

const cefReal = resolverContaBancaria("CEF AGUANAMBI FREIOS LTDA", CATALOGOS.bancos);
igual("a conta da empresa resolve para a CEF principal", cefReal.bancoNome, "Banco 1 - CEF");
ok("e NÃO para a CEF da outra empresa do grupo", cefReal.bancoNome !== "Banco 5 - CEF - Asa Serviços");

secao("15b. PIX na coluna de conta");
const pix = resolverContaBancaria("PIX", CATALOGOS.bancos);
igual("banco fica em branco", pix.bancoId, null);
igual("e a forma de pagamento vira PIX", pix.formaPagamento, "PIX");

const linhaPix = porObs("valor com centavos, pago por PIX");
igual("na linha: banco em branco", linhaPix.dados.bancoId, null);
igual("na linha: forma PIX", linhaPix.dados.formaPagamentoAsa, "PIX");
ok("não avisa banco faltando (é intencional)",
   !linhaPix.avisos.some((a) => /^Banco/.test(a)), linhaPix.avisos.join(" | "));

igual("nome exato de banco cadastrado também resolve",
  resolverContaBancaria("Banco 2 - BB", CATALOGOS.bancos).bancoNome, "Banco 2 - BB");
igual("conta vazia", resolverContaBancaria(null, CATALOGOS.bancos).bancoId, null);

/* --- 16. resumo ------------------------------------------------------ */
secao("16. Resumo da prévia");
console.log(`  ${JSON.stringify(analise.resumo)}`);
igual("a soma bate com o total",
  analise.resumo.novos + analise.resumo.existentes + analise.resumo.duplicadosPossiveis + analise.resumo.comProblema,
  analise.resumo.total);
ok("contador de complemento é exceção, não regra",
   analise.resumo.comComplemento > 0 && analise.resumo.comComplemento < analise.resumo.total,
   String(analise.resumo.comComplemento));

/* =================================================================== */

console.log("\n" + "=".repeat(62));
console.log(`${passou} passaram, ${falhou} falharam`);
if (falhou > 0) {
  console.log("\nFalhas:");
  for (const f of falhas) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("TODOS OS TESTES PASSARAM");
