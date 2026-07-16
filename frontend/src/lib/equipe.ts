import { TODAY } from "./mock-data";

/**
 * Equipe Operacional (P033 → estendida na P037 — VDC-001 dores 8/9/10):
 * módulo operacional, não "RH" — uma falta, um atestado ou uma férias
 * mudam a capacidade da empresa de atender chamados, e é isso que a tela
 * demonstra. Dados 100% fictícios (D-005).
 */

export type StatusColaborador = "disponivel" | "em_rota" | "ausente" | "folga" | "ferias";

export const STATUS_COLABORADOR_LABEL: Record<StatusColaborador, string> = {
  disponivel: "Disponível",
  em_rota: "Em viagem",
  ausente: "Atestado",
  folga: "Folga",
  ferias: "Férias",
};

export type FuncaoColaborador = "Motorista" | "Operador" | "Apoio";

export interface Colaborador {
  id: string;
  nome: string;
  funcao: FuncaoColaborador;
  equipe: "Alfa" | "Bravo" | "Charlie";
  telefone: string;
  cnhCategoria: string;
  dataAdmissao: string;
  status: StatusColaborador;
}

export const EQUIPE: Colaborador[] = [
  { id: "C-01", nome: "Renê Salgado", funcao: "Motorista", equipe: "Alfa", telefone: "(85) 99101-2201", cnhCategoria: "E", dataAdmissao: "2022-03-14", status: "em_rota" },
  { id: "C-02", nome: "Otávio Bezerra", funcao: "Motorista", equipe: "Bravo", telefone: "(85) 99101-2202", cnhCategoria: "E", dataAdmissao: "2021-07-02", status: "disponivel" },
  { id: "C-03", nome: "Cassiano Freire", funcao: "Motorista", equipe: "Charlie", telefone: "(85) 99101-2203", cnhCategoria: "D", dataAdmissao: "2023-01-19", status: "disponivel" },
  { id: "C-04", nome: "Denise Coutinho", funcao: "Operador", equipe: "Alfa", telefone: "(85) 99101-2204", cnhCategoria: "B", dataAdmissao: "2022-11-05", status: "disponivel" },
  { id: "C-05", nome: "Théo Aragão", funcao: "Motorista", equipe: "Bravo", telefone: "(85) 99101-2205", cnhCategoria: "E", dataAdmissao: "2020-05-22", status: "ausente" },
  { id: "C-06", nome: "Iolanda Prado", funcao: "Operador", equipe: "Charlie", telefone: "(85) 99101-2206", cnhCategoria: "D", dataAdmissao: "2021-09-10", status: "disponivel" },
  { id: "C-07", nome: "Ivo Marreiros", funcao: "Apoio", equipe: "Alfa", telefone: "(85) 99101-2207", cnhCategoria: "B", dataAdmissao: "2024-02-01", status: "folga" },
  { id: "C-08", nome: "Samuel Braga", funcao: "Apoio", equipe: "Bravo", telefone: "(85) 99101-2208", cnhCategoria: "A", dataAdmissao: "2023-06-18", status: "disponivel" },
  { id: "C-09", nome: "Murilo Tavares", funcao: "Apoio", equipe: "Charlie", telefone: "(85) 99101-2209", cnhCategoria: "A", dataAdmissao: "2022-08-30", status: "disponivel" },
  { id: "C-10", nome: "Lívia Nunes", funcao: "Operador", equipe: "Bravo", telefone: "(85) 99101-2210", cnhCategoria: "B", dataAdmissao: "2021-12-12", status: "ferias" },
];

export function colaboradorPorId(id: string): Colaborador | undefined {
  return EQUIPE.find((c) => c.id === id);
}

/* ---------------- Ausências: falta, atestado, férias ---------------- */

export type TipoAusencia = "falta" | "atestado" | "ferias";

export const TIPO_AUSENCIA_LABEL: Record<TipoAusencia, string> = {
  falta: "Falta",
  atestado: "Atestado",
  ferias: "Férias",
};

export interface Ausencia {
  id: string;
  colaborador: string;
  tipo: TipoAusencia;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  cid?: string;
  temAnexo?: boolean;
  impactaEscala: boolean;
  substituto?: string;
}

export const AUSENCIAS: Ausencia[] = [
  {
    id: "AU-118",
    colaborador: "Théo Aragão",
    tipo: "atestado",
    dataInicio: "2026-08-16",
    dataFim: "2026-08-19",
    motivo: "Atestado médico",
    cid: "M54.5",
    temAnexo: true,
    impactaEscala: true,
    substituto: "Cassiano Freire",
  },
  {
    id: "AU-117",
    colaborador: "Ivo Marreiros",
    tipo: "falta",
    dataInicio: "2026-08-17",
    dataFim: "2026-08-17",
    motivo: "Folga compensatória",
    impactaEscala: false,
  },
  {
    id: "AU-116",
    colaborador: "Lívia Nunes",
    tipo: "ferias",
    dataInicio: "2026-08-10",
    dataFim: "2026-08-24",
    motivo: "Férias programadas",
    impactaEscala: true,
    substituto: "Denise Coutinho",
  },
];

export function ausenciasAtivas(): Ausencia[] {
  return AUSENCIAS;
}

export function ausenciasComImpactoNaEscala(): Ausencia[] {
  return AUSENCIAS.filter((a) => a.impactaEscala);
}

export function ausenciasPorColaborador(nome: string): Ausencia[] {
  return AUSENCIAS.filter((a) => a.colaborador === nome);
}

function diasEntre(dataISO: string): number {
  return Math.round((new Date(dataISO + "T00:00:00").getTime() - TODAY.getTime()) / 86_400_000);
}

export function diasRestantesAusencia(a: Ausencia): number {
  return diasEntre(a.dataFim);
}

/* ---------------- Escala operacional: quadro por turno ---------------- */

export type StatusTurno = "confirmado" | "substituicao" | "em_aberto";

export interface TurnoEscala {
  data: string;
  turno: "Manhã" | "Tarde" | "Noite";
  colaborador: string;
  status: StatusTurno;
}

export const ESCALA: TurnoEscala[] = [
  { data: "2026-08-17", turno: "Manhã", colaborador: "Renê Salgado", status: "confirmado" },
  { data: "2026-08-17", turno: "Tarde", colaborador: "Cassiano Freire", status: "substituicao" },
  { data: "2026-08-17", turno: "Noite", colaborador: "Otávio Bezerra", status: "confirmado" },
  { data: "2026-08-18", turno: "Manhã", colaborador: "Iolanda Prado", status: "confirmado" },
  { data: "2026-08-18", turno: "Tarde", colaborador: "Cassiano Freire", status: "substituicao" },
  { data: "2026-08-18", turno: "Noite", colaborador: "—", status: "em_aberto" },
  { data: "2026-08-19", turno: "Manhã", colaborador: "Denise Coutinho", status: "confirmado" },
];

export function turnosEmAberto(): TurnoEscala[] {
  return ESCALA.filter((t) => t.status === "em_aberto");
}

export function disponiveisAgora(): Colaborador[] {
  return EQUIPE.filter((c) => c.status === "disponivel");
}

/** O quadro da escala de hoje, uma coluna por turno, com o efetivo de cada equipe (P037). */
export interface CartaoEscala {
  turno: "Manhã" | "Tarde" | "Noite";
  equipe: Colaborador["equipe"];
  membros: Colaborador[];
}

const TURNO_POR_EQUIPE: Record<Colaborador["equipe"], "Manhã" | "Tarde" | "Noite"> = {
  Alfa: "Manhã",
  Bravo: "Tarde",
  Charlie: "Noite",
};

export function quadroDeEscala(colaboradores: Colaborador[] = EQUIPE): CartaoEscala[] {
  const equipes = Array.from(new Set(colaboradores.map((c) => c.equipe)));
  return equipes.map((equipe) => ({
    turno: TURNO_POR_EQUIPE[equipe],
    equipe,
    membros: colaboradores.filter((c) => c.equipe === equipe),
  }));
}

export function efetivoDisponivel(cartao: CartaoEscala): number {
  return cartao.membros.filter((m) => m.status === "disponivel" || m.status === "em_rota").length;
}

/* ---------------- Inteligência operacional ---------------- */

export interface InsightEquipe {
  texto: string;
  atencao?: boolean;
}

export function insightsEquipe(colaboradores: Colaborador[] = EQUIPE): InsightEquipe[] {
  const afastados = colaboradores.filter((c) => c.status === "ausente" || c.status === "ferias").length;
  const quadro = quadroDeEscala(colaboradores);
  const equipeReduzida = quadro.find((c) => efetivoDisponivel(c) <= 1);
  const disponivelParaSubstituicao = colaboradores.find((c) => c.status === "disponivel" && c.funcao === "Motorista");
  const aberto = turnosEmAberto()[0];

  const insights: InsightEquipe[] = [
    { texto: `${afastados} colaborador(es) afastados hoje (atestado ou férias).`, atencao: afastados > 0 },
    {
      texto: equipeReduzida ? `Equipe ${equipeReduzida.equipe} opera com efetivo reduzido.` : "Nenhuma equipe está com efetivo reduzido.",
      atencao: !!equipeReduzida,
    },
    {
      texto: disponivelParaSubstituicao
        ? `${disponivelParaSubstituicao.nome} está disponível para substituição, se precisar.`
        : "Nenhum motorista livre para substituição imediata.",
      atencao: !disponivelParaSubstituicao,
    },
    {
      texto: aberto ? `Escala de ${new Date(aberto.data + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long" })} ainda possui uma vaga em aberto (${aberto.turno}).` : "Todos os turnos da semana já têm cobertura.",
      atencao: !!aberto,
    },
  ];
  return insights;
}

/* ---------------- Alertas ---------------- */

export interface AlertaEquipe {
  texto: string;
}

export function alertasEquipe(colaboradores: Colaborador[] = EQUIPE, ausencias: Ausencia[] = AUSENCIAS): AlertaEquipe[] {
  const alertas: AlertaEquipe[] = [];
  const quadro = quadroDeEscala(colaboradores);
  for (const cartao of quadro) {
    if (efetivoDisponivel(cartao) <= 2) {
      alertas.push({ texto: `Equipe ${cartao.equipe} com apenas ${efetivoDisponivel(cartao)} colaborador(es) disponível(is).` });
    }
  }
  for (const a of ausencias) {
    const dias = diasRestantesAusencia(a);
    if (a.tipo === "atestado" && dias >= 0 && dias <= 3) {
      alertas.push({ texto: `Atestado de ${a.colaborador} termina em ${dias} dia(s).` });
    }
    if (a.tipo === "ferias" && dias >= 0 && dias <= 3) {
      alertas.push({ texto: `${a.colaborador} retorna das férias em ${dias} dia(s).` });
    }
  }
  const abertoSabado = turnosEmAberto()[0];
  if (abertoSabado) alertas.push({ texto: `Escala de ${formatarDiaSemana(abertoSabado.data)} ainda incompleta.` });
  return alertas;
}

function formatarDiaSemana(dataISO: string): string {
  return new Date(dataISO + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long" });
}

/* ---------------- Timeline de atividade recente ---------------- */

export interface AtividadeRecente {
  quando: string;
  texto: string;
}

export function timelineEquipe(): AtividadeRecente[] {
  return [
    { quando: "Hoje", texto: "Théo Aragão apresentou atestado médico." },
    { quando: "Hoje", texto: "Escala da noite de amanhã foi atualizada — turno em aberto." },
    { quando: "Ontem", texto: "Lívia Nunes iniciou período de férias." },
    { quando: "Ontem", texto: "Cassiano Freire cobriu o turno da tarde da Equipe Bravo." },
    { quando: "há 2 dias", texto: "Equipe Alfa recebeu Ivo Marreiros como novo colaborador de apoio." },
  ];
}

/* ---------------- Calendário mensal ---------------- */

export type TipoEventoCalendario = "folga" | "ferias" | "atestado" | "falta" | "treinamento" | "escala";

export interface EventoCalendario {
  data: string;
  tipo: TipoEventoCalendario;
  texto: string;
}

export function eventosCalendario(): EventoCalendario[] {
  const deAusencias: EventoCalendario[] = AUSENCIAS.flatMap((a) => {
    const inicio = new Date(a.dataInicio + "T00:00:00");
    const fim = new Date(a.dataFim + "T00:00:00");
    const dias: EventoCalendario[] = [];
    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      dias.push({
        data: d.toISOString().slice(0, 10),
        tipo: a.tipo === "ferias" ? "ferias" : a.tipo === "atestado" ? "atestado" : "falta",
        texto: `${a.colaborador} — ${TIPO_AUSENCIA_LABEL[a.tipo]}`,
      });
    }
    return dias;
  });

  const treinamentos: EventoCalendario[] = [
    { data: "2026-08-21", tipo: "treinamento", texto: "Treinamento de direção defensiva — Equipe Bravo" },
    { data: "2026-08-25", tipo: "treinamento", texto: "Reciclagem NR-11 — toda a equipe" },
  ];

  const folgas: EventoCalendario[] = [{ data: "2026-08-17", tipo: "folga", texto: "Ivo Marreiros — folga compensatória" }];

  const escalas: EventoCalendario[] = ESCALA.map((t) => ({ data: t.data, tipo: "escala" as const, texto: `${t.turno} — ${t.colaborador}` }));

  return [...deAusencias, ...treinamentos, ...folgas, ...escalas];
}
