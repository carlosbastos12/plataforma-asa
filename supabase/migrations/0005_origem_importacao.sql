-- =====================================================================
-- Plataforma ASA — Migration 0005
-- Origem do lançamento + rastro da importação (primeira versão do
-- importador de despesas por planilha).
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo
-- inteiro → Run. Idempotente, mesma convenção das migrations 0001–0004.
-- NÃO aplicada por este agente — sem token de gerência do Supabase nesta
-- sessão. Enquanto não for aplicada, o importador se recusa a funcionar
-- e explica isso na tela, em vez de gravar conta sem rastro de origem.
--
-- NADA do que já existe é alterado além do necessário: nenhuma coluna,
-- tabela, RLS, política ou RPC das migrations 0001–0004 é removida ou
-- tem seu comportamento anterior modificado. Todas as colunas novas têm
-- default, então toda conta já cadastrada continua válida e passa a
-- constar, corretamente, como origem 'manual'.
-- =====================================================================

-- =====================================================================
-- 1. DE ONDE VEIO A CONTA
-- =====================================================================

do $$ begin
  create type origem_conta as enum ('manual', 'planilha');
exception when duplicate_object then null; end $$;

comment on type origem_conta is
  'Como a conta entrou no sistema: digitada por uma pessoa (manual) ou trazida de uma planilha de exportação (planilha).';

alter table contas
  add column if not exists origem origem_conta not null default 'manual';

-- Identificador do lançamento no sistema de origem, QUANDO a exportação
-- trouxer um. É a forma mais confiável de saber que uma linha já foi
-- importada — melhor que qualquer combinação de campos. Ainda não
-- sabemos se a exportação real terá esse campo; por isso é opcional.
alter table contas
  add column if not exists origem_ref text;

comment on column contas.origem_ref is
  'Identificador do lançamento no sistema de origem, quando a exportação fornecer um. Base da checagem de reimportação.';

-- Chave derivada (CNPJ + documento + parcela, ou fornecedor + valor +
-- vencimento). APOIO para detectar duplicidade — nunca prova de
-- identidade, e de propósito SEM restrição de unicidade: uma coincidência
-- fraca deve levantar a dúvida para a pessoa decidir, jamais barrar
-- sozinha um lançamento legítimo.
alter table contas
  add column if not exists origem_chave text;

comment on column contas.origem_chave is
  'Chave de reconciliação para detectar possível duplicidade. Apoio, não identidade — por isso não é única.';

-- A linha original, como veio da planilha, incluindo as colunas que a
-- Plataforma ASA ainda não sabe aproveitar (categoria, centro de custo,
-- tipo...). Guardar em vez de descartar: quando houver regra para elas,
-- o dado estará aqui, sem precisar reimportar.
alter table contas
  add column if not exists origem_dados jsonb;

comment on column contas.origem_dados is
  'Linha original da planilha, inclusive colunas sem correspondência no ASA. Nunca é interpretada automaticamente.';

-- Identidade forte: o mesmo lançamento de origem não entra duas vezes.
-- Parcial (só onde há referência) para não atrapalhar conta manual.
create unique index if not exists contas_origem_ref_unico
  on contas (origem, origem_ref)
  where origem_ref is not null;

-- Índice comum, para a conferência de duplicidade achar candidatos
-- rápido. NÃO é único, pelo motivo explicado acima.
create index if not exists contas_origem_chave_idx on contas (origem_chave);

create index if not exists contas_origem_idx on contas (origem);

-- =====================================================================
-- 2. VIEW `vw_parcelas_completo` — reexposta com `origem` no final
--
-- Mesma regra já documentada nas migrations 0002 e 0004: `create or
-- replace view` só aceita coluna nova no FIM da lista (Postgres 42P16 se
-- inserida no meio). Todo o resto da definição é idêntico à versão da
-- 0004 — nenhuma coluna existente muda de nome, tipo ou posição.
-- =====================================================================

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
  end as dias_em_atraso,
  tdp.nome            as tipo_despesa_particular_nome,
  c.historico,
  -- Coluna nova desta migration: precisa ficar por último.
  c.origem
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

alter view vw_parcelas_completo set (security_invoker = on);

-- =====================================================================
-- 3. RLS — NADA MUDA, e é importante que fique registrado por quê.
--
-- As colunas novas ficam em `contas`, que já tem RLS desde a 0001
-- (`contas_select/insert/update/delete`, todas com a regra
-- `natureza = 'empresa' or public.pode_ver_particular()`). Coluna nova em
-- tabela com RLS herda a proteção da linha — não existe caminho novo de
-- leitura ou escrita para criar. Por isso esta migration NÃO cria,
-- altera nem remove política alguma.
--
-- O importador grava exclusivamente contas com natureza 'empresa': a
-- exportação é do sistema da empresa, e conta particular é registro
-- pessoal, digitado por quem é dono dele. Isso mantém o isolamento
-- Empresa × Particular intacto, sem depender de nenhuma regra nova.
-- =====================================================================
