/**
 * Credenciais do Supabase — projeto "Plataforma ASA".
 *
 * Lidas SEMPRE de variáveis de ambiente. Nenhuma chave é escrita no código
 * ou versionada (ver `.env.example`). As duas variáveis abaixo são as
 * públicas por design do Supabase: a proteção real dos dados é feita por
 * Row Level Security no banco, não por segredo de chave.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Permite ao produto se comportar com honestidade quando ainda não há
 * banco configurado: em vez de quebrar com erro técnico, a tela explica
 * o que falta. Evita também que `next build` falhe por falta de env.
 */
export const SUPABASE_CONFIGURADO = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
