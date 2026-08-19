-- =====================================================================
-- Plataforma ASA — Central de Gestão Administrativa e Financeira
-- Migration 0001 — estrutura inicial (P041)
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo
-- inteiro → Run. É seguro executar mais de uma vez (idempotente).
--
-- Modelo obrigatório (documento de requisitos do cliente, §45):
--   CONTA/NF → PARCELAS → PAGAMENTOS → COMPROVANTES
-- Nenhuma tabela solta sem relacionamento.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. PERFIS E PERMISSÕES
-- =====================================================================

-- Papéis conforme §41 do documento de requisitos do cliente.
do $$ begin
  create type papel_usuario as enum ('gestora', 'administrativo', 'logistico', 'consulta');
exception when duplicate_object then null; end $$;

create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel papel_usuario not null default 'consulta',
  -- Contas particulares da gestora (§22): quem NÃO tem esta permissão
  -- nunca enxerga esses registros — garantido por RLS, não pela interface.
  pode_ver_particular boolean not null default false,
  criado_em timestamptz not null default now()
);

comment on column perfis.pode_ver_particular is
  'Acesso às contas de natureza particular (despesas pessoais da gestora). Bloqueado por RLS.';

-- Cria o perfil automaticamente quando um usuário nasce no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel, pode_ver_particular)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'papel')::papel_usuario, 'consulta'),
    coalesce((new.raw_user_meta_data->>'pode_ver_particular')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper usado em todas as políticas de RLS.
-- SECURITY DEFINER para não exigir que o usuário leia a tabela perfis
-- dentro da própria política (evita recursão).
create or replace function public.pode_ver_particular()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.pode_ver_particular from public.perfis p where p.id = auth.uid()),
    false
  );
$$;

-- =====================================================================
-- 2. TABELAS DE APOIO (cadastrar uma vez, reutilizar — §3/§46)
-- =====================================================================

create table if not exists estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  ordem int not null default 0
);

create table if not exists bancos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  ordem int not null default 0
);

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create unique index if not exists fornecedores_nome_key on fornecedores (lower(nome));
create index if not exists fornecedores_cnpj_idx on fornecedores (cnpj);

-- Estrutura de classificação real da empresa (95 itens em 5 grupos),
-- recuperada da planilha do escritório contábil. NÃO inventar itens novos.
create table if not exists classificacoes (
  id uuid primary key default gen_random_uuid(),
  grupo text not null,
  nome text not null,
  ativo boolean not null default true,
  -- Marca itens cujo enquadramento contábil ainda não foi confirmado
  -- pelo cliente/contador (ver Combustível — pendência registrada).
  confirmacao_pendente boolean not null default false,
  unique (grupo, nome)
);

comment on column classificacoes.confirmacao_pendente is
  'true = grupo contábil ainda não confirmado pelo cliente. Ex.: Combustível.';

-- =====================================================================
-- 3. NÚCLEO FINANCEIRO — CONTA → PARCELAS → PAGAMENTOS → DOCUMENTOS
-- =====================================================================

do $$ begin
  create type natureza_conta as enum ('empresa', 'particular');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_recorrencia as enum ('fixa', 'variavel', 'reajustavel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type periodicidade_conta as enum
    ('semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual');
exception when duplicate_object then null; end $$;

create table if not exists contas (
  id uuid primary key default gen_random_uuid(),

  -- DECISÃO CENTRAL DESTA MISSÃO (§3): obrigatório, sem default.
  -- Quem cadastra é obrigado a dizer se a conta é da empresa ou pessoal.
  natureza natureza_conta not null,

  fornecedor_id uuid references fornecedores(id) on delete restrict,
  numero_documento text,
  descricao text not null,
  valor_inicial numeric(14, 2) not null check (valor_inicial >= 0),

  data_documento date,
  competencia date,
  vencimento date not null,

  estabelecimento_id uuid references estabelecimentos(id) on delete restrict,
  classificacao_id uuid references classificacoes(id) on delete restrict,
  forma_pagamento text,

  total_parcelas int not null default 1 check (total_parcelas >= 1),

  -- Contas recorrentes (§20/§21) — cadastro preparado; a geração
  -- automática das próximas ocorrências fica para missão futura.
  recorrente boolean not null default false,
  recorrencia_tipo tipo_recorrencia,
  periodicidade periodicidade_conta,
  valor_aproximado numeric(14, 2),
  ocorrencias int check (ocorrencias is null or ocorrencias > 0),

  observacoes text,
  cancelada boolean not null default false,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,

  -- Coerência da recorrência: se marcou recorrente, precisa dizer o tipo e a periodicidade.
  constraint contas_recorrencia_coerente check (
    (recorrente = false) or (recorrencia_tipo is not null and periodicidade is not null)
  )
);

create index if not exists contas_natureza_idx on contas (natureza);
create index if not exists contas_vencimento_idx on contas (vencimento);
create index if not exists contas_fornecedor_idx on contas (fornecedor_id);
create index if not exists contas_classificacao_idx on contas (classificacao_id);

create table if not exists parcelas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  numero int not null check (numero >= 1),
  total int not null check (total >= 1),
  valor numeric(14, 2) not null check (valor >= 0),
  -- Vencimentos são informados manualmente: não seguem semana/quinzena/mês (§8).
  vencimento date not null,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, numero)
);

create index if not exists parcelas_conta_idx on parcelas (conta_id);
create index if not exists parcelas_vencimento_idx on parcelas (vencimento);

create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas(id) on delete cascade,
  data_pagamento date not null,
  valor_inicial numeric(14, 2) not null check (valor_inicial >= 0),
  juros numeric(14, 2) not null default 0 check (juros >= 0),
  multa numeric(14, 2) not null default 0 check (multa >= 0),
  desconto numeric(14, 2) not null default 0 check (desconto >= 0),

  -- REGRA DE NEGÓCIO DO CLIENTE (§12), garantida pelo banco e não pela
  -- interface: Valor Pago = Valor Inicial + Juros + Multa − Desconto.
  valor_pago numeric(14, 2) generated always as
    (valor_inicial + juros + multa - desconto) stored,

  banco_id uuid references bancos(id) on delete restrict,
  forma_pagamento text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null
);

create index if not exists pagamentos_parcela_idx on pagamentos (parcela_id);
create index if not exists pagamentos_data_idx on pagamentos (data_pagamento);

-- Estrutura preparada para NF/boleto/comprovante (§27/§28).
-- Upload e Google Drive ficam para missão futura — ver docs/DEPLOY.md e DECISIONS.
do $$ begin
  create type tipo_documento as enum ('nf', 'boleto', 'comprovante', 'outro');
exception when duplicate_object then null; end $$;

create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  parcela_id uuid references parcelas(id) on delete cascade,
  pagamento_id uuid references pagamentos(id) on delete cascade,
  tipo tipo_documento not null default 'outro',
  nome text not null,
  storage_path text,
  url_externa text,
  tamanho_bytes bigint,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null
);

create index if not exists documentos_conta_idx on documentos (conta_id);

-- =====================================================================
-- 4. HISTÓRICO DE ALTERAÇÕES (§42 / item 16 da missão)
-- =====================================================================

create table if not exists historico_alteracoes (
  id bigserial primary key,
  tabela text not null,
  registro_id uuid not null,
  campo text not null,
  valor_anterior text,
  valor_novo text,
  usuario_id uuid references auth.users(id) on delete set null,
  alterado_em timestamptz not null default now()
);

create index if not exists historico_registro_idx on historico_alteracoes (tabela, registro_id);

-- Registra apenas os campos financeiramente relevantes, como pede o §42.
create or replace function public.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campos text[];
  campo text;
  anterior text;
  novo text;
begin
  campos := case tg_table_name
    when 'contas'     then array['valor_inicial','vencimento','classificacao_id','natureza','cancelada']
    when 'parcelas'   then array['valor','vencimento']
    when 'pagamentos' then array['data_pagamento','valor_inicial','juros','multa','desconto','banco_id']
    else array[]::text[]
  end;

  foreach campo in array campos loop
    execute format('select ($1).%I::text, ($2).%I::text', campo, campo)
      into anterior, novo using old, new;

    if anterior is distinct from novo then
      insert into historico_alteracoes (tabela, registro_id, campo, valor_anterior, valor_novo, usuario_id)
      values (tg_table_name, new.id, campo, anterior, novo, auth.uid());
    end if;
  end loop;

  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists contas_historico on contas;
create trigger contas_historico before update on contas
  for each row execute function public.registrar_historico();

drop trigger if exists parcelas_historico on parcelas;
create trigger parcelas_historico before update on parcelas
  for each row execute function public.registrar_historico();

drop trigger if exists pagamentos_historico on pagamentos;
create trigger pagamentos_historico before update on pagamentos
  for each row execute function public.registrar_historico();

-- =====================================================================
-- 5. VISÃO CONSOLIDADA — status calculado, nunca digitado
-- =====================================================================

-- Status derivado do dado real (§9). Não existe campo "status" editável:
-- ele é sempre consequência de vencimento + pagamentos registrados.
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
  end as dias_em_atraso
from parcelas p
join contas c on c.id = p.conta_id
left join fornecedores f on f.id = c.fornecedor_id
left join estabelecimentos e on e.id = c.estabelecimento_id
left join classificacoes cl on cl.id = c.classificacao_id
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

-- A view herda o RLS das tabelas de origem (security_invoker).
alter view vw_parcelas_completo set (security_invoker = on);

-- =====================================================================
-- 6. ROW LEVEL SECURITY
--    Regra de ouro: conta particular só existe para quem tem permissão.
-- =====================================================================

alter table perfis               enable row level security;
alter table estabelecimentos     enable row level security;
alter table bancos               enable row level security;
alter table fornecedores         enable row level security;
alter table classificacoes       enable row level security;
alter table contas               enable row level security;
alter table parcelas             enable row level security;
alter table pagamentos           enable row level security;
alter table documentos           enable row level security;
alter table historico_alteracoes enable row level security;

-- --- Perfis: cada um lê o próprio; gestora lê todos -------------------
drop policy if exists perfis_select on perfis;
create policy perfis_select on perfis for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from perfis p where p.id = auth.uid() and p.papel = 'gestora')
  );

drop policy if exists perfis_update_gestora on perfis;
create policy perfis_update_gestora on perfis for update to authenticated
  using (exists (select 1 from perfis p where p.id = auth.uid() and p.papel = 'gestora'));

-- --- Tabelas de apoio: leitura para todo usuário autenticado ----------
drop policy if exists estabelecimentos_rw on estabelecimentos;
create policy estabelecimentos_rw on estabelecimentos for all to authenticated
  using (true) with check (true);

drop policy if exists bancos_rw on bancos;
create policy bancos_rw on bancos for all to authenticated
  using (true) with check (true);

drop policy if exists fornecedores_rw on fornecedores;
create policy fornecedores_rw on fornecedores for all to authenticated
  using (true) with check (true);

drop policy if exists classificacoes_rw on classificacoes;
create policy classificacoes_rw on classificacoes for all to authenticated
  using (true) with check (true);

-- --- Contas: o coração da separação Empresa x Particular --------------
drop policy if exists contas_select on contas;
create policy contas_select on contas for select to authenticated
  using (natureza = 'empresa' or public.pode_ver_particular());

drop policy if exists contas_insert on contas;
create policy contas_insert on contas for insert to authenticated
  with check (natureza = 'empresa' or public.pode_ver_particular());

drop policy if exists contas_update on contas;
create policy contas_update on contas for update to authenticated
  using (natureza = 'empresa' or public.pode_ver_particular())
  with check (natureza = 'empresa' or public.pode_ver_particular());

drop policy if exists contas_delete on contas;
create policy contas_delete on contas for delete to authenticated
  using (natureza = 'empresa' or public.pode_ver_particular());

-- --- Parcelas / Pagamentos / Documentos: herdam a visibilidade da conta
drop policy if exists parcelas_all on parcelas;
create policy parcelas_all on parcelas for all to authenticated
  using (exists (
    select 1 from contas c where c.id = parcelas.conta_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ))
  with check (exists (
    select 1 from contas c where c.id = parcelas.conta_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ));

drop policy if exists pagamentos_all on pagamentos;
create policy pagamentos_all on pagamentos for all to authenticated
  using (exists (
    select 1 from parcelas p join contas c on c.id = p.conta_id
    where p.id = pagamentos.parcela_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ))
  with check (exists (
    select 1 from parcelas p join contas c on c.id = p.conta_id
    where p.id = pagamentos.parcela_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ));

drop policy if exists documentos_all on documentos;
create policy documentos_all on documentos for all to authenticated
  using (exists (
    select 1 from contas c where c.id = documentos.conta_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ))
  with check (exists (
    select 1 from contas c where c.id = documentos.conta_id
      and (c.natureza = 'empresa' or public.pode_ver_particular())
  ));

-- --- Histórico: leitura para autenticados, escrita só via trigger -----
drop policy if exists historico_select on historico_alteracoes;
create policy historico_select on historico_alteracoes for select to authenticated
  using (true);

-- =====================================================================
-- 7. SEED — listas reais da empresa (nada inventado)
-- =====================================================================

-- Estabelecimentos (aba CLASSIFICAÇÕES da planilha do contador).
insert into estabelecimentos (nome, ordem) values
  ('Matriz', 1),
  ('Filial 01 - Eusebio', 2),
  ('Filial 02 - Asa Serviços', 3),
  ('Filial 03 - Eusebio', 4)
on conflict (nome) do nothing;

-- Bancos / meios de pagamento (mesma aba).
insert into bancos (nome, ordem) values
  ('Tesouraria - Dinheiro', 1),
  ('Banco 1 - CEF', 2),
  ('Banco 2 - BB', 3),
  ('Banco 3 - BNB', 4),
  ('Banco 4 - Nubank', 5),
  ('Banco 5 - CEF - Asa Serviços', 6)
on conflict (nome) do nothing;

-- ---------------------------------------------------------------------
-- 95 classificações em 5 grupos — estrutura real do escritório contábil.
-- ---------------------------------------------------------------------
insert into classificacoes (grupo, nome) values
  ('ADMINISTRATIVAS', 'Água'),
  ('ADMINISTRATIVAS', 'Aluguel'),
  ('ADMINISTRATIVAS', 'Aluguel De Equipamento'),
  ('ADMINISTRATIVAS', 'Aluguel De Veículo'),
  ('ADMINISTRATIVAS', 'Assessoria Contábil'),
  ('ADMINISTRATIVAS', 'Assessoria Jurídica'),
  ('ADMINISTRATIVAS', 'Cartão de Crédito'),
  ('ADMINISTRATIVAS', 'Cartório, Legais e Jurídicos'),
  ('ADMINISTRATIVAS', 'Condomínio'),
  ('ADMINISTRATIVAS', 'Conservação e Limpeza da loja'),
  ('ADMINISTRATIVAS', 'Correios e Malotes'),
  ('ADMINISTRATIVAS', 'Condução Taxi, Uber e 99'),
  ('ADMINISTRATIVAS', 'Energia Elétrica'),
  ('ADMINISTRATIVAS', 'Festas, Comemorações e Confraternizações'),
  ('ADMINISTRATIVAS', 'Fretes'),
  ('ADMINISTRATIVAS', 'Gráfica'),
  ('ADMINISTRATIVAS', 'Hospedagem'),
  ('ADMINISTRATIVAS', 'Informática'),
  ('ADMINISTRATIVAS', 'Internet'),
  ('ADMINISTRATIVAS', 'Manutenção de Máquinas e Equipamentos'),
  ('ADMINISTRATIVAS', 'Manutenção de Veículos'),
  ('ADMINISTRATIVAS', 'Manutenção e Conservação Predial'),
  ('ADMINISTRATIVAS', 'Materiais de Consumo'),
  ('ADMINISTRATIVAS', 'Material de Escritório'),
  ('ADMINISTRATIVAS', 'Material de Informática'),
  ('ADMINISTRATIVAS', 'Material de Limpeza'),
  ('ADMINISTRATIVAS', 'Propaganda, Publicidade e Patrocínio'),
  ('ADMINISTRATIVAS', 'Seguros De Máquinas'),
  ('ADMINISTRATIVAS', 'Seguros De Veículo'),
  ('ADMINISTRATIVAS', 'Seguros Diversos'),
  ('ADMINISTRATIVAS', 'Softwares'),
  ('ADMINISTRATIVAS', 'Taxas e Emolumentos'),
  ('ADMINISTRATIVAS', 'Telefones'),
  ('ADMINISTRATIVAS', 'Viagens'),
  ('ADMINISTRATIVAS', 'Vigilância e Segurança Eletrônica'),

  ('FINANCEIRAS', 'Consórcio'),
  ('FINANCEIRAS', 'Empréstimo'),
  ('FINANCEIRAS', 'Financiamento'),
  ('FINANCEIRAS', 'Investimentos'),
  ('FINANCEIRAS', 'Tarifa Bancária'),
  ('FINANCEIRAS', 'Transferência entre Contas'),
  ('FINANCEIRAS', 'Transferência entre o Grupo de Empresa'),

  ('FUNCIONÁRIOS/PESSOAL', 'Adiantamento de 13º'),
  ('FUNCIONÁRIOS/PESSOAL', 'Adiantamento de Férias'),
  ('FUNCIONÁRIOS/PESSOAL', 'Adiantamento Salarial'),
  ('FUNCIONÁRIOS/PESSOAL', 'Ajuda de Custo'),
  ('FUNCIONÁRIOS/PESSOAL', 'Bolsa De Estudo'),
  ('FUNCIONÁRIOS/PESSOAL', 'Comissão de Funcionários'),
  ('FUNCIONÁRIOS/PESSOAL', 'Diárias'),
  ('FUNCIONÁRIOS/PESSOAL', 'Fardamento'),
  ('FUNCIONÁRIOS/PESSOAL', 'Férias'),
  ('FUNCIONÁRIOS/PESSOAL', 'Gratificação de Função'),
  ('FUNCIONÁRIOS/PESSOAL', 'Horas Extras'),
  ('FUNCIONÁRIOS/PESSOAL', 'Pensão Alimentícia'),
  ('FUNCIONÁRIOS/PESSOAL', 'Plano de Saúde/Odontológico'),
  ('FUNCIONÁRIOS/PESSOAL', 'Pró-Labore'),
  ('FUNCIONÁRIOS/PESSOAL', 'Reembolso'),
  ('FUNCIONÁRIOS/PESSOAL', 'Rescisão'),
  ('FUNCIONÁRIOS/PESSOAL', 'Salário'),
  ('FUNCIONÁRIOS/PESSOAL', 'Treinamento com pessoal'),
  ('FUNCIONÁRIOS/PESSOAL', 'Vale Alimentação'),
  ('FUNCIONÁRIOS/PESSOAL', 'Vale Combustível'),
  ('FUNCIONÁRIOS/PESSOAL', 'Vale Transporte'),

  ('IMPOSTOS', 'COFINS'),
  ('IMPOSTOS', 'CSLL'),
  ('IMPOSTOS', 'CSRF'),
  ('IMPOSTOS', 'FGTS'),
  ('IMPOSTOS', 'FGTS Consignado'),
  ('IMPOSTOS', 'FGTS Rescisório'),
  ('IMPOSTOS', 'ICMS Antecipado'),
  ('IMPOSTOS', 'ICMS DIFAL'),
  ('IMPOSTOS', 'ICMS Dívida Ativa'),
  ('IMPOSTOS', 'ICMS Mensal'),
  ('IMPOSTOS', 'ICMS Normal'),
  ('IMPOSTOS', 'ICMS Substituição Entrada Interestadual'),
  ('IMPOSTOS', 'ICMS Substituição Entrada Interna'),
  ('IMPOSTOS', 'INSS'),
  ('IMPOSTOS', 'IPTU'),
  ('IMPOSTOS', 'IPVA'),
  ('IMPOSTOS', 'IRPJ'),
  ('IMPOSTOS', 'IRRF s/ Aluguel'),
  ('IMPOSTOS', 'IRRF s/ Folha'),
  ('IMPOSTOS', 'IRRF s/ NF'),
  ('IMPOSTOS', 'ISS Próprio'),
  ('IMPOSTOS', 'ISS Substituição Tributária'),
  ('IMPOSTOS', 'Licenciamentos'),
  ('IMPOSTOS', 'Multa de Trânsito'),
  ('IMPOSTOS', 'Multas Fiscais'),
  ('IMPOSTOS', 'Outros pgtos ao Poder Público'),
  ('IMPOSTOS', 'Parcelamentos'),
  ('IMPOSTOS', 'PIS'),
  ('IMPOSTOS', 'Simples'),
  ('IMPOSTOS', 'Taxa do Lixo'),

  ('OUTRAS', 'Adiantamento a Sócios'),
  ('OUTRAS', 'Distribuição de Dividendos')
on conflict (grupo, nome) do nothing;

-- ---------------------------------------------------------------------
-- PENDÊNCIA REGISTRADA (não é invenção da engenharia):
-- O cliente pediu a classificação "Combustível" (§23 do documento de
-- requisitos), mas ela NÃO existe na estrutura atual do escritório
-- contábil — lá só existe "Vale Combustível", em FUNCIONÁRIOS/PESSOAL,
-- que é benefício a funcionário, não abastecimento de frota.
-- O grupo contábil correto não pôde ser determinado com segurança.
-- Ela entra em ADMINISTRATIVAS (vizinha de "Manutenção de Veículos" e
-- "Seguros De Veículo") marcada como confirmacao_pendente = true, para
-- ficar utilizável na demonstração SEM esconder a dúvida.
-- Confirmar o enquadramento com o contador antes do uso definitivo.
-- ---------------------------------------------------------------------
insert into classificacoes (grupo, nome, confirmacao_pendente) values
  ('ADMINISTRATIVAS', 'Combustível', true)
on conflict (grupo, nome) do nothing;

-- =====================================================================
-- 8. RPC — criação atômica de Conta + Parcelas
--
-- SECURITY INVOKER (padrão): roda com as permissões de quem chamou, então
-- o RLS continua valendo. Existe para que uma conta nunca fique gravada
-- sem as parcelas dela (ou o contrário) em caso de falha no meio.
-- =====================================================================

create or replace function public.criar_conta_com_parcelas(
  p_natureza            natureza_conta,
  p_descricao           text,
  p_valor_inicial       numeric,
  p_vencimento          date,
  p_parcelas            jsonb,
  p_fornecedor_nome     text default null,
  p_fornecedor_cnpj     text default null,
  p_numero_documento    text default null,
  p_data_documento      date default null,
  p_competencia         date default null,
  p_estabelecimento_id  uuid default null,
  p_classificacao_id    uuid default null,
  p_forma_pagamento     text default null,
  p_recorrente          boolean default false,
  p_recorrencia_tipo    tipo_recorrencia default null,
  p_periodicidade       periodicidade_conta default null,
  p_valor_aproximado    numeric default null,
  p_ocorrencias         int default null,
  p_observacoes         text default null
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
  -- Fornecedor: reaproveita se já existe, cria se for novo.
  -- É o princípio "cadastrar uma vez e reutilizar" (§3/§46) no banco.
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
      -- Completa o CNPJ se o cadastro anterior estava sem ele.
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
    observacoes, criado_por
  ) values (
    p_natureza, v_fornecedor_id, nullif(btrim(coalesce(p_numero_documento, '')), ''),
    p_descricao, p_valor_inicial, p_data_documento, p_competencia, p_vencimento,
    p_estabelecimento_id, p_classificacao_id, p_forma_pagamento, v_total,
    p_recorrente, p_recorrencia_tipo, p_periodicidade, p_valor_aproximado,
    p_ocorrencias, nullif(btrim(coalesce(p_observacoes, '')), ''), auth.uid()
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
