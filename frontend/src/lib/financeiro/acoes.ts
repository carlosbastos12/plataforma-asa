"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import type { Documento, NaturezaConta, Periodicidade, TipoDocumento, TipoRecorrencia } from "./tipos";
import { podeCorrigirValor } from "./regras";

/** Bucket privado dos anexos financeiros (D-047/Etapa 4) — ver migration 0004. */
const BUCKET_DOCUMENTOS = "financeiro-documentos";
const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15 MB
const TIPOS_DOCUMENTO_VALIDOS = new Set<TipoDocumento>(["nf", "boleto", "comprovante", "outro"]);

/**
 * Content-Type de reserva, por extensão. O navegador quase sempre informa
 * o tipo do arquivo escolhido, mas quando não informa o Storage grava um
 * tipo genérico — e aí o "Visualizar" faria o navegador baixar em vez de
 * abrir. Só cobre as extensões aceitas pelo formulário.
 */
const TIPO_MIME_POR_EXTENSAO: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function tipoMime(arquivo: File): string | undefined {
  if (arquivo.type) return arquivo.type;
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
  return TIPO_MIME_POR_EXTENSAO[extensao];
}

export interface Resultado {
  ok: boolean;
  erro?: string;
}

const semBanco: Resultado = {
  ok: false,
  erro: "O banco de dados ainda não está configurado nesta instalação.",
};

/** "" → null, para o banco guardar ausência de valor em vez de string vazia. */
function ouNulo(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

export interface NovaContaInput {
  natureza: NaturezaConta;
  descricao: string;
  valorInicial: number;
  vencimento: string;
  fornecedorNome?: string;
  fornecedorCnpj?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  competencia?: string;
  estabelecimentoId?: string;
  classificacaoId?: string;
  /** Só para natureza particular — nunca enviado junto com classificacaoId/estabelecimentoId. */
  tipoDespesaParticularId?: string;
  formaPagamento?: string;
  recorrente?: boolean;
  recorrenciaTipo?: TipoRecorrencia | "";
  periodicidade?: Periodicidade | "";
  valorAproximado?: number | null;
  ocorrencias?: number | null;
  observacoes?: string;
  /** Texto contábil do lançamento (D-047) — só para natureza empresa, igual à classificação. */
  historico?: string;
  parcelas: { numero: number; valor: number; vencimento: string }[];
}

/**
 * Cadastra uma conta com suas parcelas, de forma atômica (RPC no banco).
 *
 * A natureza (Empresa/Particular) é obrigatória e não tem valor padrão:
 * é uma escolha consciente de quem cadastra, nunca um chute do sistema.
 */
export async function criarConta(dados: NovaContaInput): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  if (dados.natureza !== "empresa" && dados.natureza !== "particular") {
    return { ok: false, erro: "Informe se a conta é da empresa ou particular." };
  }
  if (!ouNulo(dados.descricao)) return { ok: false, erro: "A descrição é obrigatória." };
  if (!(dados.valorInicial > 0)) return { ok: false, erro: "O valor precisa ser maior que zero." };
  if (!ouNulo(dados.vencimento)) return { ok: false, erro: "O vencimento é obrigatório." };

  const parcelas =
    dados.parcelas.length > 0
      ? dados.parcelas
      : [{ numero: 1, valor: dados.valorInicial, vencimento: dados.vencimento }];

  const supabase = await criarClienteServidor();
  const parametros = {
    p_natureza: dados.natureza,
    p_descricao: dados.descricao.trim(),
    p_valor_inicial: dados.valorInicial,
    p_vencimento: dados.vencimento,
    p_parcelas: parcelas,
    p_fornecedor_nome: ouNulo(dados.fornecedorNome),
    p_fornecedor_cnpj: ouNulo(dados.fornecedorCnpj),
    p_numero_documento: ouNulo(dados.numeroDocumento),
    p_data_documento: ouNulo(dados.dataDocumento),
    p_competencia: ouNulo(dados.competencia),
    p_estabelecimento_id: ouNulo(dados.estabelecimentoId),
    p_classificacao_id: ouNulo(dados.classificacaoId),
    p_tipo_despesa_particular_id: ouNulo(dados.tipoDespesaParticularId),
    p_forma_pagamento: ouNulo(dados.formaPagamento),
    p_recorrente: dados.recorrente ?? false,
    p_recorrencia_tipo: ouNulo(dados.recorrenciaTipo),
    p_periodicidade: ouNulo(dados.periodicidade),
    p_valor_aproximado: dados.valorAproximado ?? null,
    p_ocorrencias: dados.ocorrencias ?? null,
    p_observacoes: ouNulo(dados.observacoes),
    p_historico: ouNulo(dados.historico),
  };

  let { error } = await supabase.rpc("criar_conta_com_parcelas", parametros);

  // A RPC é resolvida pela assinatura completa: se a migration 0004
  // (que acrescenta p_historico) ainda não foi aplicada nesta
  // instalação, o Postgres não encontra função nenhuma que bata com os
  // parâmetros (PGRST202) — e travaria o cadastro de conta por causa de
  // um campo novo e opcional. Tenta de novo sem ele, mesmo espírito da
  // tolerância a migration pendente já usada em D-044.
  if (error?.code === "PGRST202") {
    const { p_historico: _historicoDescartado, ...semHistorico } = parametros;
    void _historicoDescartado;
    ({ error } = await supabase.rpc("criar_conta_com_parcelas", semHistorico));
  }

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");
  return { ok: true };
}

export interface AtualizarContaInput {
  contaId: string;
  descricao: string;
  vencimento: string;
  fornecedorNome?: string;
  fornecedorCnpj?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  estabelecimentoId?: string;
  classificacaoId?: string;
  tipoDespesaParticularId?: string;
  formaPagamento?: string;
  recorrente?: boolean;
  recorrenciaTipo?: TipoRecorrencia | "";
  periodicidade?: Periodicidade | "";
  valorAproximado?: number | null;
  ocorrencias?: number | null;
  observacoes?: string;
  historico?: string;
  /**
   * Valor total da conta. `undefined`/`null` = não mexer — é assim que
   * toda edição que não toca no valor continua se comportando. Quando
   * vem preenchido, a regra de integridade abaixo é reconferida NO
   * SERVIDOR antes de gravar; o formulário não decide isso sozinho.
   */
  valorInicial?: number | null;
}

export interface ContaDetalhe {
  id: string;
  natureza: NaturezaConta;
  descricao: string;
  vencimento: string;
  valorInicial: number;
  /** Quantas parcelas a conta tem de fato (linhas em `parcelas`). */
  totalParcelas: number;
  /** true se qualquer parcela desta conta já recebeu pagamento. */
  temPagamento: boolean;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroDocumento: string;
  dataDocumento: string;
  estabelecimentoId: string;
  classificacaoId: string;
  tipoDespesaParticularId: string;
  formaPagamento: string;
  recorrente: boolean;
  recorrenciaTipo: TipoRecorrencia | "";
  periodicidade: Periodicidade | "";
  valorAproximado: number | null;
  ocorrencias: number | null;
  observacoes: string;
  historico: string;
  cancelada: boolean;
}

/**
 * Busca uma conta pelo id, com os IDs reais dos vínculos (a view
 * `vw_parcelas_completo` só expõe os nomes já resolvidos, úteis para
 * listar — não para preencher um formulário de edição). Passa pelo
 * mesmo RLS de `contas_select`: conta particular de outra pessoa nunca
 * chega aqui.
 */
export async function buscarConta(contaId: string): Promise<{ ok: true; conta: ContaDetalhe } | Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  // `parcelas(id, pagamentos(id))` vem no MESMO pedido (embed do
  // PostgREST, não uma consulta a mais): é o que diz se o valor da conta
  // ainda pode ser corrigido com segurança — ver `podeCorrigirValor`.
  const camposBase =
    "id, natureza, descricao, vencimento, valor_inicial, numero_documento, data_documento, estabelecimento_id, classificacao_id, tipo_despesa_particular_id, forma_pagamento, recorrente, recorrencia_tipo, periodicidade, valor_aproximado, ocorrencias, observacoes, cancelada, fornecedores(nome, cnpj), parcelas(id, pagamentos(id))";

  let { data, error } = await supabase
    .from("contas")
    .select(`${camposBase}, historico`)
    .eq("id", contaId)
    .maybeSingle();

  // Mesma tolerância de `criarConta`: sem a migration 0004, a coluna
  // `historico` não existe (42703) — tenta de novo sem ela em vez de
  // impedir a edição da conta inteira por causa de um campo que ainda
  // não existe nesta instalação.
  if (error?.code === "42703") {
    ({ data, error } = await supabase.from("contas").select(camposBase).eq("id", contaId).maybeSingle());
  }

  if (error) return { ok: false, erro: error.message };
  if (!data) return { ok: false, erro: "Conta não encontrada (ou você não tem acesso a ela)." };

  const fornecedorBruto = data.fornecedores as { nome: string; cnpj: string | null } | { nome: string; cnpj: string | null }[] | null;
  const fornecedor = Array.isArray(fornecedorBruto) ? fornecedorBruto[0] : fornecedorBruto;

  const parcelasBrutas = (data.parcelas ?? []) as { id: string; pagamentos: { id: string }[] | null }[];

  return {
    ok: true,
    conta: {
      id: data.id,
      natureza: data.natureza,
      descricao: data.descricao,
      vencimento: data.vencimento,
      valorInicial: Number(data.valor_inicial ?? 0),
      totalParcelas: parcelasBrutas.length,
      temPagamento: parcelasBrutas.some((p) => (p.pagamentos ?? []).length > 0),
      fornecedorNome: fornecedor?.nome ?? "",
      fornecedorCnpj: fornecedor?.cnpj ?? "",
      numeroDocumento: data.numero_documento ?? "",
      dataDocumento: data.data_documento ?? "",
      estabelecimentoId: data.estabelecimento_id ?? "",
      classificacaoId: data.classificacao_id ?? "",
      tipoDespesaParticularId: data.tipo_despesa_particular_id ?? "",
      formaPagamento: data.forma_pagamento ?? "",
      recorrente: data.recorrente ?? false,
      recorrenciaTipo: (data.recorrencia_tipo ?? "") as TipoRecorrencia | "",
      periodicidade: (data.periodicidade ?? "") as Periodicidade | "",
      valorAproximado: data.valor_aproximado,
      ocorrencias: data.ocorrencias,
      observacoes: data.observacoes ?? "",
      historico: data.historico ?? "",
      cancelada: data.cancelada ?? false,
    },
  };
}

/**
 * Atualiza os dados de uma conta já cadastrada.
 *
 * Não mexe na natureza: Empresa/Particular é uma decisão feita uma vez
 * no cadastro — mudar depois abriria a porta para uma conta particular
 * "virar" empresarial por engano, ou vice-versa, e uma delas entra no
 * fechamento contábil enquanto a outra nunca pode entrar.
 *
 * Também não mexe em pagamentos, em hipótese alguma. A única coisa que
 * pode tocar em `parcelas` é a correção de valor/vencimento de uma conta
 * de parcela única e sem pagamento — ver `podeCorrigirValor`.
 */
export async function atualizarConta(dados: AtualizarContaInput): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  if (!ouNulo(dados.descricao)) return { ok: false, erro: "A descrição é obrigatória." };
  if (!ouNulo(dados.vencimento)) return { ok: false, erro: "O vencimento é obrigatório." };
  if (dados.recorrente && (!dados.recorrenciaTipo || !dados.periodicidade)) {
    return { ok: false, erro: "Para conta recorrente, informe o tipo e a periodicidade." };
  }

  const supabase = await criarClienteServidor();

  // ---- Correção de valor: só entra aqui quando de fato foi pedida ----
  // Nada disto roda numa edição comum (descrição, classificação...), então
  // o caminho normal continua com o mesmo número de consultas de antes.
  let parcelaUnicaParaSincronizar: { id: string; valorAnterior: number; vencimentoAnterior: string } | null = null;

  if (dados.valorInicial != null) {
    if (!(dados.valorInicial > 0)) return { ok: false, erro: "O valor precisa ser maior que zero." };

    // Reconferência no servidor. O formulário já esconde o campo quando
    // não pode, mas quem manda é esta checagem: uma requisição forjada
    // não consegue alterar o valor de uma conta já paga ou parcelada.
    const { data: estado, error: erroEstado } = await supabase
      .from("contas")
      .select("cancelada, parcelas(id, valor, vencimento, pagamentos(id))")
      .eq("id", dados.contaId)
      .maybeSingle();

    if (erroEstado) return { ok: false, erro: erroEstado.message };
    if (!estado) return { ok: false, erro: "Conta não encontrada (ou você não tem acesso a ela)." };

    const parcelas = (estado.parcelas ?? []) as {
      id: string;
      valor: number | string;
      vencimento: string;
      pagamentos: { id: string }[] | null;
    }[];

    const veredito = podeCorrigirValor({
      cancelada: estado.cancelada ?? false,
      totalParcelas: parcelas.length,
      temPagamento: parcelas.some((p) => (p.pagamentos ?? []).length > 0),
    });

    if (!veredito.pode) return { ok: false, erro: veredito.motivo };

    const unica = parcelas[0];
    if (unica) {
      parcelaUnicaParaSincronizar = {
        id: unica.id,
        valorAnterior: Number(unica.valor ?? 0),
        vencimentoAnterior: unica.vencimento,
      };
    }
  }

  // Favorecido/Fornecedor: mesma lógica de "reaproveita se existe, cria
  // se novo" da RPC de criação (§3/§46) — feita aqui em duas consultas
  // porque não existe RPC de atualização.
  let fornecedorId: string | null = null;
  const nomeFornecedor = ouNulo(dados.fornecedorNome);
  if (nomeFornecedor) {
    const { data: existente } = await supabase
      .from("fornecedores")
      .select("id, cnpj")
      .ilike("nome", nomeFornecedor)
      .maybeSingle();

    if (existente) {
      fornecedorId = existente.id;
      const cnpjNovo = ouNulo(dados.fornecedorCnpj);
      if (cnpjNovo && !existente.cnpj) {
        await supabase.from("fornecedores").update({ cnpj: cnpjNovo }).eq("id", existente.id);
      }
    } else {
      const { data: criado, error: erroCriar } = await supabase
        .from("fornecedores")
        .insert({ nome: nomeFornecedor, cnpj: ouNulo(dados.fornecedorCnpj) })
        .select("id")
        .single();
      if (erroCriar) return { ok: false, erro: erroCriar.message };
      fornecedorId = criado.id;
    }
  }

  const patch: Record<string, unknown> = {
    fornecedor_id: fornecedorId,
    descricao: dados.descricao.trim(),
    vencimento: dados.vencimento,
    numero_documento: ouNulo(dados.numeroDocumento),
    data_documento: ouNulo(dados.dataDocumento),
    estabelecimento_id: ouNulo(dados.estabelecimentoId),
    classificacao_id: ouNulo(dados.classificacaoId),
    tipo_despesa_particular_id: ouNulo(dados.tipoDespesaParticularId),
    forma_pagamento: ouNulo(dados.formaPagamento),
    recorrente: dados.recorrente ?? false,
    recorrencia_tipo: dados.recorrente ? ouNulo(dados.recorrenciaTipo) : null,
    periodicidade: dados.recorrente ? ouNulo(dados.periodicidade) : null,
    valor_aproximado: dados.recorrente ? (dados.valorAproximado ?? null) : null,
    ocorrencias: dados.recorrente ? (dados.ocorrencias ?? null) : null,
    observacoes: ouNulo(dados.observacoes),
    historico: ouNulo(dados.historico),
  };

  if (dados.valorInicial != null) patch.valor_inicial = dados.valorInicial;

  // A parcela única anda junto com o cabeçalho: é `parcelas.valor` e
  // `parcelas.vencimento` que decidem o status e aparecem em todas as
  // listas e relatórios. Gravar só o cabeçalho tornava a edição
  // invisível na tela — a pessoa mudava a data, salvava, e a tabela
  // continuava mostrando a data antiga.
  //
  // Gravada ANTES do cabeçalho de propósito: se o UPDATE de `contas`
  // falhar depois, esta linha é devolvida ao estado anterior logo
  // abaixo, e a conta nunca fica divergente de si mesma. O gatilho de
  // auditoria só registra o que mudou de fato (`is distinct from`), então
  // reescrever um valor igual ao atual não polui o histórico.
  if (parcelaUnicaParaSincronizar && dados.valorInicial != null) {
    const { error: erroParcela } = await supabase
      .from("parcelas")
      .update({ valor: dados.valorInicial, vencimento: dados.vencimento })
      .eq("id", parcelaUnicaParaSincronizar.id);

    if (erroParcela) return { ok: false, erro: erroParcela.message };
  }

  let { error } = await supabase.from("contas").update(patch).eq("id", dados.contaId);

  // Mesma tolerância de `criarConta`/`buscarConta`: sem a migration 0004
  // a coluna não existe — tenta salvar o resto sem travar a edição da
  // conta por causa de um campo novo. Testado ao vivo contra o projeto
  // real: PATCH/UPDATE devolve PGRST204 ("column not found in schema
  // cache"), diferente do 42703 que o SELECT devolve para o mesmo caso
  // (buscarConta, acima) — os dois são tolerados aqui.
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const { historico: _historicoDescartado, ...semHistorico } = patch;
    void _historicoDescartado;
    ({ error } = await supabase.from("contas").update(semHistorico).eq("id", dados.contaId));
  }

  if (error) {
    // Cabeçalho não gravou: devolve a parcela ao que era, para a conta
    // não ficar com total e parcela contando histórias diferentes.
    if (parcelaUnicaParaSincronizar) {
      await supabase
        .from("parcelas")
        .update({
          valor: parcelaUnicaParaSincronizar.valorAnterior,
          vencimento: parcelaUnicaParaSincronizar.vencimentoAnterior,
        })
        .eq("id", parcelaUnicaParaSincronizar.id);
    }
    return { ok: false, erro: error.message };
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Remove uma conta (e suas parcelas, em cascata). Só deve ser oferecida
 * pela interface quando a conta NUNCA recebeu pagamento — apagar uma
 * conta com pagamento já registrado apagaria o histórico financeiro
 * junto, sem deixar rastro (o gatilho de `historico_alteracoes` só
 * captura UPDATE, não DELETE). Para esse caso, ver `cancelarConta`.
 */
export async function excluirConta(contaId: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contas").delete().eq("id", contaId);
  if (error) return { ok: false, erro: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Cancela uma conta sem apagar nada — usada quando ela já tem pagamento
 * registrado. `cancelada` já é um status terminal reconhecido em toda a
 * Central Financeira (relatórios, fechamento, badge de status).
 */
export async function cancelarConta(contaId: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contas").update({ cancelada: true }).eq("id", contaId);
  if (error) return { ok: false, erro: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");
  return { ok: true };
}

export interface NovoPagamentoInput {
  parcelaId: string;
  dataPagamento: string;
  valorInicial: number;
  juros: number;
  multa: number;
  desconto: number;
  bancoId?: string;
  formaPagamento?: string;
  observacoes?: string;
}

/**
 * Registra o pagamento de uma parcela.
 *
 * `valor_pago` NÃO é enviado: é coluna gerada no banco pela fórmula do
 * cliente (valor + juros + multa − desconto). Assim a conta nunca diverge
 * entre o que a tela mostrou e o que ficou gravado.
 */
export async function registrarPagamento(dados: NovoPagamentoInput): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  if (!ouNulo(dados.dataPagamento)) return { ok: false, erro: "Informe a data do pagamento." };
  if (!(dados.valorInicial >= 0)) return { ok: false, erro: "Valor inválido." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("pagamentos").insert({
    parcela_id: dados.parcelaId,
    data_pagamento: dados.dataPagamento,
    valor_inicial: dados.valorInicial,
    juros: dados.juros || 0,
    multa: dados.multa || 0,
    desconto: dados.desconto || 0,
    banco_id: ouNulo(dados.bancoId),
    forma_pagamento: ouNulo(dados.formaPagamento),
    observacoes: ouNulo(dados.observacoes),
  });

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");
  return { ok: true };
}

/** Login por e-mail e senha. */
export async function entrar(email: string, senha: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) {
    // Mensagem de erro genérica de propósito: não revela se o e-mail existe.
    return { ok: false, erro: "E-mail ou senha incorretos." };
  }
  return { ok: true };
}

export async function sair(): Promise<void> {
  if (!SUPABASE_CONFIGURADO) return;
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

/** Origem da requisição atual (esquema + host), para montar o link de retorno do e-mail de recuperação. */
async function origemDoSite(): Promise<string> {
  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "localhost:3000";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${protocolo}://${host}`;
}

/**
 * Envia o e-mail de recuperação de senha pelo fluxo oficial do Supabase
 * Auth. Não guarda nem valida senha na aplicação — quem confirma a troca é
 * o próprio Supabase, pelo link enviado ao e-mail informado.
 */
export async function recuperarSenha(email: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  const alvo = (email ?? "").trim();
  if (!alvo) return { ok: false, erro: "Informe seu e-mail." };

  const supabase = await criarClienteServidor();
  const origem = await origemDoSite();
  const { error } = await supabase.auth.resetPasswordForEmail(alvo, {
    redirectTo: `${origem}/atualizar-senha`,
  });

  // Mensagem neutra de propósito, mesmo padrão de `entrar`: não revela se o
  // e-mail está cadastrado. O próprio Supabase já se comporta assim por
  // padrão (não erra por e-mail inexistente) — isto cobre falhas reais
  // (limite de envio, projeto sem SMTP configurado etc.).
  if (error) return { ok: false, erro: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." };
  return { ok: true };
}

/**
 * Cadastra um tipo de despesa particular (Água, Aluguel...) para o usuário
 * logado. `dono_id` vem da sessão, nunca do formulário — o RLS de
 * `tipos_despesa_particular` só permite ler/alterar o próprio (D-044).
 */
export async function criarTipoDespesaParticular(nome: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  const alvo = (nome ?? "").trim();
  if (!alvo) return { ok: false, erro: "Informe um nome para o tipo de despesa." };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("tipos_despesa_particular").insert({ dono_id: user.id, nome: alvo });
  if (error) {
    if (error.code === "23505") return { ok: false, erro: "Você já tem um tipo de despesa com esse nome." };
    // Tabela ainda não existe nesta instalação (migration 0002 pendente).
    if (error.code === "42P01") {
      return { ok: false, erro: "Este recurso ainda não foi configurado nesta instalação (migration pendente)." };
    }
    return { ok: false, erro: error.message };
  }

  revalidatePath("/financeiro/particulares");
  return { ok: true };
}

/** Renomeia e/ou ativa/desativa um tipo de despesa particular. O RLS impede alterar o de outra pessoa. */
export async function atualizarTipoDespesaParticular(
  id: string,
  dados: { nome?: string; ativo?: boolean }
): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const patch: Record<string, unknown> = {};
  if (dados.nome !== undefined) {
    const t = dados.nome.trim();
    if (!t) return { ok: false, erro: "O nome não pode ficar vazio." };
    patch.nome = t;
  }
  if (dados.ativo !== undefined) patch.ativo = dados.ativo;
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("tipos_despesa_particular").update(patch).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, erro: "Você já tem um tipo de despesa com esse nome." };
    return { ok: false, erro: error.message };
  }

  revalidatePath("/financeiro/particulares");
  return { ok: true };
}

/**
 * Exclui um tipo de despesa particular. A coluna em `contas` é
 * `on delete set null` — contas antigas que usavam este tipo não são
 * apagadas nem quebram, só perdem essa etiqueta.
 */
export async function excluirTipoDespesaParticular(id: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("tipos_despesa_particular").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };

  revalidatePath("/financeiro/particulares");
  return { ok: true };
}

/* ===================================================================
 * DOCUMENTOS E ANEXOS (D-047, Etapa 4)
 *
 * A tabela `documentos` existe desde a migration 0001 mas não tinha uso
 * pela aplicação. O RLS dela (`documentos_all`) já cobre a mesma regra
 * de `contas` — natureza empresa ou `pode_ver_particular()` — então
 * nenhuma política nova é necessária na tabela em si; só o Storage
 * (bucket `financeiro-documentos`, migration 0004) precisou de RLS
 * própria, porque `storage.objects` é uma tabela separada.
 * =================================================================== */

/**
 * Lista os documentos de uma conta (NF, boletos, comprovantes...), mais
 * recentes primeiro. Chamada sob demanda pelo diálogo de documentos —
 * não entra em `carregarFinanceiro` porque a maioria das contas nunca é
 * aberta nessa tela na mesma sessão.
 */
export async function carregarDocumentos(contaId: string): Promise<Documento[]> {
  if (!SUPABASE_CONFIGURADO) return [];

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("documentos")
    .select("id, conta_id, parcela_id, pagamento_id, tipo, nome, storage_path, tamanho_bytes, criado_em")
    .eq("conta_id", contaId)
    .order("criado_em", { ascending: false });

  if (error) return [];
  return (data ?? []) as Documento[];
}

/**
 * Envia um arquivo para o Storage e registra a linha em `documentos`.
 * Recebe FormData (não um objeto tipado) porque o valor vem de um
 * `<input type="file">` no cliente — é o formato nativo do Next.js para
 * Server Actions que carregam arquivo (ver AGENTS.md: `bodySizeLimit`
 * precisou ser ampliado em `next.config.ts`, o padrão é só 1 MB).
 */
export async function enviarDocumento(formData: FormData): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const contaId = String(formData.get("contaId") ?? "").trim();
  const tipoBruto = String(formData.get("tipo") ?? "outro") as TipoDocumento;
  const tipo = TIPOS_DOCUMENTO_VALIDOS.has(tipoBruto) ? tipoBruto : "outro";
  const parcelaId = ouNulo(formData.get("parcelaId") as string | null);
  const pagamentoId = ouNulo(formData.get("pagamentoId") as string | null);
  const arquivo = formData.get("arquivo");

  if (!contaId) return { ok: false, erro: "Conta não informada." };
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Selecione um arquivo." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "Arquivo maior que 15 MB. Reduza o tamanho e tente novamente." };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  // Convenção de caminho '{conta_id}/{uuid}-{nome}' — é o que a política
  // de RLS do bucket usa para decidir quem pode ler/gravar (migration
  // 0004): o primeiro segmento do caminho tem que ser uma conta que o
  // usuário já pode ver, mesma regra de `contas_select`.
  const nomeSaneado = arquivo.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "arquivo";
  const caminho = `${contaId}/${randomUUID()}-${nomeSaneado}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .upload(caminho, arquivo, { contentType: tipoMime(arquivo), upsert: false });

  if (erroUpload) {
    // Instalação sem a migration 0004 (bucket ainda não existe): mensagem
    // específica em vez do erro técnico do Storage.
    if (/bucket not found/i.test(erroUpload.message)) {
      return {
        ok: false,
        erro: "O armazenamento de documentos ainda não foi configurado nesta instalação (migration pendente).",
      };
    }
    return { ok: false, erro: `Não foi possível enviar o arquivo: ${erroUpload.message}` };
  }

  const { error: erroInsercao } = await supabase.from("documentos").insert({
    conta_id: contaId,
    parcela_id: parcelaId,
    pagamento_id: pagamentoId,
    tipo,
    nome: arquivo.name,
    storage_path: caminho,
    tamanho_bytes: arquivo.size,
    criado_por: user.id,
  });

  if (erroInsercao) {
    // Não deixa o arquivo órfão no Storage se o registro na tabela falhou.
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove([caminho]);
    return { ok: false, erro: erroInsercao.message };
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  return { ok: true };
}

/** Remove um documento — do Storage e da tabela. O RLS garante que só quem pode ver a conta chega até aqui. */
export async function excluirDocumento(documentoId: string): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  const { data, error: erroBusca } = await supabase
    .from("documentos")
    .select("storage_path")
    .eq("id", documentoId)
    .maybeSingle();

  if (erroBusca) return { ok: false, erro: erroBusca.message };
  if (!data) return { ok: false, erro: "Documento não encontrado (ou você não tem acesso a ele)." };

  const { error: erroExclusao } = await supabase.from("documentos").delete().eq("id", documentoId);
  if (erroExclusao) return { ok: false, erro: erroExclusao.message };

  if (data.storage_path) {
    await supabase.storage.from(BUCKET_DOCUMENTOS).remove([data.storage_path]);
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/particulares");
  return { ok: true };
}

/**
 * Como o link temporário deve se comportar ao ser aberto:
 *
 * - `visualizar` — o arquivo é servido com o próprio `Content-Type`
 *   (`Content-Disposition: inline`), então o navegador ABRE o PDF ou a
 *   imagem para leitura, em vez de perguntar onde salvar. Se o sistema do
 *   usuário usa o Adobe Reader como visualizador padrão, é o sistema que
 *   decide isso — nada aqui força um programa específico.
 * - `baixar` — força `Content-Disposition: attachment` com o nome
 *   original, que é o que salva o arquivo no computador.
 *
 * Antes existia só o segundo modo, e por isso o ícone "Visualizar" pedia
 * para salvar o arquivo. Nada muda em segurança entre os dois: o bucket
 * continua privado, o link continua assinado e expirando em 2 minutos, e
 * o RLS continua sendo quem decide se este usuário pode ler o documento.
 */
export type ModoDocumento = "visualizar" | "baixar";

/**
 * Gera um link temporário (2 minutos) para abrir ou baixar um documento.
 * O bucket é privado — não existe URL pública permanente para um arquivo
 * financeiro; cada acesso exige sessão autenticada e passa pelo RLS.
 */
export async function obterUrlDocumento(
  documentoId: string,
  modo: ModoDocumento = "visualizar"
): Promise<{ ok: true; url: string } | Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;

  const supabase = await criarClienteServidor();
  const { data, error: erroBusca } = await supabase
    .from("documentos")
    .select("storage_path, nome")
    .eq("id", documentoId)
    .maybeSingle();

  if (erroBusca) return { ok: false, erro: erroBusca.message };
  if (!data?.storage_path) return { ok: false, erro: "Documento não encontrado (ou você não tem acesso a ele)." };

  const { data: assinado, error: erroUrl } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(data.storage_path, 120, modo === "baixar" ? { download: data.nome } : undefined);

  if (erroUrl || !assinado) return { ok: false, erro: erroUrl?.message ?? "Não foi possível gerar o link." };

  return { ok: true, url: assinado.signedUrl };
}
