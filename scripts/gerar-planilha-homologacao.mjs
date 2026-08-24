/**
 * Gera a planilha de HOMOLOGAÇÃO do importador.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ LAYOUT REAL, DADOS FICTÍCIOS.                                    │
 * │                                                                  │
 * │ As 18 colunas abaixo, seus nomes e a forma como os valores são   │
 * │ escritos reproduzem a exportação real de despesas da AutEM,      │
 * │ conferida contra um arquivo verdadeiro:                          │
 * │   - despesa como valor NEGATIVO;                                 │
 * │   - datas como texto dd/mm/aaaa;                                 │
 * │   - campo sem valor escrito como "------", não em branco;        │
 * │   - "Recorrência" no formato N/M (posição da parcela);           │
 * │   - CNPJ é o do PAGADOR (a ASA), repetido em todos os credores.  │
 * │                                                                  │
 * │ Já os DADOS são inventados: nenhum fornecedor, CNPJ, número de   │
 * │ nota, valor ou observação real da ASA aparece aqui, conforme a   │
 * │ política de dados fictícios do projeto.                          │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Reaproveita o gerador de XLSX que o projeto já usa nas exportações
 * (`frontend/src/lib/exportar/xlsx.ts`) em vez de ter um segundo.
 *
 * Uso: node scripts/gerar-planilha-homologacao.mjs
 * Saída: docs/homologacao/homologacao-importacao-FICTICIA.xlsx
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gerarXlsx } from "../frontend/src/lib/exportar/xlsx.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");

/** Marcador de vazio usado pela origem — não é célula em branco. */
const VAZIO = "------";

/** CNPJ fictício do pagador. Na origem real é o da própria empresa, repetido. */
const CNPJ_PAGADOR = "11.222.333/0001-81";
const CNPJ_PAGADOR_FILIAL = "11.222.333/0002-62";

/** Os 18 cabeçalhos, exatamente como a origem escreve. */
export const COLUNAS = [
  "Vencimento",
  "Liquidação",
  "Lançamento",
  "Competência",
  "Tipo",
  "CNPJ",
  "Nº Documento",
  "Forma de Pgto.",
  "Cliente / Fornecedor",
  "Conta Bancaria",
  "Descrição",
  "Centro de Custo",
  "Categoria",
  "Observação",
  "Recorrência",
  "Valor Pago (R$)",
  "Valor (R$)",
  "Diferença (R$)",
];

/**
 * Cada linha exercita um caminho do importador. A coluna "Observação"
 * diz qual — é planilha de teste, e isso ajuda a conferir na tela.
 */
export const LINHAS = [
  // 1. Liquidada: valor pago igual ao valor, ambos negativos.
  ["05/08/2026", "11/08/2026", "06/07/2026", "05/08/2026", "Despesa", CNPJ_PAGADOR,
   "VM00111222", "BOLETO BANCARIO", "Distribuidora Norte Pecas", "CEF EMPRESA FICTICIA LTDA",
   "PECAS DE REPOSICAO", "MANUTENCAO FROTA", "MANUTENCAO GERAL",
   "linha liquidada\r\nvalor pago igual ao valor", "01/01", -1500, -1500, 0],

  // 2. Em aberto: liquidação com marcador de vazio, valor pago zero.
  ["07/08/2026", VAZIO, "01/07/2026", "07/08/2026", "Despesa", CNPJ_PAGADOR,
   "NIC0333444", "BOLETO BANCARIO", "Auto Eletrica Bandeirante", "CEF EMPRESA FICTICIA LTDA",
   "REVISAO ELETRICA", "MANUTENCAO FROTA", "MANUTENCAO GERAL",
   "em aberto - liquidacao vazia", "01/01", 0, -890.75, -89075],

  // 3 e 4. Parcelado: mesma nota, parcelas e vencimentos diferentes.
  ["10/08/2026", VAZIO, "02/07/2026", "10/08/2026", "Despesa", CNPJ_PAGADOR,
   "AS01555666", "BOLETO BANCARIO", "Oficina Mecanica Vale Verde", "CEF EMPRESA FICTICIA LTDA",
   "RETIFICA DE MOTOR", "MANUTENCAO FROTA", "MANUTENCAO GERAL",
   "parcela 8 de 12 - nao pode virar 1/1", "08/12", 0, -2400, -240000],
  ["10/09/2026", VAZIO, "02/07/2026", "10/09/2026", "Despesa", CNPJ_PAGADOR,
   "AS01555666", "BOLETO BANCARIO", "Oficina Mecanica Vale Verde", "CEF EMPRESA FICTICIA LTDA",
   "RETIFICA DE MOTOR", "MANUTENCAO FROTA", "MANUTENCAO GERAL",
   "parcela 9 de 12 - mesma nota, outro vencimento", "09/12", 0, -2400, -240000],

  // 5. Valor alto com centavos, liquidada por PIX.
  ["03/08/2026", "03/08/2026", "28/07/2026", "01/08/2026", "Despesa", CNPJ_PAGADOR_FILIAL,
   "7788990", "PIX", "Energia Litoral S.A.", "PIX",
   "ENERGIA ELETRICA", "DESPESA ADMINISTRATIVA", "ENERGIA ELETRICA",
   "valor com centavos, pago por PIX", "08/12", -4320.9, -4320.9, 0],

  // 6. Forma de pagamento que o ASA nao conhece.
  ["12/08/2026", VAZIO, "05/07/2026", "12/08/2026", "Despesa", CNPJ_PAGADOR,
   "CARNE00123", "CARNE", "Imobiliaria Ficticia ME", "CEF EMPRESA FICTICIA LTDA",
   "ALUGUEL GALPAO", "DESPESA ADMINISTRATIVA", "ALUGUEL",
   "forma de pagamento sem correspondencia", "25/38", 0, -6800, -680000],

  // 7 e 8. Mesmo fornecedor, valor e vencimento, DOCUMENTOS diferentes:
  //        ambiguidade legitima -> "possivel duplicidade, verificar".
  ["05/08/2026", "11/08/2026", "06/07/2026", "05/08/2026", "Despesa", CNPJ_PAGADOR,
   "MT00777001", "BOLETO BANCARIO", "Orgao de Transito Ficticio", "CEF EMPRESA FICTICIA LTDA",
   "MULTA DE TRANSITO", "IMPOSTOS", "MULTA DE TRANSITO",
   "par ambiguo - documento diferente (1 de 2)", "01/01", -104.13, -104.13, 0],
  ["05/08/2026", "11/08/2026", "06/07/2026", "05/08/2026", "Despesa", CNPJ_PAGADOR,
   "MT00777002", "BOLETO BANCARIO", "Orgao de Transito Ficticio", "CEF EMPRESA FICTICIA LTDA",
   "MULTA DE TRANSITO", "IMPOSTOS", "MULTA DE TRANSITO",
   "par ambiguo - documento diferente (2 de 2)", "01/01", -104.13, -104.13, 0],

  // 9. Observacao longa com varias quebras de linha.
  ["14/08/2026", VAZIO, "10/07/2026", "14/08/2026", "Despesa", CNPJ_PAGADOR,
   "NF00998877", "DEBITO AUTOMATICO", "Servicos Gerais Aurora", "CEF EMPRESA FICTICIA LTDA",
   "LIMPEZA DO PATIO", "DESPESA ADMINISTRATIVA", "SERVICOS TERCEIRIZADOS",
   "observacao longa\r\nsegunda linha do texto\r\nterceira linha com mais detalhe\r\nquarta linha final",
   "06/12", 0, -1180.4, -118040],

  // 10. Documento generico repetido (a origem faz isso quando nao ha nota):
  //     fornecedor e valor diferentes -> as duas TEM que entrar.
  ["09/08/2026", VAZIO, "01/07/2026", "09/08/2026", "Despesa", CNPJ_PAGADOR,
   "AVULSO", "BOLETO BANCARIO", "Papelaria Central Ficticia", "CEF EMPRESA FICTICIA LTDA",
   "MATERIAL DE ESCRITORIO", "DESPESA ADMINISTRATIVA", "MATERIAL DE CONSUMO",
   "documento generico - fornecedor A", "01/01", 0, -312.4, -31240],
  ["09/08/2026", VAZIO, "01/07/2026", "09/08/2026", "Despesa", CNPJ_PAGADOR,
   "AVULSO", "BOLETO BANCARIO", "Pneus Cearense Ficticio", "CEF EMPRESA FICTICIA LTDA",
   "RECAPAGEM DE PNEUS", "MANUTENCAO FROTA", "PNEUS",
   "documento generico - fornecedor B (nao pode sumir)", "01/01", 0, -1875.5, -187550],

  // 11. PROBLEMA: sem valor.
  ["15/08/2026", VAZIO, "11/07/2026", "15/08/2026", "Despesa", CNPJ_PAGADOR,
   "NF00445566", "BOLETO BANCARIO", "Transportes Rapido Ficticio", "CEF EMPRESA FICTICIA LTDA",
   "FRETE DE PECAS", "MANUTENCAO FROTA", "FRETES",
   "PROBLEMA: valor em branco", "01/01", 0, "", ""],

  // 12. PROBLEMA: vencimento que nao existe no calendario.
  ["30/02/2026", VAZIO, "12/07/2026", "01/08/2026", "Despesa", CNPJ_PAGADOR,
   "NF00112233", "PIX", "Lubrificantes Ficticios", "CEF EMPRESA FICTICIA LTDA",
   "OLEO LUBRIFICANTE", "MANUTENCAO FROTA", "LUBRIFICANTES",
   "PROBLEMA: 30/02 nao existe", "01/01", 0, -1180, -118000],
];

export function planilhasHomologacao() {
  return [{ nome: "Sheet1", colunas: COLUNAS, linhas: LINHAS }];
}

export async function gerarBytes() {
  const blob = gerarXlsx(planilhasHomologacao());
  return new Uint8Array(await blob.arrayBuffer());
}

// Só escreve o arquivo quando chamado direto pela linha de comando.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const bytes = await gerarBytes();
  const destino = join(RAIZ, "docs", "homologacao");
  mkdirSync(destino, { recursive: true });
  const caminho = join(destino, "homologacao-importacao-FICTICIA.xlsx");
  writeFileSync(caminho, bytes);
  console.log(`Planilha de homologacao (LAYOUT REAL, DADOS FICTICIOS) gerada: ${caminho}`);
  console.log(`${LINHAS.length} linhas, ${COLUNAS.length} colunas.`);
}
