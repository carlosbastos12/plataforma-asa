-- =====================================================================
-- Migration 0003 — Ajuste da lista de estabelecimentos (P045)
--
-- Correção de DADO (não de estrutura): a lista seedada em 0001 tinha
-- nomes e uma filial que não refletem a lista real da empresa. Ajuste
-- pedido pelo CEO na missão P045.
--
--   "Matriz"                    -> "ASA — Matriz"
--   "Filial 01 - Eusebio"       -> "Filial 01 — Eusébio"
--   "Filial 03 - Eusebio"       -> "Filial 02 — Eusébio" (ordem 3)
--   "Filial 02 - Asa Serviços"  -> desativada (ativo = false)
--
-- Nenhuma linha é excluída: `estabelecimentos.ativo` já existe desde a
-- 0001 e a aplicação já filtra por `ativo = true` — desativar é
-- suficiente para tirar "Filial 02 - Asa Serviços" da lista visível,
-- sem correr o risco de violar `contas.estabelecimento_id ... on delete
-- restrict` caso alguma conta já aponte para essa linha.
--
-- Idempotente: cada UPDATE é condicionado pelo nome ATUAL: reaplicar
-- depois que já rodou uma vez não encontra mais o nome antigo e não
-- faz nada (0 linhas afetadas), sem erro.
-- =====================================================================

update estabelecimentos set nome = 'ASA — Matriz'
  where nome = 'Matriz';

update estabelecimentos set nome = 'Filial 01 — Eusébio'
  where nome = 'Filial 01 - Eusebio';

update estabelecimentos set nome = 'Filial 02 — Eusébio', ordem = 3
  where nome = 'Filial 03 - Eusebio';

update estabelecimentos set ativo = false
  where nome = 'Filial 02 - Asa Serviços';
