-- =====================================================================
-- Migration 0002 — Tipos de despesa particular (P044/D-044)
--
-- Estrutura própria da PESSOA para classificar despesas pessoais (Água,
-- Aluguel, Internet...). Nunca reaproveita `classificacoes`, que é a
-- estrutura contábil da EMPRESA (95 itens do escritório contábil, RLS
-- aberto a todo autenticado — ver nota em D-043). Cada tipo pertence a um
-- dono; RLS garante que ninguém vê ou altera o tipo de outra pessoa,
-- preparando o terreno para quando mais de uma pessoa tiver acesso a
-- contas particulares (hoje só a gestora tem `pode_ver_particular`).
--
-- Idempotente, como a 0001: pode ser reaplicada sem quebrar o que já
-- existe. NÃO altera nada da migration 0001 além do necessário (uma
-- coluna nova em `contas`, e a view/RPC recriadas para incluir essa
-- coluna).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABELA — cada linha pertence a um dono (auth.users)
-- ---------------------------------------------------------------------
create table if not exists tipos_despesa_particular (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (dono_id, nome)
);

comment on table tipos_despesa_particular is
  'Tipos de despesa pessoal (Água, Aluguel, Internet...), cadastrados por cada pessoa. NÃO é a classificação contábil da empresa (public.classificacoes) — não reaproveitar aquela tabela aqui.';

alter table tipos_despesa_particular enable row level security;

-- Cada pessoa só lê e altera os próprios tipos. Sem exceção para gestora
-- de propósito: o pedido explícito é "cada pessoa vê somente os seus".
drop policy if exists tipos_despesa_particular_rw on tipos_despesa_particular;
create policy tipos_despesa_particular_rw on tipos_despesa_particular
  for all to authenticated
  using (dono_id = auth.uid())
  with check (dono_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. VÍNCULO EM CONTAS — só populado quando natureza = 'particular'
-- ---------------------------------------------------------------------
alter table contas
  add column if not exists tipo_despesa_particular_id uuid references tipos_despesa_particular(id) on delete set null;

create index if not exists contas_tipo_despesa_particular_idx on contas (tipo_despesa_particular_id);

do $$ begin
  alter table contas add constraint contas_tipo_particular_coerente
    check (tipo_despesa_particular_id is null or natureza = 'particular');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 3. VIEW — recriada com o nome do tipo (mesma definição da 0001 + 1 join)
-- ---------------------------------------------------------------------
create or replace view vw_parcelas_completo as
select
  p.id                as parcela_id,
  p.conta_id,
  p.numero            as parcela_numero,
  p.total             as parcela_total,
  p.valor             as parcela_valor,
  p.vencimento        as parcela_vencimento,
  c.natureza,
  c.descricao,
  c.numero_documento,
  c.valor_inicial     as conta_valor,
  c.data_documento,
  c.competencia,
  c.forma_pagamento,
  c.observacoes,
  c.recorrente,
  c.recorrencia_tipo,
  c.periodicidade,
  c.cancelada,
  f.nome              as fornecedor_nome,
  f.cnpj              as fornecedor_cnpj,
  e.nome              as estabelecimento_nome,
  cl.grupo            as classificacao_grupo,
  cl.nome             as classificacao_nome,
  tdp.nome            as tipo_despesa_particular_nome,
  coalesce(pg.total_pago, 0)     as total_pago,
  coalesce(pg.total_juros, 0)    as total_juros,
  coalesce(pg.total_multa, 0)    as total_multa,
  coalesce(pg.total_desconto, 0) as total_desconto,
  pg.ultima_data_pagamento,
  pg.bancos_utilizados,
  case
    when c.cancelada then 'cancelada'
    when coalesce(pg.total_pago, 0) >= p.valor and coalesce(pg.total_pago, 0) > 0 then 'paga'
    when coalesce(pg.total_pago, 0) > 0 then 'parcialmente_paga'
    when p.vencimento < current_date then 'vencida'
    when p.vencimento = current_date then 'vence_hoje'
    else 'a_vencer'
  end as status,
  case
    when p.vencimento < current_date and coalesce(pg.total_pago, 0) < p.valor and not c.cancelada
      then (current_date - p.vencimento)
    else 0
  end as dias_em_atraso
from parcelas p
join contas c on c.id = p.conta_id
left join fornecedores f on f.id = c.fornecedor_id
left join estabelecimentos e on e.id = c.estabelecimento_id
left join classificacoes cl on cl.id = c.classificacao_id
left join tipos_despesa_particular tdp on tdp.id = c.tipo_despesa_particular_id
left join lateral (
  select
    sum(pa.valor_pago)      as total_pago,
    sum(pa.juros)           as total_juros,
    sum(pa.multa)           as total_multa,
    sum(pa.desconto)        as total_desconto,
    max(pa.data_pagamento)  as ultima_data_pagamento,
    string_agg(distinct b.nome, ', ') as bancos_utilizados
  from pagamentos pa
  left join bancos b on b.id = pa.banco_id
  where pa.parcela_id = p.id
) pg on true;

-- A view herda o RLS das tabelas de origem, incluindo a nova
-- tipos_despesa_particular (security_invoker) — mesma regra da 0001.
alter view vw_parcelas_completo set (security_invoker = on);

-- ---------------------------------------------------------------------
-- 4. RPC — criar_conta_com_parcelas ganha o parâmetro novo no final
--    (precisa DROP + CREATE porque acrescentar parâmetro muda a
--    assinatura; um simples CREATE OR REPLACE criaria uma sobrecarga
--    nova e deixaria a função antiga órfã, causando ambiguidade)
-- ---------------------------------------------------------------------
drop function if exists public.criar_conta_com_parcelas(
  natureza_conta, text, numeric, date, jsonb,
  text, text, text, date, date, uuid, uuid, text,
  boolean, tipo_recorrencia, periodicidade_conta, numeric, int, text
);

create function public.criar_conta_com_parcelas(
  p_natureza                    natureza_conta,
  p_descricao                   text,
  p_valor_inicial                numeric,
  p_vencimento                  date,
  p_parcelas                    jsonb,
  p_fornecedor_nome              text default null,
  p_fornecedor_cnpj              text default null,
  p_numero_documento             text default null,
  p_data_documento               date default null,
  p_competencia                  date default null,
  p_estabelecimento_id           uuid default null,
  p_classificacao_id             uuid default null,
  p_forma_pagamento              text default null,
  p_recorrente                   boolean default false,
  p_recorrencia_tipo             tipo_recorrencia default null,
  p_periodicidade                periodicidade_conta default null,
  p_valor_aproximado             numeric default null,
  p_ocorrencias                  int default null,
  p_observacoes                  text default null,
  p_tipo_despesa_particular_id   uuid default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_fornecedor_id uuid;
  v_conta_id uuid;
  v_total int;
  v_parcela jsonb;
begin
  -- Fornecedor (ou "favorecido", no fluxo particular — mesma coluna):
  -- reaproveita se já existe, cria se for novo (§3/§46).
  if p_fornecedor_nome is not null and btrim(p_fornecedor_nome) <> '' then
    select id into v_fornecedor_id
    from fornecedores
    where lower(nome) = lower(btrim(p_fornecedor_nome))
    limit 1;

    if v_fornecedor_id is null then
      insert into fornecedores (nome, cnpj)
      values (btrim(p_fornecedor_nome), nullif(btrim(coalesce(p_fornecedor_cnpj, '')), ''))
      returning id into v_fornecedor_id;
    elsif p_fornecedor_cnpj is not null and btrim(p_fornecedor_cnpj) <> '' then
      update fornecedores set cnpj = btrim(p_fornecedor_cnpj)
      where id = v_fornecedor_id and (cnpj is null or btrim(cnpj) = '');
    end if;
  end if;

  v_total := greatest(coalesce(jsonb_array_length(p_parcelas), 1), 1);

  insert into contas (
    natureza, fornecedor_id, numero_documento, descricao, valor_inicial,
    data_documento, competencia, vencimento, estabelecimento_id,
    classificacao_id, forma_pagamento, total_parcelas, recorrente,
    recorrencia_tipo, periodicidade, valor_aproximado, ocorrencias,
    observacoes, criado_por, tipo_despesa_particular_id
  ) values (
    p_natureza, v_fornecedor_id, nullif(btrim(coalesce(p_numero_documento, '')), ''),
    p_descricao, p_valor_inicial, p_data_documento, p_competencia, p_vencimento,
    p_estabelecimento_id, p_classificacao_id, p_forma_pagamento, v_total,
    p_recorrente, p_recorrencia_tipo, p_periodicidade, p_valor_aproximado,
    p_ocorrencias, nullif(btrim(coalesce(p_observacoes, '')), ''), auth.uid(),
    p_tipo_despesa_particular_id
  )
  returning id into v_conta_id;

  if p_parcelas is null or jsonb_array_length(p_parcelas) = 0 then
    insert into parcelas (conta_id, numero, total, valor, vencimento)
    values (v_conta_id, 1, 1, p_valor_inicial, p_vencimento);
  else
    for v_parcela in select * from jsonb_array_elements(p_parcelas) loop
      insert into parcelas (conta_id, numero, total, valor, vencimento)
      values (
        v_conta_id,
        (v_parcela->>'numero')::int,
        v_total,
        (v_parcela->>'valor')::numeric,
        (v_parcela->>'vencimento')::date
      );
    end loop;
  end if;

  return v_conta_id;
end $$;
