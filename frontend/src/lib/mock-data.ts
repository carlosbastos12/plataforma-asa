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

export interface Manutencao {
  data: string;
  km: number;
  servico: string;
  oficina: string;
  valor: number;
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
  manutencoes: Manutencao[];
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
    manutencoes: [
      { data: "2026-07-28", km: 80_900, servico: "Revisão preventiva 80.000 km", oficina: "Oficina Torque Certo", valor: 2180 },
    ],
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
    manutencoes: [
      { data: "2026-08-01", km: 141_900, servico: "Alinhamento e balanceamento", oficina: "Rota Norte Diesel", valor: 480 },
    ],
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
    manutencoes: [
      { data: "2026-08-10", km: 197_900, servico: "Troca de pneus dianteiros", oficina: "Rota Norte Diesel", valor: 3420 },
    ],
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
    manutencoes: [],
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
    manutencoes: [],
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
    manutencoes: [],
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
    manutencoes: [
      { data: "2026-07-15", km: 225_800, servico: "Revisão do sistema de freios", oficina: "Oficina Torque Certo", valor: 1360 },
    ],
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
    manutencoes: [],
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
    manutencoes: [],
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
    manutencoes: [],
  },
];

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

/**
 * Contagem "ao vivo" por setor, usada nos indicadores da navegação e no
 * fluxo da Central de Operações. Cada setor mede sua própria urgência:
 * Acionamento = chamados ainda sem despacho; Gestão da Frota = documentos/
 * multas críticos; Fechamento = caixas do dia ainda em aberto.
 */
export function contarPendenciasPorSetor() {
  const tarefas = montarTarefasDoDia();
  return {
    acionamento: CHAMADOS_ATIVOS.filter((c) => c.status === "aguardando").length,
    gestaoDaFrota: tarefas.filter((t) => t.id.startsWith("doc-") || t.id.startsWith("multa-")).length,
    fechamento: tarefas.filter((t) => t.id.startsWith("caixa-")).length,
  };
}

/* ---------------- Parceiros/seguradoras (fictícios) ---------------- */

export const PARCEIROS = [
  { nome: "Zurique Proteção", atendimentos: 34, valor: 9840 },
  { nome: "Vetor Seguradora", atendimentos: 29, valor: 8120 },
  { nome: "Alto Mar Seguros", atendimentos: 21, valor: 6030 },
  { nome: "Constância Seguros", atendimentos: 17, valor: 4870 },
  { nome: "Rumo Certo Assistência", atendimentos: 12, valor: 3260 },
];

/* ---------------- Acionamento: chamados ativos (Missão 02) ----------------
   Setor responsável por receber o chamado, localizar motorista, despachar
   e acompanhar a execução. Dado fictício, criado do zero para esta missão —
   não deriva de nenhum registro da Auditoria-ASA. */

export type StatusChamado = "aguardando" | "despachado" | "em_atendimento" | "concluido";

export interface ChamadoAtivo {
  id: string;
  cliente: string;
  tipoServico: string;
  origem: string;
  placa: string | null;
  motorista: string | null;
  status: StatusChamado;
  horaAbertura: string;
}

export const CHAMADOS_ATIVOS: ChamadoAtivo[] = [
  { id: "CH-3141", cliente: "Zurique Proteção", tipoServico: "Reboque", origem: "BR-116, km 12", placa: "RDX4A17", motorista: "Renê Salgado", status: "em_atendimento", horaAbertura: "08:12" },
  { id: "CH-3142", cliente: "Particular", tipoServico: "Pane elétrica", origem: "Av. Litorânea, 480", placa: "TCV3B29", motorista: "Denise Coutinho", status: "em_atendimento", horaAbertura: "08:47" },
  { id: "CH-3143", cliente: "Vetor Seguradora", tipoServico: "Remoção", origem: "Rua das Acácias, 210", placa: "BLN2C88", motorista: "Otávio Bezerra", status: "despachado", horaAbertura: "09:05" },
  { id: "CH-3144", cliente: "Particular", tipoServico: "Troca de pneu", origem: "Anel Viário, km 4", placa: null, motorista: null, status: "aguardando", horaAbertura: "09:21" },
  { id: "CH-3145", cliente: "Alto Mar Seguros", tipoServico: "Reboque", origem: "Av. Beira Rio, 1200", placa: null, motorista: null, status: "aguardando", horaAbertura: "09:33" },
  { id: "CH-3146", cliente: "Constância Seguros", tipoServico: "Chaveiro", origem: "Praça Central, s/n", placa: "JMT2P74", motorista: "Lívia Nunes", status: "concluido", horaAbertura: "07:40" },
  { id: "CH-3147", cliente: "Particular", tipoServico: "Pane seca", origem: "Rod. do Contorno, km 8", placa: "HQF6K05", motorista: "Iolanda Prado", status: "concluido", horaAbertura: "07:15" },
];

export const STATUS_CHAMADO_LABEL: Record<StatusChamado, string> = {
  aguardando: "Aguardando despacho",
  despachado: "Despachado",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
};
