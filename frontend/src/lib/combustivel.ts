import { TODAY } from "./mock-data";

/**
 * Combustível (Missão P033 — responde às dores 5 e 15 de
 * docs/BUSINESS/VOZ_DO_CLIENTE.md, VDC-001): dois fluxos que hoje vivem
 * separados — o tanque da base e o abastecimento em posto durante viagem.
 * Dados 100% fictícios (D-005).
 */

export interface MovimentacaoTanque {
  data: string;
  hora: string;
  tipo: "entrada" | "saida";
  litros: number;
  descricao: string;
  placa?: string;
  responsavel: string;
}

export const TANQUE_BASE = {
  capacidadeLitros: 8000,
  estoqueLitros: 3120,
  consumoMedioDiarioLitros: 480,
  fornecedor: "Distribuidora Rota Sul",
  ultimaEntrada: "2026-08-12",
};

export const MOVIMENTACOES_TANQUE: MovimentacaoTanque[] = [
  { data: "2026-08-17", hora: "07:40", tipo: "saida", litros: 180, descricao: "Abastecimento antes da rota", placa: "RDX4A17", responsavel: "Renê Salgado" },
  { data: "2026-08-16", hora: "17:10", tipo: "saida", litros: 140, descricao: "Abastecimento antes da rota", placa: "BLN2C88", responsavel: "Otávio Bezerra" },
  { data: "2026-08-16", hora: "08:05", tipo: "saida", litros: 165, descricao: "Abastecimento antes da rota", placa: "VYX1E92", responsavel: "Théo Aragão" },
  { data: "2026-08-15", hora: "13:30", tipo: "saida", litros: 150, descricao: "Abastecimento antes da rota", placa: "KPT9F03", responsavel: "Cassiano Freire" },
  { data: "2026-08-12", hora: "09:00", tipo: "entrada", litros: 4000, descricao: "Recebimento de carga — NF 18420", responsavel: "Distribuidora Rota Sul" },
  { data: "2026-08-10", hora: "16:45", tipo: "saida", litros: 175, descricao: "Abastecimento antes da rota", placa: "HQF6K05", responsavel: "Iolanda Prado" },
];

export function diasDeAutonomiaTanque(): number {
  return Math.floor(TANQUE_BASE.estoqueLitros / TANQUE_BASE.consumoMedioDiarioLitros);
}

export function percentualTanque(): number {
  return Math.round((TANQUE_BASE.estoqueLitros / TANQUE_BASE.capacidadeLitros) * 100);
}

export interface AbastecimentoExterno {
  id: string;
  data: string;
  posto: string;
  motorista: string;
  placa: string;
  viagem: string;
  litros: number;
  valor: number;
}

export const ABASTECIMENTOS_EXTERNOS: AbastecimentoExterno[] = [
  { id: "AB-4410", data: "2026-08-16", posto: "Posto Estrela do Vale", motorista: "Renê Salgado", placa: "RDX4A17", viagem: "BR-116 — atendimento em rota", litros: 220, valor: 1320 },
  { id: "AB-4409", data: "2026-08-15", posto: "Posto Horizonte", motorista: "Cassiano Freire", placa: "KPT9F03", viagem: "Anel Viário — remoção", litros: 190, valor: 1148.5 },
  { id: "AB-4408", data: "2026-08-14", posto: "Posto Âncora", motorista: "Otávio Bezerra", placa: "BLN2C88", viagem: "Rodovia do Contorno — reboque", litros: 165, valor: 995.85 },
  { id: "AB-4407", data: "2026-08-12", posto: "Posto Estrela do Vale", motorista: "Théo Aragão", placa: "VYX1E92", viagem: "BR-116, km 40 — pane elétrica", litros: 210, valor: 1260 },
  { id: "AB-4406", data: "2026-08-10", posto: "Posto Horizonte", motorista: "Iolanda Prado", placa: "HQF6K05", viagem: "Av. Beira Rio — remoção", litros: 180, valor: 1080 },
];

export function totalLitrosExternos30dias(): number {
  return ABASTECIMENTOS_EXTERNOS.reduce((acc, a) => acc + a.litros, 0);
}

export function totalGastoExternos30dias(): number {
  return ABASTECIMENTOS_EXTERNOS.reduce((acc, a) => acc + a.valor, 0);
}

export function abastecimentosPorPlaca(placa: string): AbastecimentoExterno[] {
  return ABASTECIMENTOS_EXTERNOS.filter((a) => a.placa === placa);
}

export function referenciaData(): Date {
  return TODAY;
}
