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
  formatarMoeda,
  montarTarefasDoDia,
  type Veiculo,
  type DocStatus,
  type TarefaDoDia,
} from "./mock-data";
import { diasDeAutonomiaTanque, percentualTanque, estoqueAtualLitros } from "./combustivel";
import { ausenciasComImpactoNaEscala, turnosEmAberto, disponiveisAgora, EQUIPE } from "./equipe";

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

/* ---------------- Painéis do Dashboard (Clone do Protótipo 1) ---------------- */

export interface VencimentoLinha {
  placa: string;
  documento: string;
  vencimento: string;
  dias: number;
  status: DocStatus;
}

/** Próximos vencimentos entre toda a frota, ordenados por urgência. */
export function proximosVencimentos(limite = 6): VencimentoLinha[] {
  return FROTA.flatMap((v) =>
    v.docs.map((d) => ({
      placa: v.placa,
      documento: d.tipo,
      vencimento: d.vencimento,
      dias: diasRestantes(d.vencimento),
      status: statusVencimento(d.vencimento),
    }))
  )
    .sort((a, b) => a.dias - b.dias)
    .slice(0, limite);
}

/** Documentos que vencem em até `janela` dias (padrão 7), com detalhe por tipo. */
export function vencimentosCriticos(janela = 7): { total: number; detalhe: string } {
  const criticos = FROTA.flatMap((v) => v.docs)
    .map((d) => ({ tipo: d.tipo, dias: diasRestantes(d.vencimento) }))
    .filter((d) => d.dias <= janela);

  const porTipo = new Map<string, number>();
  for (const c of criticos) porTipo.set(c.tipo, (porTipo.get(c.tipo) ?? 0) + 1);
  const detalhe = Array.from(porTipo.entries())
    .map(([tipo, n]) => `${n} ${tipo}`)
    .join(" · ");

  return { total: criticos.length, detalhe: detalhe || "nenhum" };
}

/** Responsável fictício por tipo de documento — Logístico cuida de AET/Seguro/Tacógrafo, Administrativo de IPVA/Licenciamento. */
export function responsavelDocumento(tipo: string): string {
  if (tipo.includes("IPVA") || tipo === "Licenciamento") return "Administrativo — Gilvania";
  return "Logístico — Roberto";
}

/** Multas de toda a frota agrupadas por órgão autuador. */
export function multasPorOrgao(): { label: string; value: number }[] {
  const contagem = new Map<string, number>();
  for (const v of FROTA) {
    for (const m of v.multas) contagem.set(m.orgao, (contagem.get(m.orgao) ?? 0) + 1);
  }
  return Array.from(contagem.entries()).map(([label, value]) => ({ label, value }));
}

/* ---------------- Leitura da operação (home como assistente) ---------------- */

export type TomLeitura = "ok" | "atencao" | "critico";

export interface ItemLeitura {
  tom: TomLeitura;
  texto: string;
  href?: string;
}

/**
 * Traduz o estado da plataforma em frases prontas, como um assistente que já
 * leu tudo por você — nunca uma tabela de números crus. Cada frase cita o
 * dado que a sustenta, para nunca soar genérica.
 */
export function leituraOperacional(): ItemLeitura[] {
  const i = calcularIndicadores();
  const itens: ItemLeitura[] = [];

  const autonomia = diasDeAutonomiaTanque();
  itens.push({
    tom: autonomia <= 3 ? "critico" : autonomia <= 7 ? "atencao" : "ok",
    texto:
      autonomia <= 3
        ? `O estoque de diesel da base atende apenas mais ${autonomia} dia(s) — vale programar reposição.`
        : `O estoque de diesel da base atende aproximadamente mais ${autonomia} dias (${percentualTanque()}% do tanque).`,
    href: "/gestao-da-frota/combustivel",
  });

  if (i.docsVencidos > 0) {
    itens.push({
      tom: "critico",
      texto: `${i.docsVencidos} documento(s) já venceram e pedem regularização.`,
      href: "/gestao-da-frota/documentacao",
    });
  } else if (i.docsVencendo > 0) {
    itens.push({
      tom: "atencao",
      texto:
        i.docsVencendo === 1
          ? "Um documento vencerá em breve — ainda dá tempo de programar."
          : `${i.docsVencendo} documentos vencerão em breve — ainda dá tempo de programar.`,
      href: "/gestao-da-frota/documentacao",
    });
  } else {
    itens.push({ tom: "ok", texto: "Toda a documentação da frota segue regular." });
  }

  if (i.multasAguardando > 0) {
    itens.push({
      tom: "atencao",
      texto: `${i.multasAguardando} multa(s) aguardam indicação de condutor, somando ${formatarMoeda(i.valorEmRisco)}.`,
      href: "/gestao-da-frota/multas",
    });
  } else {
    itens.push({ tom: "ok", texto: "Não existem multas pendentes de indicação." });
  }

  const ausencias = ausenciasComImpactoNaEscala();
  if (ausencias.length > 0) {
    const a = ausencias[0];
    itens.push({
      tom: "atencao",
      texto: `Existe uma ausência registrada (${a.colaborador}) que poderá impactar a escala — ${a.substituto ? `${a.substituto} já cobre o turno` : "ainda sem substituto definido"}.`,
      href: "/equipe-operacional",
    });
  }

  const abertos = turnosEmAberto();
  if (abertos.length > 0) {
    itens.push({
      tom: "atencao",
      texto: `${abertos.length} turno(s) da escala seguem em aberto, sem colaborador definido.`,
      href: "/equipe-operacional",
    });
  }

  if (i.caixasEmAberto === 0) {
    itens.push({ tom: "ok", texto: "O fechamento segue sem divergências — todos os caixas conferidos." });
  }

  return itens;
}

/* ---------------- Dashboard executivo (P034) ---------------- */

export interface CardExecutivo {
  href: string;
  rotulo: string;
  valor: string;
  detalhe: string;
  tom: "ok" | "atencao" | "critico" | "neutro";
}

/**
 * Os seis números que a diretoria olha antes de qualquer lista — cada um
 * responde por si só "está tudo bem nessa frente?" (P034).
 */
export function indicadoresExecutivos(): CardExecutivo[] {
  const i = calcularIndicadores();
  const autonomia = diasDeAutonomiaTanque();
  const disponiveis = disponiveisAgora().length;

  return [
    {
      href: "/gestao-da-frota/veiculos",
      rotulo: "frota apta",
      valor: `${i.frotaApta}/${i.frotaTotal}`,
      detalhe: "veículos liberados para operar",
      tom: i.veiculosCriticos > 0 ? "neutro" : "ok",
    },
    {
      href: "/gestao-da-frota/veiculos",
      rotulo: "veículos indisponíveis",
      valor: String(i.veiculosCriticos),
      detalhe: i.veiculosCriticos > 0 ? "pendência vencida impede a operação" : "nenhum veículo parado",
      tom: i.veiculosCriticos > 0 ? "critico" : "ok",
    },
    {
      href: "/gestao-da-frota/documentacao",
      rotulo: "documentos próximos do vencimento",
      valor: String(i.docsVencendo),
      detalhe: "dentro da janela de 15 dias",
      tom: i.docsVencendo > 0 ? "atencao" : "ok",
    },
    {
      href: "/gestao-da-frota/combustivel",
      rotulo: "diesel disponível",
      valor: `${autonomia}d`,
      detalhe: `${estoqueAtualLitros().toLocaleString("pt-BR")} L no tanque da base`,
      tom: autonomia <= 3 ? "critico" : autonomia <= 7 ? "atencao" : "ok",
    },
    {
      href: "/equipe-operacional",
      rotulo: "equipe disponível",
      valor: `${disponiveis}/${EQUIPE.length}`,
      detalhe: "pronta para escala hoje",
      tom: disponiveis >= EQUIPE.length - 1 ? "ok" : "neutro",
    },
    {
      href: "/acionamento",
      rotulo: "chamados aguardando",
      valor: String(i.chamadosAguardando),
      detalhe: "esperando despacho de motorista",
      tom: i.chamadosAguardando > 2 ? "atencao" : "ok",
    },
  ];
}

/* ---------------- Decidir agora: no máximo 3, sempre com ação ---------------- */

export interface ItemDecisao {
  href: string;
  consequencia: string;
  motivo: string;
  acao: string;
}

function acaoParaTarefa(t: TarefaDoDia): string {
  if (t.id.startsWith("doc-")) return "Renovar o documento libera o veículo para voltar a operar.";
  if (t.id.startsWith("multa-")) return "Indicar o condutor agora evita que o valor da multa dobre.";
  return "Conferir e fechar o caixa evita divergência acumulada no fim do mês.";
}

/**
 * Nunca mais que 3 decisões por vez — o resto vira ruído. Cada uma responde
 * três perguntas: o que está em jogo (consequência), por que (motivo) e o
 * que fazer a respeito (ação), nunca apenas um status (P034).
 */
export function tarefasPrioritarias(limite = 3): ItemDecisao[] {
  return montarTarefasDoDia()
    .slice(0, limite)
    .map((t) => ({ href: t.href, consequencia: t.titulo, motivo: t.detalhe, acao: acaoParaTarefa(t) }));
}

/* ---------------- Tudo sob controle ---------------- */

export interface ItemControle {
  href: string;
  texto: string;
}

/**
 * O que já está em ordem — e continua sendo vigiado. Mostrado só depois das
 * decisões, nunca como forma de esconder um problema (P034).
 */
export function itensSobControle(): ItemControle[] {
  const docs = FROTA.flatMap((v) => v.docs);
  const docsEmDia = docs.filter((d) => statusVencimento(d.vencimento) === "regular").length;
  const aptos = FROTA.filter((v) => situacaoVeiculo(v) !== "critico").length;
  const disponiveis = disponiveisAgora().length;
  const autonomia = diasDeAutonomiaTanque();

  const itens: ItemControle[] = [
    { href: "/gestao-da-frota/documentacao", texto: `${docsEmDia} documentos em dia` },
    { href: "/gestao-da-frota/veiculos", texto: `${aptos} de ${FROTA.length} veículos liberados` },
  ];
  if (autonomia > 7) {
    itens.push({ href: "/gestao-da-frota/combustivel", texto: "Abastecimento dentro do normal" });
  }
  if (disponiveis === EQUIPE.length) {
    itens.push({ href: "/equipe-operacional", texto: "Equipe completa hoje" });
  }
  return itens;
}
