# Changelog — Plataforma-ASA

Formato baseado em *Keep a Changelog*. Datas em AAAA-MM-DD.

## [Unreleased]

### Adicionado — Sprint Zero (2026-07-14)
- Início oficial do projeto **Plataforma-ASA**, separado da Auditoria-ASA (que passa a existir apenas como base de conhecimento, somente-leitura).
- Estrutura de pastas: `docs/`, `frontend/`, `assets/`, `prototipos/`, `pesquisas/`, `referencias/`, `scripts/`.
- Documentos estratégicos criados: [CLAUDE.md](CLAUDE.md), [README.md](README.md), [PROJECT_STATE.md](PROJECT_STATE.md), [PRODUCT_VISION.md](PRODUCT_VISION.md), [ROADMAP.md](ROADMAP.md), [DECISIONS.md](DECISIONS.md).
- Governança de papéis registrada (CEO, PM/Arquiteto, CTO/Engenheiro).
- Política permanente de dados fictícios em demonstrações (ver D-005 em [DECISIONS.md](DECISIONS.md)).
- Repositório Git inicializado (sem commit).

### Adicionado — Fase 1: primeira demonstração navegável (2026-07-15)
- Aplicação **Next.js 16 (App Router) + React + TypeScript** criada em `frontend/`, com **Tailwind CSS v4**, **shadcn/ui**, **Lucide** e **Motion** (framer-motion) — stack confirmada pelo CEO (D-007).
- Design tokens próprios: paleta petróleo/teal + cobre queimado, tipografia Geist, substituindo o tema padrão cinza do shadcn (D-010).
- Casca do produto: barra lateral com navegação e contagem de pendências críticas, barra superior com busca e data, menu lateral responsivo (Sheet) para telas pequenas.
- **Central de Operações** (`/`): saudação conversacional adaptada ao horário, lista de tarefas priorizadas por urgência com animação de entrada, indicadores rápidos (frota, documentação em dia, saldo do caixa).
- **Frota** (`/frota` e `/frota/[placa]`): busca e filtro por categoria/situação; ficha do veículo com abas de Documentação (semáforo), Multas, Manutenções e Linha do Tempo cronológica.
- **Documentação** (`/documentacao`): todos os vencimentos da frota em uma tabela única, com busca e filtro por tipo/status.
- **Multas** (`/multas`): indicadores de valor em aberto/aguardando indicação/pagas, tabela com busca e filtro por órgão/status.
- **Caixa Particular** (`/caixa`): seleção de dia, entradas/saídas/saldo, lançamentos e ação de fechamento.
- Dataset fictício próprio (`frontend/src/lib/mock-data.ts`), sem reaproveitar nenhum dado da Auditoria-ASA nem dos protótipos anteriores (D-012).
- Verificação: `tsc --noEmit` e `eslint` limpos; todas as 6 rotas testadas via HTTP (incluindo 404 correto para placa inexistente). Verificação visual por screenshot não foi possível nesta sessão (D-013).

### Pendências abertas ao final da Fase 1
- Verificação visual humana antes de qualquer apresentação (D-013 em [DECISIONS.md](DECISIONS.md)).
- Validar com o PM se Cofre de Credenciais e/ou Relatórios entram na próxima entrega (D-011 em [DECISIONS.md](DECISIONS.md)).

### Alterado — Missão 02: Arquitetura da Experiência Operacional (2026-07-15)
- **Navegação reorganizada por setor real da ASA**, não mais por módulo (D-014): Acionamento, Gestão da Frota e Fechamento substituem os itens soltos Frota/Documentação/Multas/Caixa na navegação principal.
- Rotas migradas: `/frota` → `/gestao-da-frota/veiculos`, `/documentacao` → `/gestao-da-frota/documentacao`, `/multas` → `/gestao-da-frota/multas`, `/caixa` → `/fechamento/caixa`. Rotas antigas confirmadas 404 (sem sobra).
- **Central de Operações** ganhou um elemento novo: um fluxo visual conectando os três setores na ordem real da operação (o chamado nasce no Acionamento → a frota executa/mantém → o Fechamento consolida), com contagem ao vivo de pendências por setor.
- **Novo setor Acionamento** (`/acionamento`): quadro de chamados ativos por status (aguardando despacho, despachado, em atendimento, concluído), com dataset fictício próprio criado para esta missão.
- **Gestão da Frota** (`/gestao-da-frota`) e **Fechamento** (`/fechamento`) ganharam páginas-hub reunindo suas respectivas áreas reais e sinalizando, com cartões visuais desativados, escopo futuro (Combustível, Vistorias, Compras / Conferência de Serviços, Consolidação, Seguradoras) — sem inventar regra de negócio para nenhuma delas (D-015).
- Identidade visual própria por setor, reaproveitando os tokens de cor já definidos na Fase 1 — nenhuma cor nova (D-016).
- Skill Anthropic "frontend-design" consultada diretamente do plugin em disco (não estava habilitada no projeto) — ver D-017 e o relatório desta missão para onde seus princípios foram aplicados.
- Verificação: `tsc --noEmit` e `eslint` limpos; todas as rotas novas testadas via HTTP, rotas antigas confirmadas 404.

### Pendências abertas ao final da Missão 02
- Verificação visual humana antes de qualquer apresentação.
- Entender o processo real de Fechamento com a equipe ASA antes de sair do conceito visual (D-015).
- Decidir, com o PM, a profundidade do setor Acionamento nas próximas entregas.

### Corrigido — Missão 03: Sprint de Valor para o Cliente (2026-07-15)
Auditoria de UX própria (não solicitada explicitamente, feita por iniciativa da engenharia) seguida de correções:
- **Sub-navegação por abas** dentro de Gestão da Frota e Fechamento (D-019) — Veículos, Documentação e Multas voltam a estar a 1 clique de distância de qualquer página do setor, corrigindo uma regressão de cliques introduzida pela reorganização da Missão 02.
- **Contagens duplicadas removidas**: cartões de estatística do Acionamento (já mostrados nas colunas do próprio quadro) e a seção de indicadores rápidos da Central de Operações (já coberta pelo fluxo de setores) (D-020).
- **Busca global** no topo, por placa/motorista ou por chamado, levando direto à tela certa — não fazia parte de nenhuma missão anterior (D-021).
- **Tema claro/escuro**, alternável pelo usuário — os tokens já existiam desde a Fase 1 e nunca tinham ficado acessíveis (D-018).
- Verificação: `tsc --noEmit` e `eslint` limpos; todas as rotas testadas via HTTP.

### Pendências abertas ao final da Missão 03
- Verificação visual humana antes de qualquer apresentação — segue sem ferramenta de screenshot disponível nesta sessão.
- Entender o processo real de Fechamento com a equipe ASA (D-015).
- Ver o relatório da Missão 03 para a nota atribuída à plataforma e o parecer de aprovação para apresentação.

### Corrigido — Missão 03: Preparação para Apresentação (2026-07-14)
Polimento visual e de acabamento, sem nenhuma funcionalidade nova de negócio:
- **Estados vazios elegantes** em toda lista/tabela que podia ficar em branco (frota, documentação, multas) via componente compartilhado `EmptyState` (D-022).
- **Ações de demonstração com resposta real**: "Despachar motorista" e "Fechar caixa do dia" agora mudam o estado da tela e confirmam com um toast, em vez de não fazer nada visível ao serem clicados (D-023).
- **Busca global** ganhou latência simulada e esqueleto de carregamento, para não parecer instantânea demais para ser real (D-024).
- Investigação de possível bug de overflow horizontal em tabelas em telas pequenas — confirmado como falso alarme (o wrapper do `<Table>` do shadcn já trata o scroll corretamente).
- Verificação completa: `tsc --noEmit` limpo, `eslint .` limpo (0 erros, incluindo a correção do `react-hooks/set-state-in-effect` na busca global — ver D-024), `npm run build` concluído com sucesso (21 páginas, todas estáticas ou SSG), todas as rotas testadas via HTTP retornando 200 (e 404 correto para rota inexistente).
- Preparação para publicação: `LICENSE` (D-025), `frontend/.env.example`, `frontend/README.md` criado/atualizado com a estrutura de rotas atual por setor.

### Pendências abertas ao final desta rodada
- Verificação visual humana antes da apresentação à diretoria — segue sem ferramenta de screenshot disponível nesta sessão; todas as evidências de qualidade são de código (tipos, lint, build, HTTP), não visuais.
- Confirmar com o CEO se o texto de `LICENSE` (D-025) reflete a intenção real antes de tornar o repositório público.
- Ver o checklist de publicação entregue ao final desta missão para o passo a passo de GitHub e Vercel.
