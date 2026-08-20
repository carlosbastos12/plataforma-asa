-- =====================================================================
-- Plataforma ASA — Migration 0004
-- Etapas 1–4 do Novo Financeiro (missão de arquitetura + implementação):
--   1. Grupo → Classificação                 (sem mudança de schema —
--      `classificacoes.grupo` já existe desde a 0001; só interface)
--   2. Histórico padronizado                 (novo, esta migration)
--   3. Exportação completa para contabilidade (novo, esta migration:
--      view de grão de PAGAMENTO — ver nota na seção 3)
--   4. Documentos e anexos                    (ativa a tabela `documentos`
--      já existente desde a 0001, com Storage real)
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo
-- inteiro → Run. Idempotente onde tecnicamente possível (mesma
-- convenção das migrations 0001–0003). NÃO aplicada por este agente —
-- sem token de gerência do Supabase nesta sessão (mesma limitação já
-- registrada em D-044/D-045).
--
-- NADA do que já existe é alterado além do estritamente necessário:
-- nenhuma coluna, tabela, RLS ou RPC das migrations 0001–0003 é
-- removida ou tem seu comportamento anterior modificado.
-- =====================================================================

-- =====================================================================
-- 1. HISTÓRICO — coluna em `contas` + catálogo de modelos
-- =====================================================================

-- Campo de texto contábil da NF/conta — NÃO é `historico_alteracoes`
-- (trilha de auditoria técnica, já existente). São dois conceitos com o
-- mesmo nome em português, sem nenhuma relação: este aqui é o campo que
-- a contabilidade lê na exportação (coluna M da planilha real do
-- escritório contábil), não um log de quem mudou o quê.
alter table contas
  add column if not exists historico text;

comment on column contas.historico is
  'Texto contábil do lançamento, exportado para a contabilidade (planilha Lucro Real, coluna "Histórico"). NÃO confundir com historico_alteracoes (auditoria técnica).';

-- Catálogo dos modelos de texto padronizado, extraído literalmente da
-- coluna "Base do Histórico" da planilha real do escritório contábil
-- (CAIXA LUCRO REAL 2026 NOVA - PHP CONTABILIDADE.xlsx, aba
-- CLASSIFICAÇÕES, coluna E). Só a coluna E foi usada: as colunas F/G da
-- mesma linha ("Conf Nf/Doc", "Obs:") apareciam preenchidas em uma única
-- linha de exemplo, sem regra clara de composição com a coluna E — e a
-- fórmula que montava o texto final na planilha real está quebrada
-- (#REF!). Sem uma regra confiável, não foi inventada: o catálogo aqui é
-- só a lista de modelos, oferecida como ponto de partida editável — quem
-- usa completa manualmente (ex.: com o número da NF), como já faz hoje.
create table if not exists modelos_historico (
  id uuid primary key default gen_random_uuid(),
  texto text not null unique,
  ativo boolean not null default true,
  ordem int not null default 0
);

comment on table modelos_historico is
  'Modelos de texto para o campo contas.historico, extraídos da planilha real do escritório contábil. Catálogo de referência — o valor gravado em cada conta é sempre editável.';

alter table modelos_historico enable row level security;

-- Mesmo padrão de leitura/escrita das demais tabelas de apoio
-- (estabelecimentos, bancos, classificacoes): aberta a todo autenticado.
drop policy if exists modelos_historico_rw on modelos_historico;
create policy modelos_historico_rw on modelos_historico for all to authenticated
  using (true) with check (true);

insert into modelos_historico (texto, ordem) values
  ('Vr Ref Pgto', 1),
  ('Pg.Despesa Ref.', 2),
  ('Pg.Duplicata Ref.', 3),
  ('Vr.Transferencia Entre Contas', 4),
  ('Pg.Empréstimo Ref.', 5),
  ('Pg.Imposto Ref.', 6)
on conflict (texto) do nothing;

-- =====================================================================
-- 2. VIEW `vw_parcelas_completo` — reexposta com `historico` no final
--
-- Mesma regra já documentada na 0002: `create or replace view` só
-- aceita coluna nova no FIM da lista (Postgres 42P16 se inserida no
-- meio). Todo o resto da definição é idêntico à versão da 0002.
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
  -- Coluna nova desta migration: precisa ficar por último.
  c.historico
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
-- 3. VIEW NOVA `vw_pagamentos_completo` — grão de PAGAMENTO, não de parcela
--
-- Decisão de arquitetura desta missão (Etapa 3), registrada em
-- DECISIONS.md como D-047: a planilha real do escritório contábil
-- (Lucro Real) tem UMA LINHA POR PAGAMENTO — não por parcela. A view
-- `vw_parcelas_completo` (0001/0002) agrega todos os pagamentos de uma
-- parcela em totais (`total_pago`, `total_juros`...), o que é correto
-- para "quanto falta pagar" mas ERRADO para a exportação contábil: uma
-- parcela paga em duas vezes viraria uma linha só, perdendo a segunda
-- data de pagamento e o segundo banco. Esta view nova é o grão certo
-- para a exportação — não substitui `vw_parcelas_completo` (que continua
-- sendo a fonte de "o que devo", usada no restante do módulo).
-- =====================================================================

create or replace view vw_pagamentos_completo as
select
  pa.id                as pagamento_id,
  pa.parcela_id,
  p.conta_id,
  p.numero             as parcela_numero,
  p.total              as parcela_total,
  pa.data_pagamento,
  c.natureza,
  c.descricao,
  c.numero_documento,
  c.historico,
  c.observacoes,
  c.cancelada,
  f.nome               as fornecedor_nome,
  f.cnpj               as fornecedor_cnpj,
  e.nome               as estabelecimento_nome,
  cl.grupo             as classificacao_grupo,
  cl.nome              as classificacao_nome,
  b.nome               as banco_nome,
  pa.forma_pagamento,
  pa.valor_inicial,
  pa.juros,
  pa.multa,
  pa.desconto,
  pa.valor_pago
from pagamentos pa
join parcelas p on p.id = pa.parcela_id
join contas c on c.id = p.conta_id
left join fornecedores f on f.id = c.fornecedor_id
left join estabelecimentos e on e.id = c.estabelecimento_id
left join classificacoes cl on cl.id = c.classificacao_id
left join bancos b on b.id = pa.banco_id;

-- Mesma garantia das demais views: herda o RLS das tabelas de origem.
-- Uma conta particular de outra pessoa nunca aparece aqui, pelo mesmo
-- RLS de `contas`/`parcelas`/`pagamentos` já em vigor desde a 0001.
alter view vw_pagamentos_completo set (security_invoker = on);

-- =====================================================================
-- 4. RPC `criar_conta_com_parcelas` — ganha `p_historico` no final
--    (DROP + CREATE: acrescentar parâmetro muda a assinatura, mesma
--    razão já documentada na 0002)
-- =====================================================================

drop function if exists public.criar_conta_com_parcelas(
  natureza_conta, text, numeric, date, jsonb,
  text, text, text, date, date, uuid, uuid, text,
  boolean, tipo_recorrencia, periodicidade_conta, numeric, int, text, uuid
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
  p_tipo_despesa_particular_id   uuid default null,
  p_historico                    text default null
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
    observacoes, criado_por, tipo_despesa_particular_id, historico
  ) values (
    p_natureza, v_fornecedor_id, nullif(btrim(coalesce(p_numero_documento, '')), ''),
    p_descricao, p_valor_inicial, p_data_documento, p_competencia, p_vencimento,
    p_estabelecimento_id, p_classificacao_id, p_forma_pagamento, v_total,
    p_recorrente, p_recorrencia_tipo, p_periodicidade, p_valor_aproximado,
    p_ocorrencias, nullif(btrim(coalesce(p_observacoes, '')), ''), auth.uid(),
    p_tipo_despesa_particular_id, nullif(btrim(coalesce(p_historico, '')), '')
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

-- =====================================================================
-- 5. DOCUMENTOS — Storage real para a tabela `documentos` (já existe
--    desde a 0001, sem uso pela aplicação até agora)
-- =====================================================================

-- Bucket PRIVADO (public = false): nenhum arquivo financeiro é servido
-- por URL pública. Todo acesso passa por Signed URL de curta duração,
-- gerada sob demanda por quem já provou (via RLS) que pode ver a conta.
insert into storage.buckets (id, name, public)
values ('financeiro-documentos', 'financeiro-documentos', false)
on conflict (id) do nothing;

-- RLS de storage.objects já vem habilitado por padrão em todo projeto
-- Supabase — este ALTER é só uma garantia explícita, idempotente.

-- Convenção de caminho: '{conta_id}/{uuid}-{nome do arquivo}'. A política
-- não depende de já existir uma linha em `documentos` (o upload acontece
-- ANTES do insert na tabela) — ela verifica a MESMA regra de `contas`
-- (natureza = empresa OU pode_ver_particular()) direto pelo primeiro
-- segmento do caminho, reaproveitando `public.pode_ver_particular()` já
-- existente desde a 0001. Uma conta particular de outra pessoa nunca
-- expõe seus documentos, pelo mesmo motivo que suas linhas em `contas`
-- nunca aparecem.
drop policy if exists financeiro_documentos_select on storage.objects;
create policy financeiro_documentos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'financeiro-documentos'
    and exists (
      select 1 from public.contas c
      where c.id::text = (storage.foldername(name))[1]
        and (c.natureza = 'empresa' or public.pode_ver_particular())
    )
  );

drop policy if exists financeiro_documentos_insert on storage.objects;
create policy financeiro_documentos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'financeiro-documentos'
    and exists (
      select 1 from public.contas c
      where c.id::text = (storage.foldername(name))[1]
        and (c.natureza = 'empresa' or public.pode_ver_particular())
    )
  );

drop policy if exists financeiro_documentos_delete on storage.objects;
create policy financeiro_documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'financeiro-documentos'
    and exists (
      select 1 from public.contas c
      where c.id::text = (storage.foldername(name))[1]
        and (c.natureza = 'empresa' or public.pode_ver_particular())
    )
  );

-- Nenhuma política de UPDATE: um documento enviado não é substituído em
-- lugar — corrigir significa excluir e enviar de novo, mantendo o
-- caminho (e portanto o histórico de storage) sempre imutável.
