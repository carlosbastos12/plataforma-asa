/**
 * Equipe Operacional (Missão P033 — responde às dores 8, 9 e 10 de
 * docs/BUSINESS/VOZ_DO_CLIENTE.md, VDC-001): faltas, atestados e escala
 * hoje controlados manualmente. Dados 100% fictícios (D-005).
 */

export type StatusColaborador = "disponivel" | "em_rota" | "ausente" | "folga";

export interface Colaborador {
  nome: string;
  funcao: string;
  status: StatusColaborador;
}

export const EQUIPE: Colaborador[] = [
  { nome: "Renê Salgado", funcao: "Motorista de guincho", status: "em_rota" },
  { nome: "Otávio Bezerra", funcao: "Motorista de guincho", status: "disponivel" },
  { nome: "Cassiano Freire", funcao: "Motorista de guincho", status: "disponivel" },
  { nome: "Denise Coutinho", funcao: "Motorista de apoio", status: "disponivel" },
  { nome: "Théo Aragão", funcao: "Motorista de guincho", status: "ausente" },
  { nome: "Iolanda Prado", funcao: "Motorista de guincho", status: "disponivel" },
  { nome: "Ivo Marreiros", funcao: "Motorista de apoio", status: "folga" },
  { nome: "Samuel Braga", funcao: "Motociclista de apoio", status: "disponivel" },
  { nome: "Murilo Tavares", funcao: "Motociclista de apoio", status: "disponivel" },
  { nome: "Lívia Nunes", funcao: "Motorista de apoio", status: "disponivel" },
];

export type TipoAusencia = "falta" | "atestado";

export interface Ausencia {
  id: string;
  colaborador: string;
  tipo: TipoAusencia;
  dataInicio: string;
  dataFim: string;
  motivo: string;
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
];

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

export function ausenciasAtivas(): Ausencia[] {
  return AUSENCIAS;
}

export function ausenciasComImpactoNaEscala(): Ausencia[] {
  return AUSENCIAS.filter((a) => a.impactaEscala);
}

export function turnosEmAberto(): TurnoEscala[] {
  return ESCALA.filter((t) => t.status === "em_aberto");
}

export function disponiveisAgora(): Colaborador[] {
  return EQUIPE.filter((c) => c.status === "disponivel");
}
