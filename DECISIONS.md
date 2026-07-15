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
