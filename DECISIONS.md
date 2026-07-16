# Registro de Decisões — Plataforma-ASA (ADR simplificado)

Decisões tomadas neste projeto e seus motivos. Decisões de produto/arquitetura pendentes de validação com o PM/CEO ficam marcadas como **pendente**.

## D-001 — Plataforma-ASA como projeto novo e independente
- **Decisão:** criar um projeto separado da Auditoria-ASA, sem compartilhar código ou estrutura — apenas conhecimento.
- **Motivo:** a Auditoria-ASA foi um projeto de descoberta com finalidade própria (diagnóstico); misturar seu conteúdo/estrutura ao produto criaria confusão entre o que é achado de auditoria e o que é decisão de produto.

## D-002 — Base de conhecimento é somente consulta
- **Decisão:** `../Auditoria-ASA/` (principalmente `Analise/` e `Calude.md`) é referenciada por link, nunca copiada ou modificada a partir deste projeto.
- **Motivo:** pedido explícito do CEO; preserva a auditoria como fonte íntegra e evita duas versões divergentes do mesmo conhecimento.

## D-003 — Projeto-Embarque como referência de forma, não de conteúdo
- **Decisão:** usar `../Projeto-Embarque/` como inspiração de organização documental e qualidade de experiência — não copiar código nem texto.
- **Motivo:** pedido explícito do CEO; é um projeto do mesmo padrão de qualidade desejado, mas de outro domínio de negócio.

## D-004 — Governança de papéis
- **Decisão:** Carlos (CEO/especialista do negócio) e ChatGPT (PM/Arquiteto da Plataforma) decidem produto e arquitetura; Claude Code (CTO/Engenheiro) implementa. Decisões de produto ainda não validadas ficam registradas como pendência, não decididas unilateralmente pela engenharia.
- **Motivo:** pedido explícito do CEO; evita que a implementação avance sobre decisões que não lhe cabem.

## D-005 — Política permanente de dados fictícios em demonstrações
- **Decisão:** nenhuma tela, protótipo ou demonstração usa dado real da ASA (placas, nomes, valores) — sempre dado sintético com estrutura realista.
- **Motivo:** durante a Auditoria-ASA, um protótipo inicial misturou placas e nomes de motoristas **reais** com valores **fictícios**, o que gerou risco de confusão sobre o que era dado real. A correção feita naquele momento (Protótipo 2 da auditoria, 100% fictício) vira política permanente aqui, adotada preventivamente desde o início.

## D-006 — Estrutura de pastas definida pelo CEO
- **Decisão:** raiz com `CLAUDE.md`, `README.md`, `PROJECT_STATE.md`, `PRODUCT_VISION.md`, `ROADMAP.md`, `DECISIONS.md`, `CHANGELOG.md`; subpastas `docs/`, `frontend/`, `assets/`, `prototipos/`, `pesquisas/`, `referencias/`, `scripts/`.
- **Motivo:** estrutura solicitada explicitamente para o Sprint Zero; não improvisada pela engenharia.

## D-007 — Stack tecnológica do `frontend/` (RESOLVIDA)
- **Contexto:** ficou pendente no Sprint Zero, cabendo ao PM/CEO validar antes de qualquer código.
- **Decisão:** Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + shadcn/ui + Lucide + Motion (framer-motion). Definida diretamente pelo CEO ao abrir a Fase 1 — não foi escolha unilateral da engenharia.
- **Status:** confirmada e implementada em 2026-07-14/15.

## D-010 — Design tokens próprios, não o tema padrão do shadcn
- **Decisão:** paleta customizada (petróleo/teal profundo como cor de marca, cobre queimado como destaque pontual, neutros frios) sobre a base do shadcn, substituindo o tema cinza/zinc padrão gerado pelo `init`. Tipografia: Geist Sans + Geist Mono (já nativas do Next.js), sem mistura de outras famílias.
- **Motivo:** pedido explícito do CEO de identidade própria, sem "cara de template pronto"; o tema padrão do shadcn é reconhecível como genérico.

## D-011 — Escopo da primeira demonstração navegável (Fase 1)
- **Decisão:** 5 telas — Central de Operações (home), Frota (lista + ficha do veículo com documentação/multas/manutenções/linha do tempo), Documentação (vencimentos), Multas e Caixa Particular. Cofre de Credenciais e um módulo de Relatórios/Indicadores separado ficaram fora desta primeira entrega.
- **Motivo:** cobre 4 dos 5 módulos candidatos da auditoria com profundidade, evitando entregar 5 telas rasas; a Central de Operações (home) já cumpre o papel de visão executiva que o Dashboard faria, reduzindo a necessidade de uma 6ª tela nesta fase.

## D-012 — Dataset fictício totalmente novo, sem reaproveitar nem o da Auditoria-ASA nem o do Protótipo 2
- **Decisão:** placas, nomes de motoristas e nomes de parceiros/seguradoras usados em `frontend/src/lib/mock-data.ts` foram inventados especificamente para este projeto — nenhum reaproveita os fictícios já usados no Protótipo 2 da auditoria.
- **Motivo:** pedido explícito do CEO ("é proibido utilizar qualquer informação encontrada durante a Auditoria" — incluindo, por rigor, os dados já fictícios criados durante ela); reforça a independência total entre os dois projetos (D-001).

## D-013 — Verificação sem ferramenta de screenshot (limitação de ambiente)
- **Decisão:** a ferramenta de preview visual (captura de tela do navegador) ficou indisponível durante esta fase. A verificação foi feita por `tsc --noEmit` (tipos), `eslint` (qualidade/regras de React) e requisições HTTP diretas a cada rota, incluindo checagem de status 404 correto e presença do conteúdo esperado no HTML renderizado.
- **Motivo:** transparência sobre o nível de verificação possível; recomenda-se checagem visual humana antes de qualquer apresentação à diretoria.

## D-008 — Sprint Zero limitado a documentação, sem código ou funcionalidade
- **Decisão:** nenhuma tela, componente ou linha de código de aplicação foi criada nesta fase — só estrutura de pastas e documentos estratégicos.
- **Motivo:** pedido explícito do CEO ("Não desenvolver funcionalidades ainda. Primeiro criar toda a arquitetura documental").

## D-009 — Git inicializado, sem commit automático
- **Decisão:** repositório Git local inicializado na raiz do projeto. Nenhum commit foi criado automaticamente.
- **Motivo:** boa prática de engenharia iniciar versionamento desde o Sprint Zero; commits só são feitos mediante pedido explícito, por política geral de segurança do fluxo de trabalho.

## D-014 — Navegação reorganizada por setor, não por módulo (Missão 02)
- **Decisão:** os módulos entregues na Fase 1 (Frota, Documentação, Multas, Caixa Particular) deixaram de ser itens de navegação de primeiro nível. Passaram a viver dentro de três setores — **Acionamento**, **Gestão da Frota**, **Fechamento** — que refletem a organização real da ASA identificada pelo CEO. Rotas migradas: `/frota` → `/gestao-da-frota/veiculos`, `/documentacao` → `/gestao-da-frota/documentacao`, `/multas` → `/gestao-da-frota/multas`, `/caixa` → `/fechamento/caixa`.
- **Motivo:** pedido explícito do CEO — "o usuário deve sentir que o sistema foi desenvolvido especificamente para a forma como a ASA trabalha", não como uma coleção de módulos genéricos.

## D-015 — Fechamento tratado como conceito visual, sem regra de negócio inventada
- **Decisão:** dentro do setor Fechamento, apenas o Caixa Particular (já validado na Fase 1) é funcional. Conferência de Serviços, Consolidação e Seguradoras aparecem como cartões visuais, marcados "conceito, a definir", sem tabela, dado ou fluxo simulando uma regra de negócio.
- **Motivo:** pedido explícito do CEO — o processo de Fechamento da ASA ainda não é totalmente compreendido; inventar uma regra aqui criaria o risco de a demonstração implicar um entendimento do negócio que ainda não existe.

## D-016 — Identidade visual por setor usando os tokens já existentes
- **Decisão:** cada setor recebeu uma cor de identidade (Acionamento = `--chart-3`, Gestão da Frota = `--primary`, Fechamento = `--brand-accent`) — todas já definidas nos design tokens da Fase 1 (D-010). Nenhuma cor nova foi introduzida.
- **Motivo:** o pedido do CEO foi "cada setor com identidade própria, mas toda a plataforma com a mesma linguagem visual" — reaproveitar tokens existentes cumpre os dois lados sem fragmentar a paleta.

## D-017 — Skill "frontend-design": não habilitada como plugin, lida diretamente do disco
- **Contexto:** o CEO pediu o uso obrigatório da skill Anthropic "frontend-design" antes de qualquer implementação. A ferramenta de skills não a reconheceu (`Unknown skill: frontend-design`) porque o plugin existe no cache de marketplace do usuário (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/`) mas não está habilitado para este projeto (sem `enabledPlugins` em nenhum `settings.json`).
- **Decisão:** em vez de simular o uso da skill ou prosseguir sem ela, o arquivo `SKILL.md` do plugin foi lido diretamente do disco e seus princípios aplicados de forma real e verificável — não apenas citados. Ver relatório da Missão 02 para o detalhamento de onde cada princípio foi aplicado.
- **Motivo:** transparência é inegociável — reportar "skill utilizada" sem que isso fosse verdade quebraria a confiança no restante do relatório. Habilitar o plugin de fato (via `/plugin` ou configuração) é uma ação que cabe ao usuário, não à engenharia.

## D-018 — Alternância de tema claro/escuro adicionada (`next-themes`)
- **Decisão:** os tokens de modo escuro existiam desde a Fase 1 (D-010) mas nunca ficaram acessíveis ao usuário. Adicionada a dependência `next-themes` e um botão de alternância no topo, com padrão claro (`defaultTheme="light"`, `enableSystem={false}`).
- **Motivo:** decisão própria de engenharia (mandato desta missão: "melhorar acessibilidade", "surpreenda"). Optei por **não** seguir o tema do sistema operacional automaticamente — o público-alvo tem baixo conhecimento em informática, e um app que muda de aparência sozinho (por causa de uma configuração do Windows que o usuário nem sabe que existe) tende a confundir mais do que ajudar. O usuário escolhe, o sistema lembra.

## D-019 — Sub-navegação por abas dentro de cada setor
- **Decisão:** `Gestão da Frota` e `Fechamento` ganharam uma barra de abas fixa (Visão geral + cada área real do setor), presente em todas as páginas daquele setor. O hub deixou de ser a única porta de entrada.
- **Motivo:** revisão crítica própria (não foi pedido por Carlos nem pelo PM). A reorganização por setor da Missão 02 resolveu um problema (organização) mas criou outro: Veículos, Documentação e Multas, que eram 1 clique a partir do menu principal na Fase 1, passaram a exigir 2 cliques (menu → hub → cartão). Isso é uma regressão de usabilidade que nenhuma das instruções anteriores pediu para corrigir — decidi corrigir mesmo assim, porque contradiz o princípio "cada tela deve responder apenas uma pergunta: o que o usuário precisa resolver agora" já registrado no `CLAUDE.md`.

## D-020 — Remoção de contagens duplicadas (Acionamento e Central de Operações)
- **Decisão:** os 3 cartões de estatística no topo do Acionamento foram substituídos por um único indicador contextual, porque as colunas do próprio quadro já mostram a mesma contagem. Na Central de Operações, a seção de indicadores rápidos (frota total, documentação em dia, saldo do caixa) foi removida — o fluxo de setores, que já existia, mostra a mesma urgência de forma mais acionável.
- **Motivo:** revisão crítica própria. Mostrar o mesmo número duas vezes na mesma tela (ou a uma rolagem de distância) não é reforço, é ruído — e cada card a mais é mais uma coisa para o usuário (de baixo conhecimento técnico) precisar entender antes de agir.

## D-021 — Busca global adicionada ao topo
- **Decisão:** campo de busca no topo (visível a partir de telas médias), pesquisando por placa/motorista (leva à ficha do veículo) ou por número de chamado/cliente (leva ao Acionamento). Já existia um padrão equivalente no Protótipo 2 da auditoria (conceito, não código — nada foi copiado); a Plataforma-ASA real ainda não tinha isso.
- **Motivo:** decisão própria de engenharia, fora do que foi pedido explicitamente. Justificativa: é a forma mais rápida de fazer alguém "sentir que o sistema é real" — digitar uma placa e cair direto na ficha certa é o tipo de detalhe que separa protótipo de produto.

## D-022 — Estados vazios elegantes (`EmptyState`)
- **Decisão:** criado `src/components/empty-state.tsx`, um componente compartilhado (ícone + título + descrição, variante `compact` para uso dentro de tabelas) e aplicado onde havia listas/tabelas sem nenhum tratamento visual para o caso "nada aqui" — grade de frota (`frota-grid.tsx`), tabela de documentação e tabela de multas.
- **Motivo:** item explícito da missão "Preparação para Apresentação" — um estado vazio sem tratamento (linha em branco, tabela sem linhas) é um dos sinais mais visíveis de protótipo inacabado.

## D-023 — Ações de demonstração com resposta real (toast + mudança de estado local)
- **Decisão:** os botões "Despachar motorista" (Acionamento) e "Fechar caixa do dia" (Fechamento) passaram a alterar o estado local do React de verdade — o chamado muda de coluna com motorista/placa atribuídos, o caixa muda para "Fechado" — e mostram um `toast.success` confirmando a ação, com o texto deixando claro que é uma ação simulada nesta demonstração. "Fechar caixa" tem uma espera simulada de 700ms com spinner antes de confirmar.
- **Motivo:** item explícito da missão. Um botão que não faz nada visível ao ser clicado é o segundo sinal mais visível de protótipo inacabado, logo depois de estados vazios sem tratamento — mesmo sem persistência real (fora de escopo nesta fase), a interação precisa parecer completa.

## D-024 — Busca global com atraso simulado e esqueleto de carregamento
- **Decisão:** a busca global (D-021) ganhou uma latência simulada de 220ms entre a digitação e o resultado, com um esqueleto (`Skeleton`) de 3 linhas exibido durante esse intervalo. Implementada com dois estados (`query` imediato e `debouncedQuery` atualizado só dentro do `setTimeout`) em vez de uma flag `buscando` própria, porque a primeira versão (`setState` síncrono no corpo do efeito, incluindo no caminho "campo vazio") violava a regra `react-hooks/set-state-in-effect` do ESLint do projeto — o `buscando` correto é *derivado* da comparação entre os dois estados, não guardado à parte.
- **Motivo:** item explícito da missão ("carregamentos simulados onde fizer sentido"). Uma busca que responde instantaneamente demais não parece estar consultando nada de verdade.

## D-025 — Licença proprietária para publicação
- **Decisão:** `LICENSE` na raiz do projeto com texto de "todos os direitos reservados" atribuído à CASB Tecnologia, não uma licença open-source (MIT/Apache/etc.).
- **Motivo:** decisão própria de engenharia, já que o pedido do CEO ("preparar para publicação no GitHub") não especificou o tipo de licença. Este é um produto de demonstração para um cliente específico (ASA), não uma biblioteca de código aberto — uma licença permissiva convidaria reuso que não é a intenção. **Pendência:** se o repositório for público, confirmar com o CEO se este texto reflete a intenção real (ex.: se a ASA deveria ser citada como titular dos dados de negócio que inspiraram o produto) antes da publicação.

## D-026 — A auditoria é invisível na interface do produto
- **Decisão:** regra permanente ditada pelo CEO. Nenhum texto visível ao usuário final (títulos, descrições, cards, botões, tooltips, estados vazios) pode mencionar planilhas, auditoria, documentos auditados ou a origem das funcionalidades ("identificamos durante a análise", "com base nas planilhas", "substitui a planilha X"). Toda descrição de funcionalidade responde apenas: o que faz, qual problema resolve, qual benefício entrega, como facilita o trabalho. Menções à auditoria continuam permitidas na documentação interna do repositório e em comentários de código.
- **Motivo:** a auditoria é ferramenta interna de engenharia de produto, não parte da experiência do usuário. A plataforma deve transmitir a sensação de ter sido desenvolvida especificamente para a operação da empresa, como se sempre tivesse existido assim.
- **Aplicação inicial:** quatro textos de interface foram reescritos nesta data (título do Caixa Particular, título de Multas, descrição do setor Gestão da Frota e tooltip "Trabalha junto com o AUTEM" da barra lateral).

## D-027 — Redesign P027: uma pergunta por tela, decisão antes de registro
- **Decisão:** cada tela do produto tem uma única pergunta como título, e todo conteúdo dela existe para responder essa pergunta no padrão estado → consequência → próxima ação → benefício. Tabelas foram eliminadas das telas de decisão (Multas, ficha do veículo) em favor de cards, checklists e listas com consequência explícita; o primitivo `ui/table.tsx` foi removido do projeto. Toda ação clicável (Despachar, Indicar condutor, Fechar caixa, indicadores da home) explica em tooltip o que faz, o que resolve e o que evita.
- **Motivo:** missão P027 do CEO — a plataforma deve transmitir confiança, controle e inteligência operacional, não apenas exibir informação. Uma tabela pede que o usuário descubra o problema; um card de decisão entrega o problema já diagnosticado com a ação pronta.
- **Nota sobre D-015:** os cartões conceituais do Fechamento (Conferência, Consolidação, Seguradoras) seguem desativados e sem regra de negócio inventada, mas o rótulo mudou de "conceito, a definir" para "em breve" — a honestidade sobre o escopo se mantém, sem expor vocabulário interno de produto na interface.

## D-028 — Experiência premium: acolhimento antes de cobrança (P029)
- **Decisão:** a plataforma se apresenta antes de pedir qualquer coisa. (1) Onboarding "Conheça a Plataforma ASA" em 4 etapas na primeira visita, reabrível pelo topo — explica os setores e os benefícios, nunca a origem das funcionalidades. (2) A home abre com tranquilidade: saudação calma + faixa "Sob controle" (o que está em ordem e vigiado) antes das decisões — isto substitui a ordem "indicadores primeiro" da P027, por autorização explícita da missão. (3) Sidebar sem moldura (sem bloco/borda), com o propósito e o benefício de cada setor no hover.
- **Motivo:** a comparação com o Projeto-Embarque mostrou que o que o torna agradável não é o visual, e sim o acolhimento: ele recebe, explica e conduz. Os princípios foram transportados; nenhum código ou conteúdo foi copiado (D-003 respeitada — Embarque fala de intercâmbio, a ASA fala da sua operação).

## D-029 — Ecossistema da plataforma: Cadastros, Relatórios e Configurações como experiência (P030)
- **Decisão:** a plataforma ganha o entorno de produto completo sem nenhuma regra de negócio nova: (1) **Cadastros** com tela genérica única orientada por dados (`src/lib/cadastros.ts`) — 9 cadastros que se apresentam antes de listar; Veículos/Motoristas/Seguradoras derivam do dataset existente para manter uma única fonte fictícia. (2) **Relatórios** apenas como experiência: cards que explicam a leitura + exemplo ilustrativo em dialog, sem gerar nada. (3) **Configurações** idem, com Usuários apontando para o cadastro real e o restante respondendo com honestidade ao clique. (4) Navegação separada em "Setores" (fluxo do dia) e "Plataforma" (apoio).
- **Motivo:** missão P030 — transmitir maturidade de produto pronto. A separação Setores/Plataforma preserva o princípio "ação antes de gráfico": o fluxo do dia continua em primeiro; cadastros e relatórios são apoio, não protagonistas.
- **Limite honesto:** nada disso cria persistência — ações de "novo registro" e áreas de configuração respondem como demonstração, nunca fingindo gravar de verdade.

## D-030 — Identidade visual: princípios do Protótipo 1 sobre a arquitetura atual (P032)
- **Decisão:** recuperados do Protótipo 1 (pasta `Auditoria-ASA/Analise/prototipo/`, consulta somente-leitura): elevação de repouso em toda superfície, chip de placa escuro como assinatura visual, título de página dominante, estado ativo da navegação em petróleo sólido, logo com gradiente e largura máxima de conteúdo. Nada foi copiado — o protótipo usa azul/HTML estático; a plataforma mantém a paleta petróleo/cobre (D-010) e a arquitetura atual.
- **Motivo:** avaliação do CEO na missão P032: o Protótipo 1 transmite sensação mais leve e profissional. O diagnóstico técnico: ele tem contenção (painéis), profundidade calma (sombras constantes) e detalhes de assinatura; a versão atual tinha seções soltas, elevação só no hover e nenhum elemento distintivo.
- **Fluxo inferido documentado (não corrigido, a pedido da missão):** "Despachar motorista" no Acionamento atribui automaticamente o próximo veículo livre da frota — regra inventada para a demonstração (Missão 02), sem validação com a operação real. Revisar quando a rodada operacional acontecer.

## D-031 — Voz do Cliente como fonte oficial de requisitos (P033)
- **Decisão:** criado [docs/BUSINESS/VOZ_DO_CLIENTE.md](../docs/BUSINESS/VOZ_DO_CLIENTE.md), documento permanente com dores relatadas por colaboradores da ASA Reboques (primeiro registro: VDC-001, Vitor — Operação da Frota). A partir de agora, toda melhoria de produto deve poder se justificar por um registro nesse documento. Novas entrevistas se acumulam como novos registros, nunca sobrescrevendo os anteriores.
- **Motivo:** missão P033 — a plataforma deixa de responder só à auditoria original e passa a responder também à voz direta de quem opera. Mesma regra de invisibilidade da auditoria (D-026) se aplica: o documento nunca é referenciado na interface.
- **Duas novas áreas responderam a dores específicas:** **Combustível** (`/gestao-da-frota/combustivel`, dores 5 e 15 — tanque da base e abastecimento externo, hoje sem visão unificada) e **Equipe Operacional** (`/equipe-operacional`, dores 8/9/10 — faltas, atestados e escala controlados manualmente).
- **Pendência registrada, não resolvida nesta missão:** rastreabilidade de alterações (dor 11 — "quem mudou o quê e quando") exige persistência real e trilha de auditoria de dados, incompatível com a fase atual sem backend (CLAUDE.md §6). Fica para quando houver banco de dados.

## D-032 — Home mostra a operação, não módulos (P034)
- **Decisão:** nova ordem fixa na home: saudação → leitura do assistente → dashboard executivo (6 números grandes: frota apta, veículos indisponíveis, documentos vencendo, diesel disponível, equipe disponível, chamados aguardando) → Decidir agora (**no máximo 3** itens, cada um com consequência + motivo + ação, nunca um status isolado) → Tudo sob controle → fluxo operacional. `kpi-strip.tsx` e `task-list.tsx` removidos, substituídos por `dashboard-executivo.tsx` e `decidir-agora.tsx`.
- **Motivo:** missão P034 — a home parecia uma lista de módulos; agora responde diretamente "como está a operação" com a mesma hierarquia estado→consequência→ação já usada na ficha do veículo (D-027).
- **Fluxo operacional expandido para 5 estações:** Acionamento → Gestão da Frota → Equipe Operacional → Combustível → Fechamento (`SectorFlow`), refletindo o caminho real descrito por Vitor (VDC-001) — o guincho não roda sem motorista disponível nem sem diesel.

## D-033 — Prontuário do veículo e identidade menos administrativa (P034)
- **Decisão:** (1) A ficha do veículo abre por padrão em "Histórico completo" (linha do tempo unificando documentos, multas, manutenção e combustível), não mais em "Documentação" — o usuário não precisa mais cruzar abas para entender um veículo, inspirado nos dois protótipos internos (Auditoria-ASA/Analise/prototipo e Prototipo 2). (2) Gestão da Frota ganhou uma faixa de 4 indicadores grandes no topo do hub (frota apta, documentação em dia, pendências críticas, diesel disponível), como nos protótipos. (3) Equipe Operacional ganhou banners de impacto por ausência, na linguagem literal do relato do Vitor ("Substituído por Carlos — nenhum chamado ficou descoberto"). (4) Sidebar com contraste reduzido — item ativo por texto colorido + fundo sutil (`bg-primary/8`), não mais preenchimento sólido — para o conteúdo da página, não a navegação, ser o elemento mais forte da tela.
- **Motivo:** avaliação do CEO — a plataforma ainda soava como ERP genérico. Os protótipos internos (referência de forma, D-003) mostram hierarquia mais contida; o Embarque (referência de experiência) mostra acolhimento. Nenhum conteúdo de nenhuma fonte foi copiado.
- **Nota:** não houve alteração de regra de negócio, backend ou dado — apenas reorganização de UI sobre o dataset e as funções de `insights.ts` já existentes.

## D-034 — Releitura estratégica da auditoria: mapa da operação como fonte permanente (P035)
- **Decisão:** três documentos novos e permanentes em `docs/BUSINESS/`: [MAPA_DA_OPERACAO.md](../docs/BUSINESS/MAPA_DA_OPERACAO.md) (perfil de 25 áreas da operação, reconstruído a partir de `Auditoria-ASA/Analise/02` a `07` e da estrutura de pastas real), [INVENTARIO_FUNCIONAL.md](../docs/BUSINESS/INVENTARIO_FUNCIONAL.md) (funções/documentos/fluxos/rotinas/controles/funcionalidades pendentes por área) e [BACKLOG_ESTRATEGICO.md](../docs/BUSINESS/BACKLOG_ESTRATEGICO.md) (cruzamento com o estado atual da plataforma e priorização Alta/Média/Baixa). Nenhum código foi alterado nesta missão — é análise pura.
- **Motivo:** missão P035 — sair de "quais planilhas a empresa usa" para "como a empresa funciona". Reforça que a plataforma deve representar o processo real, nunca a planilha (mesmo princípio de D-005/D-012).
- **Achado que muda prioridade:** o **Cofre de Credenciais** (Módulo 4 do MVP original da auditoria, prioridade Crítica em `05_Oportunidades_Encontradas.md`) é o único item de prioridade máxima da auditoria original que **segue sem nenhuma representação na plataforma**, apesar de pendente desde a Missão 02 ([ROADMAP.md](../ROADMAP.md)). Recomendado como próximo item de maior prioridade — ver BACKLOG_ESTRATEGICO.md §2.1.
- **Achado fora do escopo de produto, mas urgente como ação operacional:** arquivos de folha de pagamento (`Folha Quinzena Funcionários`) de 2025-2026 têm risco ativo de corrupção/perda de dado (erro de criptografia legada, arquivos protegidos sem política consistente) — não é uma funcionalidade a construir, é uma recomendação de recuperação/backup imediato fora desta plataforma.
- **Pendências de conhecimento explicitamente não resolvidas:** ver BACKLOG_ESTRATEGICO.md §6 (estoque formal de peças, fluxo de cobrança/NF a clientes, lista vigente de parceiros, volume real de admissão/demissão e vistoria, regra de qual razão social se aplica a cada evento).

## D-035 — Clone visual completo do Protótipo 1, a pedido explícito do CEO
- **Decisão:** o CEO pediu, com uma captura de tela do Protótipo 1 em mãos, para a plataforma adotar aquela aparência. Perguntado sobre o alcance (dado o histórico de decisões na direção oposta), escolheu explicitamente "clone visual completo". Isso **reverte três decisões/mudanças anteriores**: a sidebar clara adotada na missão P025 (nunca formalizada como decisão numerada — volta a ser escura, `#0D1B2E`), o uso da paleta petróleo/cobre em D-010 (a cor de marca vira o azul `#145DA8` do protótipo, com tons crítico/atenção/ok/info nos hex exatos dele) e D-027 (tabelas eliminadas por cards — a tabela volta como primitivo (`ui/table.tsx`) e é usada em Documentação, Multas, Caixa Particular e no novo Dashboard).
- **O que foi feito:** tokens de design inteiramente retonalizados (`globals.css`); sidebar escura com item ativo em azul sólido; três componentes de gráfico SVG (`components/charts/`) — porta fiel da matemática de `assets/js/main.js` do protótipo (linha, barra, rosca), agora responsivos via `ResizeObserver`; componentes `Panel`/`KpiCard` no padrão exato do protótipo; a **Home foi inteiramente reconstruída** para espelhar a captura de tela (KPI grid de 4 cards → gráfico de linha do Caixa → gráfico de barra de Multas → tabela de Próximos Vencimentos → coluna de Alertas/Donut/Ações rápidas); Documentação, Multas e Caixa Particular convertidas para tabela + filtros + gráfico, seguindo `documentos.html`/`multas.html`/`caixa.html` do protótipo.
- **O que foi propositalmente preservado:** a home-assistente das missões P029/P033/P034 (`Greeting`, `LeituraOperacional`, `DecidirAgora`, `TudoSobControle`, `SectorFlow`) não aparece na captura de tela do protótipo e foi removida da Home — os arquivos, órfãos após a troca, foram deletados (git preserva o histórico). Os setores criados nas missões P030/P033 sem equivalente no protótipo (Cadastros, Relatórios, Configurações, Combustível, Equipe Operacional) foram apenas retonalizados (herdam a nova paleta automaticamente pelos tokens semânticos), não convertidos para tabela — não há uma tela do protótipo para clonar nesses casos, e não é apropriado inventar um layout "no estilo do protótipo" sem uma referência real.
- **Nada foi copiado do protótipo em código** — todos os componentes foram reescritos em React/TypeScript sobre a arquitetura existente; a semelhança é deliberadamente visual, por decisão explícita do CEO, não um vestígio de atalho técnico.
- **Nota de governança:** este é o primeiro caso do projeto em que uma missão pede explicitamente para *aumentar* a semelhança com o protótipo depois de múltiplas decisões documentadas na direção contrária. Registrado aqui para que missões futuras não revertam a sidebar escura/D-010/D-027 por engano, achando que houve um erro — foi decisão consciente, tomada com o histórico completo apresentado ao CEO antes da escolha.

## D-036 — Combustível como experiência completa: entrada, abastecimento e inteligência (P036)
- **Decisão:** `/gestao-da-frota/combustivel` deixa de ser leitura passiva (tanque + externo lado a lado) e ganha o ciclo completo: botão **Registrar Entrada de Combustível** (modal com fornecedor, NF, litros, valor total/por litro, tipo — compra/complemento/ajuste) e **Registrar Abastecimento** (modal com veículo, motorista, odômetro, litros, origem Tanque da Base/Posto Externo — campos condicionais por origem). Ambos atualizam o estoque **na tela, ao vivo** (estado React local, não persistido) e disparam toast confirmando o recálculo de autonomia. Nova tabela "Últimos abastecimentos" unificando base+externo com quem registrou e status; timeline "Movimentações do Estoque" em formato de extrato; painel "Inteligência Operacional" com leituras fictícias ancoradas no dado real (autonomia, abastecimento acima da média, veículos fora da base na semana, próxima compra recomendada).
- **Motivo:** missão P036 — demonstrar exatamente como o cliente vai controlar o diesel quando o sistema existir, sem backend. Nomenclatura do botão principal ("Registrar Entrada de Combustível", não "Cadastrar Combustível") por sugestão explícita do CEO — linguagem mais próxima da rotina real da operação.
- **Nota técnica:** funções de `lib/combustivel.ts` (estoque, autonomia, histórico, insights) foram parametrizadas para aceitar os arrays de estado ao vivo, mantendo os parâmetros padrão para os call sites que já existiam (home, hub da frota, ficha do veículo) — nenhum desses precisou mudar.

## D-037 — Equipe Operacional como módulo operacional, não RH (P037)
- **Decisão:** `/equipe-operacional` ganha dashboard de 8 indicadores (ativos, em serviço, folga, férias, atestados, faltas, escalas abertas, precisa de substituição), 4 ações (Novo Colaborador, Registrar Atestado, Registrar Falta, Registrar Férias — os três últimos como um único componente parametrizado por tipo), quadro de escala por equipe (Alfa/Bravo/Charlie, cada uma amarrada a um turno Manhã/Tarde/Noite) com efetivo disponível por cartão, painéis de Inteligência Operacional / Atenção Necessária / Atividade Recente, ficha do colaborador em painel lateral (histórico de ausências e escalas, documentação, observações) e calendário mensal com folgas/férias/atestados/faltas/treinamentos/escalas no mesmo mapa.
- **Motivo:** missão P037, ancorada na dor de Vitor (VOZ_DO_CLIENTE.md, VDC-001) e na observação da própria auditoria (`MAPA_DA_OPERACAO.md`): a equipe não é "RH" isolado — uma ausência muda a capacidade de atender chamado. Cada ausência registrada já mostra se afeta a escala e quem cobre, e o status do colaborador (disponível/atestado/férias) muda ao vivo na tela ao registrar.
- **Nota técnica:** mesmo padrão de estado ao vivo do D-036 — `quadroDeEscala`, `insightsEquipe` e `alertasEquipe` em `lib/equipe.ts` foram parametrizados para aceitar os arrays de colaboradores/ausências vindos do componente, com os defaults estáticos preservados para os call sites existentes (home).
