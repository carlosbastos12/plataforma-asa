import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import {
  normalizarLinha,
  type Banco,
  type Classificacao,
  type Estabelecimento,
  type Fornecedor,
  type LinhaParcela,
  type NaturezaConta,
  type Perfil,
} from "./tipos";

export interface DadosFinanceiro {
  configurado: boolean;
  autenticado: boolean;
  perfil: Perfil | null;
  linhas: LinhaParcela[];
  classificacoes: Classificacao[];
  estabelecimentos: Estabelecimento[];
  bancos: Banco[];
  fornecedores: Fornecedor[];
  erro: string | null;
}

const VAZIO: DadosFinanceiro = {
  configurado: false,
  autenticado: false,
  perfil: null,
  linhas: [],
  classificacoes: [],
  estabelecimentos: [],
  bancos: [],
  fornecedores: [],
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

  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ...VAZIO, configurado: true };

  const { data: perfilBruto } = await supabase
    .from("perfis")
    .select("id, nome, papel, pode_ver_particular")
    .eq("id", user.id)
    .maybeSingle();

  let consulta = supabase.from("vw_parcelas_completo").select("*");
  if (natureza) consulta = consulta.eq("natureza", natureza);

  const [linhasRes, classRes, estabRes, bancosRes, fornRes] = await Promise.all([
    consulta.order("parcela_vencimento", { ascending: true }),
    supabase.from("classificacoes").select("id, grupo, nome, confirmacao_pendente").eq("ativo", true).order("grupo").order("nome"),
    supabase.from("estabelecimentos").select("id, nome").eq("ativo", true).order("ordem"),
    supabase.from("bancos").select("id, nome").eq("ativo", true).order("ordem"),
    supabase.from("fornecedores").select("id, nome, cnpj").eq("ativo", true).order("nome"),
  ]);

  const erro =
    linhasRes.error?.message ??
    classRes.error?.message ??
    estabRes.error?.message ??
    bancosRes.error?.message ??
    fornRes.error?.message ??
    null;

  return {
    configurado: true,
    autenticado: true,
    perfil: (perfilBruto as Perfil | null) ?? null,
    linhas: (linhasRes.data ?? []).map((l) => normalizarLinha(l as Record<string, unknown>)),
    classificacoes: (classRes.data ?? []) as Classificacao[],
    estabelecimentos: (estabRes.data ?? []) as Estabelecimento[],
    bancos: (bancosRes.data ?? []) as Banco[],
    fornecedores: (fornRes.data ?? []) as Fornecedor[],
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
  if (!SUPABASE_CONFIGURADO) return null;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("perfis").select("nome, papel").eq("id", user.id).maybeSingle();
  if (!data) return null;

  return { nome: data.nome as string, papel: data.papel as Perfil["papel"] };
}

/** Indicadores da Home — só contas da empresa, nunca particulares. */
export async function carregarResumoEmpresa(): Promise<LinhaParcela[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from("vw_parcelas_completo").select("*").eq("natureza", "empresa");
  return (data ?? []).map((l) => normalizarLinha(l as Record<string, unknown>));
}
