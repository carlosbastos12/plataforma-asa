/**
 * Camada de leitura executiva sobre o dataset fictício.
 *
 * Nada aqui altera regra de negócio nem dado — são apenas derivações de
 * apresentação calculadas a partir de `mock-data.ts`, para que as telas
 * respondam perguntas ("posso operar?", "o que está em risco?") em vez de
 * despejar registros.
 */

import {
  FROTA,
  CAIXA,
  CHAMADOS_ATIVOS,
  situacaoVeiculo,
  statusVencimento,
  diasRestantes,
  formatarData,
  type Veiculo,
  type DocStatus,
} from "./mock-data";

/* ---------------- Glossário de siglas (regra: nenhuma sigla sem explicação) ---------------- */

export const GLOSSARIO: Record<string, string> = {
  AET: "Autorização Especial de Trânsito — documento obrigatório para o guincho circular. Vencida, o veículo fica sujeito a multa e retenção.",
  AMC: "Órgão municipal de trânsito — autua e gerencia multas na cidade.",
  DETRAN: "Departamento Estadual de Trânsito — licenciamento e autuações estaduais.",
  DNIT: "Departamento Nacional de Infraestrutura de Transportes — autua em rodovias federais.",
  PRF: "Polícia Rodoviária Federal — fiscaliza e autua em rodovias federais.",
  IPVA: "Imposto anual sobre a propriedade do veículo. Em atraso, impede o licenciamento.",
  Licenciamento: "Registro anual obrigatório do veículo. Vencido, o veículo não pode circular.",
  Seguro: "Apólice do veículo. Vencida, qualquer ocorrência vira prejuízo direto.",
  Tacógrafo: "Registrador de velocidade e tempo, obrigatório em caminhões. A aferição tem validade e precisa ser renovada.",
};

/** Explica um tipo de documento composto (ex.: "AET AMC") juntando as siglas conhecidas. */
export function explicarDocumento(tipo: string): string {
  const partes = tipo.split(" ").map((p) => GLOSSARIO[p]).filter(Boolean);
  return partes[0] ?? GLOSSARIO[tipo] ?? tipo;
}

/* ---------------- Pessoas ---------------- */

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/* ---------------- Indicadores executivos ---------------- */

export interface Indicadores {
  /** Soma das multas aguardando indicação de condutor. */
  valorEmRisco: number;
  multasAguardando: number;
  /** Veículos sem nenhuma pendência vencida (podem operar sem risco imediato). */
  frotaApta: number;
  frotaTotal: number;
  veiculosCriticos: number;
  docsVencidos: number;
  docsVencendo: number;
  chamadosAguardando: number;
  /** Saldo do dia mais recente do caixa. */
  saldoDoDia: number;
  caixasEmAberto: number;
}

export function calcularIndicadores(): Indicadores {
  const multasAbertas = FROTA.flatMap((v) => v.multas).filter((m) => m.status === "aguardando_indicacao");
  const docs = FROTA.flatMap((v) => v.docs.map((d) => statusVencimento(d.vencimento)));
  const criticos = FROTA.filter((v) => situacaoVeiculo(v) === "critico").length;

  const hoje = CAIXA[0];
  const saldo = hoje.lancamentos.reduce((acc, l) => acc + l.valor, 0);

  return {
    valorEmRisco: multasAbertas.reduce((acc, m) => acc + m.valor, 0),
    multasAguardando: multasAbertas.length,
    frotaApta: FROTA.length - criticos,
    frotaTotal: FROTA.length,
    veiculosCriticos: criticos,
    docsVencidos: docs.filter((s) => s === "critico").length,
    docsVencendo: docs.filter((s) => s === "atencao").length,
    chamadosAguardando: CHAMADOS_ATIVOS.filter((c) => c.status === "aguardando").length,
    saldoDoDia: saldo,
    caixasEmAberto: CAIXA.filter((c) => c.status === "aberto").length,
  };
}

/**
 * Contagens da navegação, com significado único e explicável:
 * apenas o que exige ação AGORA (vencidos e prazos estourando), nunca
 * misturado com itens "a acompanhar". A explicação acompanha o número
 * para o badge nunca ser um mistério.
 */
export interface ContagemSetor {
  total: number;
  explicacao: string;
}

export function contagensDaNavegacao(): Record<string, ContagemSetor> {
  const i = calcularIndicadores();
  return {
    "/acionamento": {
      total: i.chamadosAguardando,
      explicacao: `${i.chamadosAguardando} chamado(s) aguardando despacho`,
    },
    "/gestao-da-frota": {
      total: i.docsVencidos + i.multasAguardando,
      explicacao: `${i.docsVencidos} documento(s) vencido(s) + ${i.multasAguardando} multa(s) aguardando indicação`,
    },
    "/fechamento": {
      total: i.caixasEmAberto,
      explicacao: `${i.caixasEmAberto} caixa(s) ainda sem fechamento`,
    },
  };
}

/* ---------------- Veredicto do veículo: "pode operar hoje?" ---------------- */

export interface Veredicto {
  nivel: DocStatus;
  titulo: string;
  motivo: string;
  acao: string;
}

export function veredictoVeiculo(v: Veiculo): Veredicto {
  const docsVencidos = v.docs
    .filter((d) => statusVencimento(d.vencimento) === "critico")
    .sort((a, b) => diasRestantes(a.vencimento) - diasRestantes(b.vencimento));
  const multaAberta = v.multas.find((m) => m.status === "aguardando_indicacao");

  if (docsVencidos.length > 0) {
    const doc = docsVencidos[0];
    const dias = Math.abs(diasRestantes(doc.vencimento));
    const extras = docsVencidos.length - 1;
    return {
      nivel: "critico",
      titulo: "Este veículo não deve operar hoje",
      motivo: `${doc.tipo} vencido há ${dias} dia(s)${extras > 0 ? ` — e mais ${extras} documento(s) vencido(s)` : ""}. Circular assim sujeita a multa e retenção.`,
      acao: `Renovar ${doc.tipo} para liberar o veículo com segurança.`,
    };
  }

  if (multaAberta) {
    const prazo = multaAberta.prazoIndicacao ? diasRestantes(multaAberta.prazoIndicacao) : null;
    return {
      nivel: "critico",
      titulo: "Este veículo pode operar, mas há prejuízo à vista",
      motivo: `Multa de ${multaAberta.orgao} aguardando indicação de condutor${prazo !== null ? ` — restam ${prazo} dia(s) de prazo` : ""}. Sem indicação, o valor pode dobrar.`,
      acao: "Indicar o condutor dentro do prazo para evitar agravamento.",
    };
  }

  const proximosDocs = v.docs
    .map((d) => ({ ...d, dias: diasRestantes(d.vencimento) }))
    .sort((a, b) => a.dias - b.dias);
  const proximo = proximosDocs[0];

  if (proximo && statusVencimento(proximo.vencimento) === "atencao") {
    return {
      nivel: "atencao",
      titulo: "Apto para operar — com um prazo se aproximando",
      motivo: `${proximo.tipo} vence em ${proximo.dias} dia(s), em ${formatarData(proximo.vencimento)}.`,
      acao: "Programar a renovação agora evita parar o veículo depois.",
    };
  }

  return {
    nivel: "regular",
    titulo: "Apto para operar",
    motivo: proximo
      ? `Toda a documentação em dia. Próximo vencimento: ${proximo.tipo} em ${proximo.dias} dia(s).`
      : "Toda a documentação em dia.",
    acao: "Nenhuma ação necessária hoje.",
  };
}
