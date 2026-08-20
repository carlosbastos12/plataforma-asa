import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import {
  normalizarLinha,
  normalizarLinhaPagamento,
  type Banco,
  type Classificacao,
  type Estabelecimento,
  type Fornecedor,
  type LinhaPagamento,
  type LinhaParcela,
  type ModeloHistorico,
  type NaturezaConta,
  type Perfil,
  type TipoDespesaParticular,
} from "./tipos";

/**
 * Sessão do usuário, memorizada por requisição (`cache` do React).
 *
 * Layout e página do Financeiro renderizam na MESMA requisição: sem isto,
 * cada um refazia `auth.getUser()` e a leitura de `perfis`. Com o cache, a
 * ida ao Supabase acontece uma vez só por navegação — sem afrouxar nada:
 * continua sendo a sessão real validada pelo Supabase, o cache dura apenas
 * o tempo de uma renderização, e o RLS segue valendo em toda consulta.
 */
const obterUsuario = cache(async () => {
  if (!SUPABASE_CONFIGURADO) return null;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/** Perfil do usuário logado (papel e permissão de ver particulares). Memorizado junto com a sessão. */
export const carregarPerfil = cache(async (): Promise<Perfil | null> => {
  const user = await obterUsuario();
  if (!user) return null;

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("perfis")
    .select("id, nome, papel, pode_ver_particular")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Perfil | null) ?? null;
});

/**
 * Só a permissão de ver contas particulares — usada pelo layout do
 * Financeiro para decidir se a aba "Contas Particulares" aparece.
 *
 * Existe para o layout NÃO precisar chamar `carregarFinanceiro()`, que
 * carregava todas as parcelas, todos os pagamentos e as seis tabelas de
 * apoio só para ler um booleano — e ainda sem filtro de natureza, a
 * consulta mais pesada possível, repetida a cada troca de aba.
 */
export async function podeVerParticular(): Promise<boolean> {
  return (await carregarPerfil())?.pode_ver_particular ?? false;
}

export interface DadosFinanceiro {
  configurado: boolean;
  autenticado: boolean;
  perfil: Perfil | null;
  linhas: LinhaParcela[];
  /** Grão de pagamento (D-047) — fonte da exportação para a contabilidade, não das telas de "o que devo". */
  pagamentos: LinhaPagamento[];
  classificacoes: Classificacao[];
  estabelecimentos: Estabelecimento[];
  bancos: Banco[];
  fornecedores: Fornecedor[];
  modelosHistorico: ModeloHistorico[];
  erro: string | null;
}

const VAZIO: DadosFinanceiro = {
  configurado: false,
  autenticado: false,
  perfil: null,
  linhas: [],
  pagamentos: [],
  classificacoes: [],
  estabelecimentos: [],
  bancos: [],
  fornecedores: [],
  modelosHistorico: [],
  erro: null,
};

/**
 * Carrega tudo que a Central Financeira precisa numa única passagem.
 *
 * O filtro por `natureza` é aplicado **no servidor**, não na interface —
 * e o RLS ainda filtra por baixo. Duas barreiras independentes para a
 * mesma regra: conta particular não vaza para quem não pode ver.
 */
export async function carregarFinanceiro(natureza?: NaturezaConta): Promise<DadosFinanceiro> {
  if (!SUPABASE_CONFIGURADO) return VAZIO;

  const user = await obterUsuario();
  if (!user) return { ...VAZIO, configurado: true };

  const supabase = await criarClienteServidor();
  const perfil = await carregarPerfil();

  let consulta = supabase.from("vw_parcelas_completo").select("*");
  if (natureza) consulta = consulta.eq("natureza", natureza);

  // Mesmo filtro de natureza da consulta acima, pelo mesmo motivo: o RLS
  // já barra particular de quem não pode ver, mas o filtro explícito
  // evita buscar dado que a tela não vai usar.
  let consultaPagamentos = supabase.from("vw_pagamentos_completo").select("*");
  if (natureza) consultaPagamentos = consultaPagamentos.eq("natureza", natureza);

  const [linhasRes, pagamentosRes, classRes, estabRes, bancosRes, fornRes, modelosRes] = await Promise.all([
    consulta.order("parcela_vencimento", { ascending: true }),
    consultaPagamentos.order("data_pagamento", { ascending: false }),
    supabase.from("classificacoes").select("id, grupo, nome, confirmacao_pendente").eq("ativo", true).order("grupo").order("nome"),
    supabase.from("estabelecimentos").select("id, nome").eq("ativo", true).order("ordem"),
    supabase.from("bancos").select("id, nome").eq("ativo", true).order("ordem"),
    supabase.from("fornecedores").select("id, nome, cnpj").eq("ativo", true).order("nome"),
    supabase.from("modelos_historico").select("id, texto").eq("ativo", true).order("ordem"),
  ]);

  // `modelos_historico`/`vw_pagamentos_completo` só existem depois da
  // migration 0004: se ainda não foi aplicada, a tabela/view não é
  // encontrada e a Central Financeira continua funcionando normalmente —
  // só o Histórico e a exportação contábil ficam vazios, sem derrubar a
  // página (mesmo padrão da migration 0002 em D-044).
  //
  // Testado ao vivo contra o projeto real (sem a 0004 aplicada): o
  // PostgREST devolve PGRST205 ("could not find the table/view in the
  // schema cache") para relação ausente — NÃO o código bruto do Postgres
  // (42P01), que só apareceria numa chamada SQL direta. Os dois são
  // tolerados por segurança.
  const ignorarSeAusente = (e: { code?: string; message: string } | null) =>
    e?.code === "PGRST205" || e?.code === "42P01" ? null : (e?.message ?? null);

  const erro =
    linhasRes.error?.message ??
    ignorarSeAusente(pagamentosRes.error) ??
    classRes.error?.message ??
    estabRes.error?.message ??
    bancosRes.error?.message ??
    fornRes.error?.message ??
    ignorarSeAusente(modelosRes.error) ??
    null;

  return {
    configurado: true,
    autenticado: true,
    perfil,
    linhas: (linhasRes.data ?? []).map((l) => normalizarLinha(l as Record<string, unknown>)),
    pagamentos: (pagamentosRes.data ?? []).map((l) => normalizarLinhaPagamento(l as Record<string, unknown>)),
    classificacoes: (classRes.data ?? []) as Classificacao[],
    estabelecimentos: (estabRes.data ?? []) as Estabelecimento[],
    bancos: (bancosRes.data ?? []) as Banco[],
    fornecedores: (fornRes.data ?? []) as Fornecedor[],
    modelosHistorico: (modelosRes.data ?? []) as ModeloHistorico[],
    erro,
  };
}

export interface UsuarioSessao {
  nome: string;
  papel: Perfil["papel"];
}

/**
 * Identidade do usuário autenticado, para exibição fora da Central
 * Financeira (avatar no topo da plataforma). Consulta leve — não carrega
 * contas, parcelas nem tabelas de apoio, ao contrário de `carregarFinanceiro`.
 */
export async function carregarUsuarioSessao(): Promise<UsuarioSessao | null> {
  const perfil = await carregarPerfil();
  if (!perfil) return null;
  return { nome: perfil.nome, papel: perfil.papel };
}

/**
 * Tipos de despesa particular do usuário logado (Água, Aluguel...).
 *
 * Consulta isolada de propósito, fora do `Promise.all` de
 * `carregarFinanceiro`: se a migration 0002 ainda não tiver sido aplicada
 * nesta instalação, a tabela não existe e a consulta abaixo volta com
 * `error` em vez de derrubar a página inteira — o formulário de conta
 * particular só fica sem opções de tipo até a migration ser aplicada.
 */
export async function carregarTiposDespesaParticular(): Promise<TipoDespesaParticular[]> {
  if (!(await obterUsuario())) return [];

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("tipos_despesa_particular")
    .select("id, nome, ativo")
    .order("nome");

  if (error) return [];
  return (data ?? []) as TipoDespesaParticular[];
}

/** Indicadores da Home — só contas da empresa, nunca particulares. */
export async function carregarResumoEmpresa(): Promise<LinhaParcela[]> {
  if (!(await obterUsuario())) return [];

  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("vw_parcelas_completo").select("*").eq("natureza", "empresa");
  return (data ?? []).map((l) => normalizarLinha(l as Record<string, unknown>));
}
