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

### Alterado — Missão P027: Redesign da Experiência (2026-07-15)
Redesign completo da experiência, absorvendo também os ajustes da auditoria de UX P025 que estavam na árvore de trabalho (sidebar clara, faixa de indicadores na home, documentação por urgência):
- **Cada tela responde uma única pergunta**, exibida como título e alinhada na navegação: home ("Como está a minha operação hoje?"), Acionamento ("Quem precisa da minha atenção agora?"), Veículos ("Quais veículos impedem a operação?"), Documentação ("O que pode interromper a operação?"), Multas ("O que pode gerar prejuízo?"), Fechamento ("O que falta para concluir os fechamentos?") (D-027).
- **Fim das tabelas nas telas de decisão**: Multas passou da tabela com filtros para os cards de decisão com prazo em contagem regressiva (`MultasCards`); as abas de Multas e Manutenções da ficha do veículo viraram listas com ícone de estado e consequência por linha. `multas-table.tsx`, `documentacao-table.tsx` e o primitivo `ui/table.tsx` foram removidos — zero `<table>` no produto.
- **Veredicto operacional em toda a frota**: os cards de veículo agora mostram o veredicto ("pode operar hoje?") com motivo e próxima ação; a grade ordena impedidos primeiro; a ficha do veículo abre com um banner de veredicto no padrão estado → consequência → ação.
- **Fechamento virou checklist**: o hub lista cada caixa com estado, saldo e a ação que conclui ("Conferir e fechar"), respondendo o que falta em vez de só apresentar áreas.
- **Acionamento prioriza a fila**: o cabeçalho diz quantos clientes esperam e desde quando (o mais antigo primeiro); o botão "Despachar motorista" explica em tooltip o que faz e o que evita.
- **Toda ação explica seu propósito**: tooltips de propósito também em "Fechar caixa do dia" e nos indicadores da home (como cada número é calculado).
- **Navegação mais leve**: grupo "Setores" rotulado na sidebar, mais respiro entre itens, badges de pendência com explicação no hover.
- Linguagem revisada para benefício em títulos e subtítulos de todas as telas.
- Sem commit nesta missão (publicação tratada na Missão P028).

### Alterado — Missão P029: Experiência Premium (2026-07-15)
Transporte dos princípios de experiência do Projeto-Embarque (acolhimento, explicação, descoberta) — sem copiar código nem conteúdo:
- **Onboarding "Conheça a Plataforma ASA"** (D-028): apresentação em 4 etapas na primeira visita (boas-vindas → setores interativos → "o sistema trabalha antes de você" → entrar), reabrível pelo botão de ajuda no topo; persistência em `localStorage`.
- **Home tranquilidade-first** (D-028, substitui a ordem da P027): saudação em tom calmo ("A operação segue rodando") + faixa **"Sob controle"** com o que já está em ordem e vigiado, antes de qualquer pendência; depois decisões, números e fluxo.
- **Sidebar sem moldura**: fundo integrado à página (sem bloco nem borda), item ativo como pill flutuante com sombra, mais respiro; **cada item de navegação explica no hover** o que faz, o benefício e a pendência atual (campo `beneficio` em `nav-items`).
- Botão de ajuda (`?`) no topo reabre a apresentação a qualquer momento.
- Verificação: `eslint` limpo, `npm run build` concluído (21 páginas). Sem commit/push/deploy nesta missão.

### Adicionado — Missão P030: Ecossistema Premium (2026-07-15)
A plataforma deixa de ser um conjunto de telas de setor e ganha o entorno de um produto completo (D-029):
- **Cadastros** (`/cadastros` + `/cadastros/[tipo]`): hub com 9 cadastros — Veículos, Motoristas, Seguradoras, Empresas Parceiras, Fornecedores, Postos de Combustível, Tipos de Manutenção, Tipos de Documento e Usuários. Tela genérica única (`src/lib/cadastros.ts` + `[tipo]/page.tsx`): cada cadastro abre se explicando (o que faz, problema que resolve, quem utiliza, benefício) antes de listar os registros. Veículos/Motoristas/Seguradoras derivam do dataset existente; o restante é fictício novo (D-005).
- **Relatórios** (`/relatorios`): 6 relatórios como experiência, sem backend — Operacional, Documentação, Multas, Manutenção, Combustível e Fechamentos. Cada card explica o que mostra, para quem e o benefício, com "Ver exemplo" abrindo uma leitura ilustrativa em dialog.
- **Configurações** (`/configuracoes`): Usuários (leva ao cadastro real), Permissões, Alertas, Preferências, Notificações e Integrações (em breve) — cada card com o que é + benefício; cliques respondem com honestidade sobre o que é demonstração.
- **Navegação em grupos**: sidebar agora tem "Setores" (fluxo do dia) e "Plataforma" (Cadastros, Relatórios, Configurações), todos com propósito e benefício no hover; topbar reconhece as novas áreas.
- **Estados vazios com ação**: `EmptyState` ganhou botão de ação; coluna vazia do quadro de chamados explica em vez de dizer "nada por aqui".
- Verificação: `eslint` limpo, `npm run build` concluído (33 páginas). Sem commit/push/deploy nesta missão.

### Alterado — Missão P031: Marca "ASA Reboques" (2026-07-15)
- Todos os textos visíveis padronizados para a marca institucional: título da aba, onboarding (2), aria-label da ajuda, selo da sidebar ("ASA Reboques") e tooltip do AUTEM. Comentários internos e documentação técnica intactos. 6 textos em 5 arquivos.

### Alterado — Missão P032: Recuperação da identidade visual (2026-07-15)
Princípios visuais do Protótipo 1 (Auditoria-ASA, referência de forma) transportados para a arquitetura atual, sem alterar fluxo, navegação ou componentes (D-030):
- **Elevação de repouso**: token `--shadow-card` + regra global — todo cartão/painel (`bg-card` arredondado) descansa sobre sombra suave, como no Protótipo 1; hovers existentes continuam vencendo.
- **Chip de placa escuro** (`.placa-chip`): assinatura visual do Protótipo 1 recuperada — placas em chip de alto contraste monoespaçado em 7 pontos da interface (frota, ficha, documentação, multas, caixa).
- **Hierarquia**: título da página na topbar de 15px/semibold → 17px/bold; valores dos indicadores da home em bold.
- **Sidebar**: item ativo em petróleo sólido com texto claro (estado confiante do Protótipo 1) e logo com gradiente petróleo→azul-petróleo.
- **Equilíbrio**: conteúdo com largura máxima (max-w-6xl) centralizada em telas largas e mais respiro vertical.
- **Gráficos**: a versão atual não possui gráficos; decisão consciente de não introduzi-los nesta missão (princípio "ação antes de gráfico").
- Verificação: `eslint`, `tsc --noEmit` e `npm run build` limpos (33 páginas).

### Adicionado — Missão P033: Orientada às dores reais da operação (2026-07-15)
Novo documento permanente [docs/BUSINESS/VOZ_DO_CLIENTE.md](../docs/BUSINESS/VOZ_DO_CLIENTE.md) (D-031) registra 15 dores relatadas por um colaborador da frota (VDC-001) como requisitos oficiais de produto — nunca referenciado na interface:
- **Home como assistente**: nova `LeituraOperacional` (substitui a faixa "Sob controle" da P029) traduz o estado da plataforma em frases prontas — estoque de diesel em dias de autonomia, documentos vencendo, multas pendentes, ausência que afeta a escala — cada uma citando o dado que a sustenta, nunca um número cru. Saudação da home ajustada para o mesmo tom ("O sistema encontrou N pontos que merecem atenção").
- **Combustível** (`/gestao-da-frota/combustivel`, nova aba real — substitui o cartão "conceito futuro"): dois fluxos que hoje vivem separados — Tanque da Base (estoque, autonomia em dias, movimentações) e Abastecimento Externo (posto, motorista, viagem, litros, valor).
- **Equipe Operacional** (`/equipe-operacional`, novo setor): Escala por dia/turno, Faltas e atestados (com impacto na escala e substituto já indicados) e Disponibilidade da equipe.
- **Histórico do veículo completo**: ficha do veículo ganhou aba "Combustível" com os abastecimentos externos daquele veículo — nenhuma informação some entre históricos separados.
- Hub de Gestão da Frota reforça a centralização (documentação, multas, combustível, manutenção, certificados, AET, tacógrafo) em linguagem amigável.
- Verificação: `eslint`, `tsc --noEmit` e `npm run build` limpos (35 páginas).

### Alterado — Missão P034: Orientada à operação real (2026-07-15)
Fontes revisadas: VOZ_DO_CLIENTE.md, DECISIONS.md, os dois protótipos internos (`Auditoria-ASA/Analise/prototipo` e `Prototipo 2`) e o Embarque como referência de experiência (D-032, D-033):
- **Home remodelada**: nova ordem saudação → leitura do assistente → **dashboard executivo** (6 cards grandes: frota apta, veículos indisponíveis, documentos vencendo, diesel disponível, equipe disponível, chamados aguardando) → **Decidir agora** (máx. 3, sempre consequência+motivo+ação) → **Tudo sob controle** → **fluxo operacional de 5 estações** (Acionamento → Frota → Equipe → Combustível → Fechamento). `kpi-strip.tsx` e `task-list.tsx` removidos.
- **Ficha do veículo como prontuário**: abre por padrão em "Histórico completo" (linha do tempo unificando documentos, multas, manutenção e combustível — antes só tinha os três primeiros).
- **Gestão da Frota**: faixa de 4 indicadores grandes no topo do hub (inspirada nos protótipos internos).
- **Equipe Operacional**: banner de impacto por ausência na linguagem do relato do Vitor ("Substituído por X — nenhum chamado ficou descoberto" / "Ainda sem substituto — turno em risco").
- **Combustível**: nota de prestação de contas na aba externa (posto/motorista/viagem/litros/valor já prontos, sem depender de recibo).
- **Sidebar**: item ativo com contraste reduzido (texto colorido + fundo sutil, sem preenchimento sólido) — o conteúdo da página volta a ser o elemento mais forte da tela.
- Verificação: `eslint`, `tsc --noEmit` e `npm run build` limpos (35 páginas). Sem commit/push desta missão até a rodada de publicação.

### Alterado — Clone visual completo do Protótipo 1 (2026-07-15)
A pedido explícito do CEO (D-035), reverte a sidebar clara da P025, D-010 e D-027 na direção do Protótipo 1:
- **Tokens**: paleta petróleo/cobre substituída pelo azul institucional `#145DA8` + tons crítico/atenção/ok/info nos hex exatos do protótipo; sidebar volta a ser escura (`#0D1B2E`).
- **3 gráficos SVG novos** (`components/charts/`: linha, barra, rosca) — porta fiel do motor `assets/js/main.js` do protótipo, responsivos via `ResizeObserver`.
- **Tabela reintroduzida** (`ui/table.tsx`, removida na P027) — usada no novo Dashboard, em Documentação, Multas e Caixa Particular.
- **Home inteiramente reconstruída**: KPI grid (4 cards) → gráfico de Caixa (linha, 30 dias) → gráfico de Multas por mês (barra) → tabela de Próximos Vencimentos → coluna de Alertas recentes + Multas por órgão (rosca) + Ações rápidas. Substitui a home-assistente das P029/P033/P034 (`Greeting`, `LeituraOperacional`, `DecidirAgora`, `TudoSobControle`, `SectorFlow` — removidos, órfãos).
- **Documentação**: abas por tipo (Todos/AET/IPVA-Licenciamento/Seguro/Tacógrafo) + filtros + tabela única, substitui `documentacao-por-urgencia.tsx`.
- **Multas**: tabela + filtros + donut "por órgão" + ranking de motoristas por valor + fluxo de indicação, substitui `multas-cards.tsx`.
- **Caixa Particular**: KPI grid + gráfico de fechamento diário + tabela de lançamentos + donut "por forma de pagamento", mantendo a seleção de dia e o fechamento com um toque já existentes.
- Novo dataset ilustrativo isolado (`lib/dashboard-demo.ts`) só para dar forma aos gráficos de 30 dias/6 meses — não deriva de nem altera o dataset de negócio real (D-005).
- Verificação: `eslint`, `tsc --noEmit`, `npm run build` (35 páginas) e todas as rotas testadas via HTTP (200) com o dev server local.

### Adicionado — Missão P036: Gestão Inteligente do Combustível (2026-07-16)
`/gestao-da-frota/combustivel` (D-036) ganha o ciclo completo, com estoque reativo na tela (estado local, sem backend):
- Botão **Registrar Entrada de Combustível** — modal com fornecedor, nº da NF, data, litros, valor total (calcula valor/litro ao vivo), tipo (Compra/Complemento/Ajuste de estoque), observações. Toast: "Entrada registrada. O estoque disponível foi atualizado automaticamente."
- Botão **Registrar Abastecimento** — modal com veículo, motorista (preenchido automaticamente), data, odômetro, litros, origem (Tanque da Base/Posto Externo) com campos condicionais (posto, cidade, valor, forma de pagamento para externo). Toast: "Estoque atualizado automaticamente. Autonomia estimada recalculada para N dia(s)."
- KPI grid respondendo as 4 perguntas da missão: quanto resta, como entra, como sai, quem abasteceu.
- Tabela "Últimos abastecimentos" (base + externo unificados, com quem registrou e status), timeline "Movimentações do Estoque" em formato de extrato, painel "Inteligência Operacional" com leituras fictícias ancoradas no dado real.
- Verificação: `eslint`, `tsc --noEmit`, `npm run build` (35 páginas), rotas testadas via HTTP.

### Adicionado — Missão P037: Equipe Operacional como módulo demonstrativo (2026-07-16)
`/equipe-operacional` (D-037) deixa de ser uma lista simples e vira um dos módulos mais completos da plataforma:
- Dashboard com 8 indicadores: colaboradores ativos, em serviço, folga, férias, atestados, faltas, escalas abertas, precisa de substituição.
- 4 ações — **Novo Colaborador**, **Registrar Atestado**, **Registrar Falta**, **Registrar Férias** — cada uma explicando o que faz e o benefício no tooltip; registrar atestado/férias já muda o status do colaborador na tela.
- **Escala Operacional**: quadro com uma coluna por turno (Manhã/Tarde/Noite), um cartão por equipe (Alfa/Bravo/Charlie) mostrando Motorista/Operador/Apoio e status individual, com efetivo disponível em destaque.
- **Ficha do colaborador** (painel lateral, abre ao clicar em qualquer nome): dados, histórico de ausências, histórico de escalas, documentação/treinamentos, observações.
- **Calendário mensal**: folgas, férias, atestados, faltas, treinamentos e escalas no mesmo mapa, com detalhe do dia selecionado.
- Painéis "Inteligência Operacional", "Atenção necessária" e "Atividade recente".
- Verificação: `eslint`, `tsc --noEmit`, `npm run build` (35 páginas), rotas testadas via HTTP.
