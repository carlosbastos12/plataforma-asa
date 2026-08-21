/**
 * Gera a planilha de HOMOLOGAÇÃO do importador.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ O CONTEÚDO DESTA PLANILHA É FICTÍCIO E O LAYOUT NÃO É O DA AUTEM.│
 * │                                                                  │
 * │ Nenhum arquivo real de exportação de despesas da AutEM foi       │
 * │ recebido até aqui. As colunas abaixo reproduzem apenas a LISTA   │
 * │ DE CAMPOS informada pelo Vitor, numa grafia plausível, para que  │
 * │ o importador pudesse ser construído e testado desde já.          │
 * │                                                                  │
 * │ Fornecedores, CNPJs, notas e valores são inventados — nenhum     │
 * │ dado real da ASA entra aqui, conforme a política do projeto.     │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Reaproveita o gerador de XLSX que o projeto já usa nas exportações
 * (`frontend/src/lib/exportar/xlsx.ts`) em vez de ter um segundo — assim
 * a planilha de teste é montada exatamente pelo mesmo código que produz
 * os arquivos reais do sistema.
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

const d = (iso) => ({ tipo: "data", valor: iso });

export const COLUNAS = [
  "Vencimento",
  "Liquidação",
  "Data de Lançamento",
  "Competência",
  "Tipo",
  "CNPJ",
  "Número do Documento",
  "Forma de Pagamento",
  "Fornecedor",
  "Conta Bancária",
  "Descrição",
  "Centro de Custo",
  "Categoria",
  "Observação",
  "Recorrência",
  "Valor",
  "Valor Pago",
];

/**
 * Cada linha exercita um caminho diferente do importador. A coluna
 * "Observação" diz qual — é planilha de teste, e isso ajuda a conferir.
 */
export const LINHAS = [
  // 1. Caminho completo, já liquidada.
  [d("2026-09-10"), d("2026-09-09"), d("2026-08-28"), d("2026-09-01"), "Despesa", "11.222.333/0001-81",
   "4587", "Boleto", "Distribuidora Norte Pecas LTDA", "Banco do Brasil", "Pecas de reposicao - lote 12",
   "Manutencao", "Manutencao Geral", "linha completa e ja paga", "Nao", 1500, 1500],

  // 2. Valor com milhar e centavos, em TEXTO — o caso que quebrava antes.
  [d("2026-09-15"), "", d("2026-09-01"), d("2026-09-01"), "Despesa", "22.333.444/0001-92",
   "4588", "PIX", "Auto Eletrica Bandeirante", "", "Revisao eletrica da frota",
   "Manutencao", "Manutencao Geral", "valor 1.500,50 como texto", "Nao", "1.500,50", ""],

  // 3. Milhar sem centavos, em TEXTO: 1.500 é mil e quinhentos, não 1,50.
  [d("2026-09-20"), "", d("2026-09-02"), d("2026-09-01"), "Despesa", "33.444.555/0001-03",
   "4589", "Boleto", "Pneus Cearense ME", "", "Recapagem de 4 pneus",
   "Manutencao", "Pneus", "valor 1.500 como texto (milhar)", "Nao", "1.500", ""],

  // 4. Sem CNPJ e sem documento: só a chave fraca fica disponível.
  [d("2026-09-25"), "", d("2026-09-03"), d("2026-09-01"), "Despesa", "",
   "", "Transferencia", "Servicos Gerais Aurora", "", "Limpeza do patio - setembro",
   "Administrativo", "Servicos Terceirizados", "sem CNPJ e sem documento", "Mensal", 890.75, ""],

  // 5. Datas em formato brasileiro, escritas como texto.
  ["05/10/2026", "", "01/10/2026", "10/2026", "Despesa", "44.555.666/0001-14",
   "4590", "Boleto", "Papelaria Central EIRELI", "", "Material de escritorio",
   "Administrativo", "Material de Consumo", "datas em dd/mm/aaaa como texto", "Nao", 312.4, ""],

  // 6 e 7. Parcelada: MESMO documento, parcelas diferentes — não é duplicidade.
  [d("2026-10-10"), "", d("2026-09-05"), d("2026-09-01"), "Despesa", "55.666.777/0001-25",
   "4591", "Boleto", "Oficina Mecanica Vale Verde", "", "Retifica de motor - parcela 1",
   "Manutencao", "Manutencao Geral", "parcela 1 de 2 do mesmo documento", "Nao", 2400, ""],
  [d("2026-11-10"), "", d("2026-09-05"), d("2026-09-01"), "Despesa", "55.666.777/0001-25",
   "4591", "Boleto", "Oficina Mecanica Vale Verde", "", "Retifica de motor - parcela 2",
   "Manutencao", "Manutencao Geral", "parcela 2 de 2 do mesmo documento", "Nao", 2400, ""],

  // 8. PROBLEMA: sem valor.
  [d("2026-09-30"), "", d("2026-09-06"), d("2026-09-01"), "Despesa", "66.777.888/0001-36",
   "4592", "Boleto", "Transportes Rapido Sul", "", "Frete de pecas",
   "Logistica", "Fretes", "PROBLEMA: valor em branco", "Nao", "", ""],

  // 9. PROBLEMA: data que não existe.
  ["30/02/2026", "", d("2026-09-07"), d("2026-09-01"), "Despesa", "77.888.999/0001-47",
   "4593", "PIX", "Lubrificantes do Nordeste", "", "Oleo lubrificante - 200L",
   "Manutencao", "Lubrificantes", "PROBLEMA: 30/02 nao existe", "Nao", 1180, ""],

  // 10. PROBLEMA: valor zerado.
  [d("2026-10-05"), "", d("2026-09-08"), d("2026-09-01"), "Despesa", "88.999.000/0001-58",
   "4594", "Boleto", "Seguros Atlantico S.A.", "", "Ajuste de apolice",
   "Administrativo", "Seguros", "PROBLEMA: valor zero", "Nao", 0, ""],

  // 11. Repetida de propósito: idêntica à linha 1, mesmo documento.
  [d("2026-09-10"), d("2026-09-09"), d("2026-08-28"), d("2026-09-01"), "Despesa", "11.222.333/0001-81",
   "4587", "Boleto", "Distribuidora Norte Pecas LTDA", "Banco do Brasil", "Pecas de reposicao - lote 12",
   "Manutencao", "Manutencao Geral", "repetida dentro do proprio arquivo", "Nao", 1500, 1500],

  // 12. Sem descrição, mas com fornecedor: o nome do fornecedor é usado.
  [d("2026-10-15"), "", d("2026-09-09"), d("2026-09-01"), "Despesa", "99.000.111/0001-69",
   "4595", "Debito automatico", "Energia Litoral S.A.", "", "",
   "Administrativo", "Energia Eletrica", "sem descricao - usa o fornecedor", "Mensal", 4320.9, ""],
];

const LEIA_ME = [
  ["PLANILHA FICTICIA - SOMENTE PARA HOMOLOGACAO"],
  [""],
  ["Este arquivo NAO e, e nao representa, a exportacao real de despesas da AutEM."],
  ["Nenhum arquivo real de exportacao da AutEM foi recebido ate a data de geracao deste arquivo."],
  [""],
  ["As colunas reproduzem apenas a LISTA DE CAMPOS informada pelo Vitor, numa grafia plausivel,"],
  ["para permitir construir e testar o importador antes de termos o arquivo verdadeiro."],
  [""],
  ["Fornecedores, CNPJs, numeros de nota e valores sao inventados. Nenhum dado real da ASA"],
  ["aparece aqui, conforme a politica de dados ficticios do projeto."],
  [""],
  ["Quando o arquivo real chegar: comparar os cabecalhos com frontend/src/lib/importacao/mapeamento.ts,"],
  ["ajustar os apelidos aceitos, testar e validar com o Vitor."],
];

/** As mesmas abas usadas pelos testes — exportado para não duplicar a montagem. */
export function planilhasHomologacao() {
  return [
    { nome: "LEIA-ME (ficticia)", colunas: ["AVISO"], linhas: LEIA_ME },
    { nome: "Despesas", colunas: COLUNAS, linhas: LINHAS },
  ];
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
  console.log(`Planilha de homologacao (FICTICIA) gerada: ${caminho}`);
  console.log(`${LINHAS.length} linhas, ${COLUNAS.length} colunas.`);
}
