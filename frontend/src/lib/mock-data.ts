/**
 * Dataset fictício da Central de Operações — Plataforma ASA.
 *
 * Proveniência: TODO o conteúdo abaixo (placas, nomes, parceiros, valores,
 * datas, protocolos) foi inventado para esta demonstração. Nenhum dado vem
 * da Auditoria-ASA — política registrada em `../../../DECISIONS.md` (D-005)
 * e reforçada explicitamente para a Fase 1.
 *
 * "Hoje" é fixado em uma data de referência para a demonstração ser sempre
 * consistente, independente de quando for aberta.
 */

export const TODAY = new Date("2026-08-17T08:00:00");

export type DocStatus = "critico" | "atencao" | "regular";

export interface DocumentoFrota {
  tipo: "AET AMC" | "AET DETRAN" | "IPVA" | "Licenciamento" | "Seguro" | "Tacógrafo";
  emissao: string;
  vencimento: string;
}

export interface Multa {
  id: string;
  orgao: "AMC" | "DETRAN" | "DNIT" | "PRF";
  data: string;
  valor: number;
  status: "aguardando_indicacao" | "indicada" | "paga";
  prazoIndicacao?: string;
}

export type TipoManutencao = "preventiva" | "corretiva";
export type StatusManutencao = "concluida" | "em_andamento";
/** "estoque_proprio" = retirada do Almoxarifado da ASA; "compra_manutencao" = comprada especificamente para este serviço, sem passar pelo estoque. */
export type OrigemPeca = "estoque_proprio" | "compra_manutencao";
/** "propria" = feito pela equipe mecânica da ASA (sem custo de mão de obra); "terceirizada" = oficina/prestador externo. */
export type OrigemServico = "propria" | "terceirizada";

export interface PecaManutencao {
  nome: string;
  /** Código do item no Almoxarifado (ex.: "FIL-001") quando origem é estoque_proprio; opcional para compra_manutencao. */
  codigo?: string;
  qtd: number;
  valorUnitario: number;
  origem: OrigemPeca;
  fornecedor?: string;
  observacao?: string;
}

export interface ServicoManutencao {
  descricao: string;
  origem: OrigemServico;
  /** Serviço próprio nunca tem custo financeiro — só terceirizado gera valor (ver totalServicosTerceirizados). */
  valor: number;
  /** Nome da oficina/prestador externo, só relevante quando origem é terceirizada. */
  prestador?: string;
}

/**
 * Uma manutenção representa um serviço realizado em UM veículo — registro
 * plano (não aninhado em Veiculo) para servir tanto o módulo Manutenção
 * (todas as manutenções da frota) quanto o histórico de um veículo
 * específico (manutencoesPorPlaca), sem duplicar dado.
 */
export interface Manutencao {
  id: string;
  placa: string;
  data: string;
  km: number;
  tipo: TipoManutencao;
  descricao: string;
  status: StatusManutencao;
  pecas: PecaManutencao[];
  servicos: ServicoManutencao[];
}

/**
 * Controle preventivo por quilometragem (ex.: troca de óleo). Conceito de
 * demonstração (P0xx): compara a última troca + intervalo previsto com a
 * quilometragem atual do veículo. Não há atualização automática de km —
 * isso é conceito futuro, não implementado nesta fase.
 */
export interface ManutencaoPreventiva {
  servico: string;
  ultimaTrocaKm: number;
  intervaloKm: number;
}

export interface Veiculo {
  placa: string;
  modelo: string;
  ano: number;
  categoria: "Caminhão" | "Moto" | "Utilitário";
  motorista: string;
  km: number;
  docs: DocumentoFrota[];
  multas: Multa[];
  preventivas: ManutencaoPreventiva[];
}

function dias(dataISO: string): number {
  const d = new Date(dataISO + "T00:00:00");
  return Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
}

export function statusVencimento(dataISO: string): DocStatus {
  const d = dias(dataISO);
  if (d < 0) return "critico";
  if (d <= 15) return "atencao";
  return "regular";
}

export function formatarData(dataISO: string): string {
  const [y, m, d] = dataISO.split("-");
  return `${d}/${m}/${y}`;
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function diasRestantes(dataISO: string): number {
  return dias(dataISO);
}

export function proximaTrocaKm(p: ManutencaoPreventiva): number {
  return p.ultimaTrocaKm + p.intervaloKm;
}

export function kmRestantes(atualKm: number, p: ManutencaoPreventiva): number {
  return proximaTrocaKm(p) - atualKm;
}

/**
 * "Vencida" (km atual já passou da próxima troca), "atenção" (dentro dos
 * últimos 30% do intervalo) ou "em dia" — mesmo semáforo de DocStatus,
 * só que por quilometragem em vez de data.
 */
export function statusPreventiva(atualKm: number, p: ManutencaoPreventiva): DocStatus {
  const restante = kmRestantes(atualKm, p);
  if (restante < 0) return "critico";
  if (restante <= p.intervaloKm * 0.3) return "atencao";
  return "regular";
}

/* ---------------- Estoque de Peças (Almoxarifado da oficina própria) ---------------- */

export type UnidadeMedida = "unidade" | "litro" | "jogo" | "caixa" | "outro";

export const UNIDADES_MEDIDA: { valor: UnidadeMedida; label: string; sigla: string }[] = [
  { valor: "unidade", label: "Unidade", sigla: "un." },
  { valor: "litro", label: "Litro", sigla: "L" },
  { valor: "jogo", label: "Jogo", sigla: "jogo(s)" },
  { valor: "caixa", label: "Caixa", sigla: "cx." },
  { valor: "outro", label: "Outro", sigla: "un." },
];

export interface ItemAlmoxarifado {
  /** Código do item, ex.: "FIL-001" — mesmo valor usado em PecaManutencao.codigo. */
  id: string;
  nome: string;
  /** Texto livre — cadastrada pelo usuário, sem lista fechada. */
  categoria: string;
  unidade: UnidadeMedida;
  quantidade: number;
  quantidadeMinima: number;
  /**
   * Custo da peça para a ASA (não é preço de venda) — usado para calcular o
   * consumo nas manutenções. Cada PecaManutencao guarda o valor no momento
   * em que a peça foi usada, então mudar este campo aqui NUNCA reescreve o
   * custo de uma manutenção já registrada (ver D-054).
   */
  valorUnitario: number;
  armario: string;
  prateleira: string;
  caixa: string;
  localizacaoDescricao: string;
}

export const ALMOXARIFADO: ItemAlmoxarifado[] = [
  { id: "LUB-001", nome: "Óleo motor 15W40 (20L)", categoria: "Lubrificantes", unidade: "unidade", quantidade: 8, quantidadeMinima: 5, valorUnitario: 535, armario: "A1", prateleira: "P01", caixa: "C01", localizacaoDescricao: "Armário A1 — Lubrificantes" },
  { id: "LUB-002", nome: "Graxa multiuso (bisnaga)", categoria: "Lubrificantes", unidade: "unidade", quantidade: 12, quantidadeMinima: 4, valorUnitario: 24, armario: "A1", prateleira: "P02", caixa: "C03", localizacaoDescricao: "Armário A1 — Lubrificantes" },
  { id: "FIL-001", nome: "Filtro de óleo", categoria: "Filtros", unidade: "unidade", quantidade: 3, quantidadeMinima: 6, valorUnitario: 80, armario: "B2", prateleira: "P02", caixa: "C04", localizacaoDescricao: "Armário B2 — Filtros" },
  { id: "FIL-002", nome: "Filtro de combustível", categoria: "Filtros", unidade: "unidade", quantidade: 5, quantidadeMinima: 4, valorUnitario: 120, armario: "B2", prateleira: "P03", caixa: "C01", localizacaoDescricao: "Armário B2 — Filtros" },
  { id: "FRE-001", nome: "Pastilha de freio dianteira (jogo)", categoria: "Freios", unidade: "jogo", quantidade: 2, quantidadeMinima: 3, valorUnitario: 340, armario: "C3", prateleira: "P01", caixa: "C02", localizacaoDescricao: "Armário C3 — Freios" },
  { id: "FRE-002", nome: "Disco de freio dianteiro", categoria: "Freios", unidade: "unidade", quantidade: 0, quantidadeMinima: 2, valorUnitario: 390, armario: "C3", prateleira: "P02", caixa: "C01", localizacaoDescricao: "Armário C3 — Freios" },
  { id: "PNE-001", nome: "Pneu 295/80 R22.5", categoria: "Pneus", unidade: "unidade", quantidade: 4, quantidadeMinima: 4, valorUnitario: 1650, armario: "D1", prateleira: "-", caixa: "-", localizacaoDescricao: "Depósito externo — Pátio de pneus" },
  { id: "MOT-001", nome: "Correia dentada", categoria: "Motor", unidade: "unidade", quantidade: 6, quantidadeMinima: 2, valorUnitario: 165, armario: "B4", prateleira: "P01", caixa: "C02", localizacaoDescricao: "Armário B4 — Motor" },
];

/** Mesmo semáforo de estoque usado no tanque de diesel (lib/combustivel.ts), aplicado a peças. */
export function statusEstoque(item: ItemAlmoxarifado): DocStatus {
  if (item.quantidade <= 0) return "critico";
  if (item.quantidade <= item.quantidadeMinima) return "atencao";
  return "regular";
}

/** Forma compacta "B2 / P02 / C04" da localização física do item. */
export function localizacaoCompacta(item: ItemAlmoxarifado): string {
  return `${item.armario} / ${item.prateleira} / ${item.caixa}`;
}

export type TipoMovimentacaoEstoque = "entrada" | "saida" | "ajuste";

export interface MovimentacaoEstoque {
  id: string;
  data: string;
  tipo: TipoMovimentacaoEstoque;
  /** Código do item no Almoxarifado (ItemAlmoxarifado.id). */
  itemId: string;
  quantidade: number;
  /** Ex.: "Manutenção KPT9F03" — presente em saídas para manutenção. */
  destino?: string;
  observacao?: string;
}

/**
 * Histórico fictício de movimentações — conceito de demonstração, sem
 * baixa real: o saldo de ALMOXARIFADO acima não é recalculado a partir
 * daqui (ver nota na tela de Movimentações).
 */
export const MOVIMENTACOES_ESTOQUE: MovimentacaoEstoque[] = [
  { id: "MV-001", data: "2026-08-05", tipo: "saida", itemId: "LUB-001", quantidade: 1, destino: "Manutenção MWZ5H61" },
  { id: "MV-002", data: "2026-08-05", tipo: "saida", itemId: "FIL-001", quantidade: 1, destino: "Manutenção MWZ5H61" },
  { id: "MV-003", data: "2026-08-10", tipo: "saida", itemId: "PNE-001", quantidade: 2, destino: "Manutenção KPT9F03" },
  { id: "MV-004", data: "2026-07-15", tipo: "saida", itemId: "FRE-001", quantidade: 1, destino: "Manutenção VYX1E92" },
  { id: "MV-005", data: "2026-07-15", tipo: "saida", itemId: "FRE-002", quantidade: 2, destino: "Manutenção VYX1E92" },
  { id: "MV-006", data: "2026-08-02", tipo: "entrada", itemId: "LUB-001", quantidade: 10, observacao: "Compra mensal — fornecedor Auto Peças Meridiano" },
  { id: "MV-007", data: "2026-08-08", tipo: "entrada", itemId: "FIL-001", quantidade: 6, observacao: "Reposição de estoque baixo" },
  { id: "MV-008", data: "2026-08-13", tipo: "ajuste", itemId: "FRE-002", quantidade: -1, observacao: "Peça avariada no transporte — baixa no estoque" },
];

export const FROTA: Veiculo[] = [
  {
    placa: "RDX4A17",
    modelo: "Volvo FH 460",
    ano: 2023,
    categoria: "Caminhão",
    motorista: "Renê Salgado",
    km: 81_400,
    docs: [
      { tipo: "AET AMC", emissao: "2025-08-10", vencimento: "2026-08-10" },
      { tipo: "Seguro", emissao: "2025-12-02", vencimento: "2026-12-02" },
      { tipo: "IPVA", emissao: "2026-02-01", vencimento: "2027-02-01" },
      { tipo: "Licenciamento", emissao: "2026-04-18", vencimento: "2027-04-18" },
      { tipo: "Tacógrafo", emissao: "2026-03-05", vencimento: "2026-09-05" },
    ],
    multas: [
      { id: "MU-2201", orgao: "AMC", data: "2026-08-02", valor: 267.9, status: "aguardando_indicacao", prazoIndicacao: "2026-08-19" },
    ],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 70_000, intervaloKm: 10_000 }],
  },
  {
    placa: "BLN2C88",
    modelo: "Mercedes-Benz Atego",
    ano: 2021,
    categoria: "Caminhão",
    motorista: "Otávio Bezerra",
    km: 142_300,
    docs: [
      { tipo: "Seguro", emissao: "2025-08-23", vencimento: "2026-08-23" },
      { tipo: "AET DETRAN", emissao: "2026-02-11", vencimento: "2026-08-11" },
      { tipo: "AET AMC", emissao: "2025-10-02", vencimento: "2026-10-02" },
      { tipo: "IPVA", emissao: "2026-01-30", vencimento: "2027-01-30" },
      { tipo: "Licenciamento", emissao: "2026-05-06", vencimento: "2027-05-06" },
      { tipo: "Tacógrafo", emissao: "2026-02-27", vencimento: "2026-08-27" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 135_000, intervaloKm: 10_000 }],
  },
  {
    placa: "KPT9F03",
    modelo: "Volkswagen Constellation",
    ano: 2020,
    categoria: "Caminhão",
    motorista: "Cassiano Freire",
    km: 198_700,
    docs: [
      { tipo: "Tacógrafo", emissao: "2026-02-03", vencimento: "2026-08-03" },
      { tipo: "Licenciamento", emissao: "2025-08-14", vencimento: "2026-08-14" },
      { tipo: "Seguro", emissao: "2025-11-19", vencimento: "2026-11-19" },
      { tipo: "AET AMC", emissao: "2026-04-22", vencimento: "2027-04-22" },
      { tipo: "AET DETRAN", emissao: "2025-11-30", vencimento: "2026-11-30" },
      { tipo: "IPVA", emissao: "2026-02-05", vencimento: "2027-02-05" },
    ],
    multas: [
      { id: "MU-2196", orgao: "DNIT", data: "2026-07-20", valor: 880.41, status: "paga" },
    ],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 185_000, intervaloKm: 10_000 }],
  },
  {
    placa: "MWZ5H61",
    modelo: "Volkswagen Delivery",
    ano: 2024,
    categoria: "Caminhão",
    motorista: "Ivo Marreiros",
    km: 39_200,
    docs: [
      { tipo: "Seguro", emissao: "2025-09-14", vencimento: "2026-09-14" },
      { tipo: "AET AMC", emissao: "2026-03-01", vencimento: "2027-03-01" },
      { tipo: "AET DETRAN", emissao: "2026-03-20", vencimento: "2026-09-20" },
      { tipo: "IPVA", emissao: "2026-01-28", vencimento: "2027-01-28" },
      { tipo: "Licenciamento", emissao: "2026-06-02", vencimento: "2027-06-02" },
      { tipo: "Tacógrafo", emissao: "2026-05-01", vencimento: "2026-11-01" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 35_000, intervaloKm: 10_000 }],
  },
  {
    placa: "TCV3B29",
    modelo: "Fiat Toro",
    ano: 2023,
    categoria: "Utilitário",
    motorista: "Denise Coutinho",
    km: 28_600,
    docs: [
      { tipo: "IPVA", emissao: "2025-08-22", vencimento: "2026-08-22" },
      { tipo: "Seguro", emissao: "2025-11-05", vencimento: "2026-11-05" },
      { tipo: "Licenciamento", emissao: "2026-03-01", vencimento: "2027-03-01" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 25_000, intervaloKm: 10_000 }],
  },
  {
    placa: "OGN7D14",
    modelo: "Honda CG 160",
    ano: 2024,
    categoria: "Moto",
    motorista: "Samuel Braga",
    km: 12_900,
    docs: [
      { tipo: "Licenciamento", emissao: "2025-08-19", vencimento: "2026-08-19" },
      { tipo: "Seguro", emissao: "2025-12-10", vencimento: "2026-12-10" },
      { tipo: "IPVA", emissao: "2026-02-02", vencimento: "2027-02-02" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 10_000, intervaloKm: 4_000 }],
  },
  {
    placa: "VYX1E92",
    modelo: "Mercedes-Benz Atego",
    ano: 2019,
    categoria: "Caminhão",
    motorista: "Théo Aragão",
    km: 227_100,
    docs: [
      { tipo: "AET AMC", emissao: "2025-08-05", vencimento: "2026-08-05" },
      { tipo: "Seguro", emissao: "2025-09-09", vencimento: "2026-09-09" },
      { tipo: "AET DETRAN", emissao: "2026-02-19", vencimento: "2026-08-19" },
      { tipo: "IPVA", emissao: "2026-02-08", vencimento: "2027-02-08" },
      { tipo: "Licenciamento", emissao: "2026-06-15", vencimento: "2027-06-15" },
      { tipo: "Tacógrafo", emissao: "2026-01-28", vencimento: "2026-07-28" },
    ],
    multas: [
      { id: "MU-2205", orgao: "DETRAN", data: "2026-08-05", valor: 195.23, status: "aguardando_indicacao", prazoIndicacao: "2026-08-20" },
    ],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 215_000, intervaloKm: 10_000 }],
  },
  {
    placa: "HQF6K05",
    modelo: "Volvo FH 460",
    ano: 2022,
    categoria: "Caminhão",
    motorista: "Iolanda Prado",
    km: 108_500,
    docs: [
      { tipo: "Seguro", emissao: "2025-11-24", vencimento: "2026-11-24" },
      { tipo: "AET AMC", emissao: "2026-03-27", vencimento: "2027-03-27" },
      { tipo: "AET DETRAN", emissao: "2026-02-24", vencimento: "2026-08-24" },
      { tipo: "IPVA", emissao: "2026-01-26", vencimento: "2027-01-26" },
      { tipo: "Licenciamento", emissao: "2026-04-30", vencimento: "2027-04-30" },
      { tipo: "Tacógrafo", emissao: "2026-05-10", vencimento: "2026-11-10" },
    ],
    multas: [
      { id: "MU-2158", orgao: "AMC", data: "2026-05-30", valor: 195.23, status: "paga" },
    ],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 100_000, intervaloKm: 10_000 }],
  },
  {
    placa: "ZBR8L37",
    modelo: "Honda CG 160",
    ano: 2023,
    categoria: "Moto",
    motorista: "Murilo Tavares",
    km: 24_100,
    docs: [
      { tipo: "Licenciamento", emissao: "2025-09-08", vencimento: "2026-09-08" },
      { tipo: "Seguro", emissao: "2025-10-27", vencimento: "2026-10-27" },
      { tipo: "IPVA", emissao: "2026-01-31", vencimento: "2027-01-31" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 21_000, intervaloKm: 4_000 }],
  },
  {
    placa: "JMT2P74",
    modelo: "Jeep Compass",
    ano: 2024,
    categoria: "Utilitário",
    motorista: "Lívia Nunes",
    km: 19_300,
    docs: [
      { tipo: "Seguro", emissao: "2025-09-02", vencimento: "2026-09-02" },
      { tipo: "IPVA", emissao: "2026-01-19", vencimento: "2027-01-19" },
      { tipo: "Licenciamento", emissao: "2026-04-14", vencimento: "2027-04-14" },
    ],
    multas: [],
    preventivas: [{ servico: "Troca de óleo", ultimaTrocaKm: 15_000, intervaloKm: 10_000 }],
  },
];

/* ---------------- Manutenções (módulo próprio — peças + serviços por manutenção) ---------------- */

export const MANUTENCOES: Manutencao[] = [
  {
    id: "MN-001",
    placa: "RDX4A17",
    data: "2026-07-28",
    km: 80_900,
    tipo: "preventiva",
    descricao: "Revisão preventiva de 80.000 km",
    status: "concluida",
    pecas: [
      { nome: "Óleo motor 15W40 (20L)", codigo: "LUB-001", qtd: 1, valorUnitario: 640, origem: "compra_manutencao", fornecedor: "Oficina Torque Certo" },
      { nome: "Filtro de óleo", codigo: "FIL-001", qtd: 1, valorUnitario: 85, origem: "compra_manutencao", fornecedor: "Oficina Torque Certo" },
      { nome: "Filtro de combustível", codigo: "FIL-002", qtd: 1, valorUnitario: 120, origem: "compra_manutencao", fornecedor: "Oficina Torque Certo" },
    ],
    servicos: [{ descricao: "Revisão preventiva 80.000 km", origem: "terceirizada", valor: 1335, prestador: "Oficina Torque Certo" }],
  },
  {
    id: "MN-002",
    placa: "BLN2C88",
    data: "2026-08-01",
    km: 141_900,
    tipo: "corretiva",
    descricao: "Alinhamento e balanceamento após ruído no volante",
    status: "concluida",
    pecas: [],
    servicos: [{ descricao: "Alinhamento e balanceamento", origem: "terceirizada", valor: 480, prestador: "Rota Norte Diesel" }],
  },
  {
    id: "MN-003",
    placa: "BLN2C88",
    data: "2026-07-10",
    km: 141_200,
    tipo: "preventiva",
    descricao: "Troca de óleo e filtro programada",
    status: "concluida",
    pecas: [
      { nome: "Óleo motor 15W40 (20L)", codigo: "LUB-001", qtd: 1, valorUnitario: 540, origem: "estoque_proprio" },
      { nome: "Filtro de óleo", codigo: "FIL-001", qtd: 1, valorUnitario: 80, origem: "estoque_proprio" },
    ],
    servicos: [{ descricao: "Troca de óleo e filtro", origem: "propria", valor: 0 }],
  },
  {
    id: "MN-004",
    placa: "KPT9F03",
    data: "2026-08-10",
    km: 197_900,
    tipo: "corretiva",
    descricao: "Pneus dianteiros com desgaste irregular",
    status: "concluida",
    pecas: [{ nome: "Pneu 295/80 R22.5", codigo: "PNE-001", qtd: 2, valorUnitario: 1650, origem: "estoque_proprio" }],
    servicos: [{ descricao: "Troca de pneus dianteiros", origem: "terceirizada", valor: 120, prestador: "Rota Norte Diesel" }],
  },
  {
    id: "MN-005",
    placa: "VYX1E92",
    data: "2026-07-15",
    km: 225_800,
    tipo: "corretiva",
    descricao: "Revisão do sistema de freios após vibração na frenagem",
    status: "concluida",
    pecas: [
      { nome: "Pastilha de freio dianteira (jogo)", codigo: "FRE-001", qtd: 1, valorUnitario: 340, origem: "estoque_proprio" },
      { nome: "Disco de freio dianteiro", codigo: "FRE-002", qtd: 2, valorUnitario: 390, origem: "estoque_proprio" },
    ],
    servicos: [{ descricao: "Revisão do sistema de freios", origem: "terceirizada", valor: 240, prestador: "Oficina Torque Certo" }],
  },
  {
    id: "MN-006",
    placa: "VYX1E92",
    data: "2026-08-14",
    km: 227_000,
    tipo: "corretiva",
    descricao: "Ruído estranho no motor — em diagnóstico na oficina própria",
    status: "em_andamento",
    pecas: [],
    servicos: [],
  },
  {
    id: "MN-007",
    placa: "MWZ5H61",
    data: "2026-08-05",
    km: 39_000,
    tipo: "preventiva",
    descricao: "Troca de óleo e filtro programada",
    status: "concluida",
    pecas: [
      { nome: "Óleo motor 15W40 (20L)", codigo: "LUB-001", qtd: 1, valorUnitario: 530, origem: "estoque_proprio" },
      { nome: "Filtro de óleo", codigo: "FIL-001", qtd: 1, valorUnitario: 80, origem: "estoque_proprio" },
    ],
    servicos: [{ descricao: "Troca de óleo e filtro", origem: "propria", valor: 0 }],
  },
  {
    id: "MN-008",
    placa: "HQF6K05",
    data: "2026-07-10",
    km: 107_800,
    tipo: "preventiva",
    descricao: "Troca de óleo e filtro programada",
    status: "concluida",
    pecas: [
      { nome: "Óleo motor 15W40 (20L)", codigo: "LUB-001", qtd: 1, valorUnitario: 535, origem: "estoque_proprio" },
      { nome: "Filtro de óleo", codigo: "FIL-001", qtd: 1, valorUnitario: 80, origem: "estoque_proprio" },
    ],
    servicos: [{ descricao: "Troca de óleo e filtro", origem: "propria", valor: 0 }],
  },
  {
    id: "MN-009",
    placa: "TCV3B29",
    data: "2026-08-12",
    km: 28_400,
    tipo: "corretiva",
    descricao: "Correia do alternador rompeu em operação",
    status: "concluida",
    pecas: [{ nome: "Correia do alternador", qtd: 1, valorUnitario: 185, origem: "compra_manutencao", fornecedor: "Auto Peças Meridiano" }],
    servicos: [{ descricao: "Substituição da correia do alternador", origem: "propria", valor: 0 }],
  },
];

export function totalPecas(m: Manutencao): number {
  return m.pecas.reduce((s, p) => s + p.qtd * p.valorUnitario, 0);
}

export function totalServicosTerceirizados(m: Manutencao): number {
  return m.servicos.filter((s) => s.origem === "terceirizada").reduce((s, sv) => s + sv.valor, 0);
}

export function totalManutencao(m: Manutencao): number {
  return totalPecas(m) + totalServicosTerceirizados(m);
}

/** Histórico de manutenções de UM veículo — usado no prontuário (aba "Manutenções"). */
export function manutencoesPorPlaca(placa: string): Manutencao[] {
  return MANUTENCOES.filter((m) => m.placa === placa).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function situacaoVeiculo(v: Veiculo): DocStatus {
  const severidades = v.docs.map((d) => statusVencimento(d.vencimento));
  const temMultaAguardando = v.multas.some((m) => m.status === "aguardando_indicacao");
  if (severidades.includes("critico") || temMultaAguardando) return "critico";
  if (severidades.includes("atencao")) return "atencao";
  return "regular";
}

/* ---------------- Caixa Particular (controle operacional) ---------------- */

export interface LancamentoCaixa {
  hora: string;
  tipo: "entrada" | "saida";
  descricao: string;
  placa: string | null;
  forma: "PIX" | "Cartão" | "Espécie";
  valor: number;
}

export interface DiaCaixa {
  data: string;
  status: "aberto" | "fechado";
  lancamentos: LancamentoCaixa[];
}

export const CAIXA: DiaCaixa[] = [
  {
    data: "2026-08-17",
    status: "aberto",
    lancamentos: [
      { hora: "08:20", tipo: "entrada", descricao: "Reboque — pane elétrica", placa: "BLN2C88", forma: "PIX", valor: 210 },
      { hora: "10:05", tipo: "entrada", descricao: "Remoção — pane seca", placa: "TCV3B29", forma: "Cartão", valor: 160 },
      { hora: "11:40", tipo: "saida", descricao: "Adiantamento para motorista", placa: null, forma: "Espécie", valor: -50 },
      { hora: "14:15", tipo: "entrada", descricao: "Reboque — pneu furado", placa: "HQF6K05", forma: "Espécie", valor: 130 },
    ],
  },
  {
    data: "2026-08-16",
    status: "aberto",
    lancamentos: [
      { hora: "09:30", tipo: "entrada", descricao: "Remoção — colisão leve", placa: "RDX4A17", forma: "PIX", valor: 320 },
      { hora: "15:50", tipo: "entrada", descricao: "Reboque — bateria", placa: "VYX1E92", forma: "Cartão", valor: 175 },
    ],
  },
  {
    data: "2026-08-15",
    status: "fechado",
    lancamentos: [
      { hora: "10:10", tipo: "entrada", descricao: "Remoção — pane mecânica", placa: "KPT9F03", forma: "PIX", valor: 290 },
      { hora: "16:20", tipo: "entrada", descricao: "Reboque — acidente", placa: "MWZ5H61", forma: "Espécie", valor: 410 },
    ],
  },
];

/* ---------------- Central de Operações: tarefas do dia ---------------- */

export interface TarefaDoDia {
  id: string;
  severidade: "critico" | "atencao";
  titulo: string;
  detalhe: string;
  href: string;
}

export function montarTarefasDoDia(): TarefaDoDia[] {
  const tarefas: TarefaDoDia[] = [];

  for (const v of FROTA) {
    for (const doc of v.docs) {
      const sev = statusVencimento(doc.vencimento);
      if (sev === "regular") continue;
      const d = diasRestantes(doc.vencimento);
      tarefas.push({
        id: `doc-${v.placa}-${doc.tipo}`,
        severidade: sev === "critico" ? "critico" : "atencao",
        titulo: `${doc.tipo} ${d < 0 ? "venceu" : "vence"} — ${v.placa}`,
        detalhe:
          d < 0
            ? `Venceu há ${Math.abs(d)} dia(s), em ${formatarData(doc.vencimento)}. Motorista: ${v.motorista}.`
            : `Vence em ${d} dia(s), em ${formatarData(doc.vencimento)}. Motorista: ${v.motorista}.`,
        href: `/gestao-da-frota/veiculos/${v.placa}`,
      });
    }
    for (const m of v.multas) {
      if (m.status !== "aguardando_indicacao" || !m.prazoIndicacao) continue;
      const d = diasRestantes(m.prazoIndicacao);
      tarefas.push({
        id: `multa-${m.id}`,
        severidade: d <= 3 ? "critico" : "atencao",
        titulo: `Multa aguardando indicação — ${v.placa}`,
        detalhe: `${m.orgao} · ${formatarMoeda(m.valor)} · prazo em ${d} dia(s). Motorista: ${v.motorista}.`,
        href: `/gestao-da-frota/multas`,
      });
    }
  }

  for (const c of CAIXA) {
    if (c.status !== "aberto") continue;
    const d = diasRestantes(c.data);
    if (d < -1) continue; // dias muito antigos não viram tarefa nova
    tarefas.push({
      id: `caixa-${c.data}`,
      severidade: "atencao",
      titulo: `Caixa de ${formatarData(c.data)} aguardando fechamento`,
      detalhe: `${c.lancamentos.length} lançamento(s) registrados, ainda sem conferência final.`,
      href: `/fechamento/caixa`,
    });
  }

  const ordem = { critico: 0, atencao: 1 } as const;
  tarefas.sort((a, b) => ordem[a.severidade] - ordem[b.severidade]);
  return tarefas;
}

/* ---------------- Parceiros/seguradoras (fictícios) ---------------- */

export const PARCEIROS = [
  { nome: "Zurique Proteção", atendimentos: 34, valor: 9840 },
  { nome: "Vetor Seguradora", atendimentos: 29, valor: 8120 },
  { nome: "Alto Mar Seguros", atendimentos: 21, valor: 6030 },
  { nome: "Constância Seguros", atendimentos: 17, valor: 4870 },
  { nome: "Rumo Certo Assistência", atendimentos: 12, valor: 3260 },
];

