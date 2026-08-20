"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import type { NaturezaConta, Periodicidade, TipoRecorrencia } from "./tipos";

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
  const { error } = await supabase.rpc("criar_conta_com_parcelas", {
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
  });

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
}

export interface ContaDetalhe {
  id: string;
  natureza: NaturezaConta;
  descricao: string;
  vencimento: string;
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
  const { data, error } = await supabase
    .from("contas")
    .select(
      "id, natureza, descricao, vencimento, numero_documento, data_documento, estabelecimento_id, classificacao_id, tipo_despesa_particular_id, forma_pagamento, recorrente, recorrencia_tipo, periodicidade, valor_aproximado, ocorrencias, observacoes, cancelada, fornecedores(nome, cnpj)"
    )
    .eq("id", contaId)
    .maybeSingle();

  if (error) return { ok: false, erro: error.message };
  if (!data) return { ok: false, erro: "Conta não encontrada (ou você não tem acesso a ela)." };

  const fornecedorBruto = data.fornecedores as { nome: string; cnpj: string | null } | { nome: string; cnpj: string | null }[] | null;
  const fornecedor = Array.isArray(fornecedorBruto) ? fornecedorBruto[0] : fornecedorBruto;

  return {
    ok: true,
    conta: {
      id: data.id,
      natureza: data.natureza,
      descricao: data.descricao,
      vencimento: data.vencimento,
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
      cancelada: data.cancelada ?? false,
    },
  };
}

/**
 * Atualiza os dados de uma conta já cadastrada. Não mexe em parcelas,
 * pagamentos nem na natureza (Empresa/Particular é uma decisão feita uma
 * vez no cadastro — mudar depois abriria a porta para uma conta
 * particular "virar" empresarial por engano, ou vice-versa).
 */
export async function atualizarConta(dados: AtualizarContaInput): Promise<Resultado> {
  if (!SUPABASE_CONFIGURADO) return semBanco;
  if (!ouNulo(dados.descricao)) return { ok: false, erro: "A descrição é obrigatória." };
  if (!ouNulo(dados.vencimento)) return { ok: false, erro: "O vencimento é obrigatório." };
  if (dados.recorrente && (!dados.recorrenciaTipo || !dados.periodicidade)) {
    return { ok: false, erro: "Para conta recorrente, informe o tipo e a periodicidade." };
  }

  const supabase = await criarClienteServidor();

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

  const { error } = await supabase
    .from("contas")
    .update({
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
    })
    .eq("id", dados.contaId);

  if (error) return { ok: false, erro: error.message };

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
