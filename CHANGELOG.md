# Changelog — Plataforma-ASA

Formato baseado em *Keep a Changelog*. Datas em AAAA-MM-DD.

## [Unreleased]

### Adicionado — Importador de despesas por planilha, primeira versão (2026-08-20)
Novo botão **"Importar AutEM"** em Financeiro → Contas a Pagar (D-050). Nenhuma alteração em autenticação, proxy, RLS, Storage ou permissões:
- **⚠️ O layout usado para homologação é FICTÍCIO.** Nenhum arquivo real de exportação de despesas da AutEM foi recebido até aqui — as colunas reconhecidas reproduzem apenas a lista de campos informada pelo Vitor. **O layout oficial ainda precisa ser validado com um arquivo real.**
- **Fluxo em dois passos, sem exceção:** escolher arquivo → o sistema lê e mostra a prévia (novos / já existentes / possível duplicidade / com problema) → só depois de confirmar é que algo é gravado. A confirmação reenvia o arquivo e o servidor refaz a análise do zero: nada do que a tela calculou é aceito como verdade.
- **Camada de mapeamento isolada** (`lib/importacao/mapeamento.ts`): colunas reconhecidas pelo NOME normalizado, não pela posição. Quando o arquivo real chegar, o ajuste é neste arquivo só. Não se assume nome de coluna, posição, número de abas, linha do cabeçalho nem formato de data.
- **Leitor de XLSX próprio, sem dependência nova** — mesma razão do gerador que o projeto já tinha. Lê ZIP armazenado e deflate, shared strings, fórmulas, e usa `styles.xml` para reconhecer células de data. Roda só no servidor (confirmado: não aparece no bundle do cliente).
- **Duplicidade em quatro níveis**, do mais forte ao mais fraco: identificador da origem → chave da importação anterior → CNPJ + documento + vencimento → fornecedor + valor + vencimento. **A coincidência fraca nunca bloqueia sozinha**: vira "Possível duplicidade — verificar", com caixa de seleção para você decidir. Repetição dentro do próprio arquivo também é pega.
- **Reimportar não duplica e não apaga nada.** Lançamento já existente é pulado — a importação não atualiza conta nenhuma. Classificação, estabelecimento, histórico e anexos que você completou continuam intactos por construção.
- **Categoria, Centro de custo e Tipo são avisados, não inventados**: aparecem como "sem correspondência no ASA" na prévia. Colunas desconhecidas são guardadas junto da conta, nunca descartadas.
- **Valores e datas** usam o leitor em português corrigido em D-049, com a distinção certa entre célula numérica e de texto. Data que não dá para entender marca a linha como problema — nunca é importada em silêncio.
- **Planilha de homologação fictícia** em `docs/homologacao/`, gerada por `scripts/gerar-planilha-homologacao.mjs`, com 12 linhas cobrindo caminho feliz, valores em milhar, parcelas, repetição e três tipos de problema.
- **⚠️ Migration `0005_origem_importacao.sql` ainda NÃO aplicada** (sem token de gerência nesta sessão). Enquanto isso, o importador se **recusa a funcionar** e explica o motivo na tela — importar sem o registro de origem geraria duplicidade silenciosa numa próxima importação.

### Corrigido — Editar conta: valor total, leitura de números em português e bloqueios explicados (2026-08-20)
Revisão campo a campo entre "Nova conta" e "Editar conta" (D-049). Nenhuma migration, RLS, autenticação ou permissão foi tocada:
- **Corrigida a leitura de valores digitados em português** — o bug mais sério desta rodada. Todo campo de dinheiro usava `Number(texto.replace(",", "."))`, que troca só a primeira vírgula e não conhece separador de milhar: `"1.500,50"` virava `0` (daí a mensagem *"Informe um valor maior que zero"* com o campo preenchido) e, pior, **`"1.500"` virava `1,5` — gravando R$ 1,50 no lugar de R$ 1.500,00, sem erro nenhum na tela**. Afetava o valor da conta, o de cada parcela e, em "Registrar pagamento", valor pago/juros/multa/desconto. Substituído pelo leitor `paraNumero`, validado em 22 casos.
- **"Valor total (R$)" agora existe em Editar conta.** Estava simplesmente ausente do formulário. É **editável enquanto a conta tem uma parcela e nenhum pagamento** — e nesse caso a parcela é atualizada junto com o cabeçalho. Nos demais casos aparece bloqueado, com o motivo escrito ("já possui pagamento registrado", "conta parcelada", "conta cancelada") em vez de sumir sem explicação.
- **Vencimento passou a valer de verdade em conta de parcela única.** Antes, editar a data gravava só o cabeçalho e a tabela continuava mostrando a data antiga — a edição parecia não funcionar. Em conta parcelada nada muda (cada parcela mantém a sua data) e a tela agora diz isso.
- **Natureza (Empresa × Particular) segue bloqueada, agora com o motivo na tela:** conta da empresa vai para o fechamento da contabilidade e conta particular nunca vai.
- **Aviso "(a confirmar)" agora também na edição** — existia só no cadastro. Marca a classificação **Combustível**, cujo enquadramento contábil ainda precisa ser confirmado com a contabilidade (pendência de negócio registrada desde a 0001, não um defeito).
- A regra de integridade vive em `lib/financeiro/regras.ts` e é aplicada **nos dois lados**: a tela usa para explicar, a Server Action usa para decidir, relendo o estado da conta no banco — o formulário nunca é a autoridade.

### Corrigido / Adicionado — Finalização das Etapas 1–4: usabilidade, ajuda contextual e navegação mais rápida (2026-08-20)
Ajustes apontados no teste real das Etapas 1–4, sem nenhuma mudança de banco, RLS, autenticação ou permissão (D-048):
- **Visualizar documento agora ABRE o arquivo** em vez de pedir para salvar. O link assinado passou a ter dois modos — `visualizar` (o navegador exibe o PDF/imagem) e `baixar` (salva no computador), agora em botões separados na lista. O bucket continua **privado** e o link continua assinado e expirando em **2 minutos**: nada mudou em segurança, só o cabeçalho de entrega do arquivo.
- **Janela "Documentos da conta" mais larga** (`sm:max-w-3xl`/`lg:max-w-4xl`): todos os campos de cada documento (nome, tipo, data, tamanho, ações) cabem sem rolagem horizontal, e a rolagem **vertical** ficou restrita à lista — o cabeçalho e o envio permanecem fixos por mais documentos que existam. Em tela estreita os campos empilham, sem barra lateral.
- **Novo mecanismo reutilizável de ajuda — botão "ⓘ Como funciona?"** (`components/ajuda/como-funciona.tsx`): pop-up curto, em linguagem do dia a dia, com tópicos e exemplos passados por propriedade — nada amarrado a uma tela. Estreado em **Financeiro → Relatórios → Fechamento para a Contabilidade** (Período, Pendências, Histórico, XLSX, PDF e por que as particulares nunca entram). Sem tour, sem onboarding, sem manual externo.
- **Navegação do Financeiro mais rápida:** o layout do módulo chamava `carregarFinanceiro()` **sem filtro de natureza** — todas as parcelas, todos os pagamentos e as seis tabelas de apoio — só para decidir se a aba "Contas Particulares" aparece, e a página em seguida repetia a consulta. Agora o layout usa `podeVerParticular()`, e sessão/perfil são memorizados por requisição com `cache` do React: layout e página compartilham a mesma leitura em vez de refazê-la. Nenhuma barreira foi afrouxada — o cache dura só uma renderização, a sessão continua validada pelo Supabase e o RLS segue valendo em toda consulta.
- **Envio de documento com Content-Type de reserva por extensão**, para o caso raro de o navegador não informar o tipo do arquivo — sem isso, o "Visualizar" desses arquivos voltaria a baixar.

### Adicionado — Novo Financeiro, Etapas 1–4: Grupo→Classificação, Histórico, exportação contábil e documentos (2026-08-20)
Primeiras 4 etapas da arquitetura recomendada para o Novo Financeiro (D-047):
- **Grupo → Classificação**: cadastro e edição de conta agora pedem o grupo contábil primeiro; a Classificação só mostra os itens daquele grupo, em vez de uma lista única com 96 opções agrupadas visualmente.
- **Histórico**: novo campo `contas.historico`, com catálogo `modelos_historico` (6 modelos reais extraídos da planilha do escritório contábil) como ponto de partida editável. Só aparece para contas Empresa — como Classificação/Estabelecimento.
- **Exportação para a contabilidade**: nova exportação `exportarFechamentoContabilXlsx/Pdf`, no grão de PAGAMENTO (não de parcela), com as 13 colunas exatas da planilha real (Data do PAGTO … Histórico) — ativa no painel "Fechamento para a Contabilidade" de `/financeiro/relatorios`, filtrada por data de pagamento. A exportação de contas existente ganhou as colunas Grupo, Observações e Histórico.
- **Documentos e anexos**: a tabela `documentos` (existia desde a 0001, sem uso) ganhou Storage real — bucket privado `financeiro-documentos`, RLS própria, acesso só por Signed URL de 2 minutos. Novo item "Documentos" no menu de cada conta: enviar NF/boleto/comprovante/outro (até 15 MB), listar, abrir e excluir.
- **Migration nova `0004_historico_grupo_documentos.sql` — ✅ aplicada no banco real em 2026-08-20**, em transação, com todos os objetos confirmados por consulta direta ao banco (coluna, tabela, view, RPC, bucket e políticas de Storage). O RLS existente da Central Financeira foi conferido contra um snapshot pré-migration e está inalterado.
- **Ajuste feito durante a aplicação:** removida da migration a linha `alter table storage.objects enable row level security;` — o papel da Management API não é dono de `storage.objects` (erro `42501`), e a linha era redundante (RLS já vem ligado por padrão nessa tabela, confirmado no banco). Criar políticas nessa tabela funciona normalmente; alterá-la não.
- Fora do escopo desta missão, por instrução explícita: importador da AutEM, vínculo Multa↔Conta, `contas.veiculo_id`, vínculo Abastecimento↔Conta, integração Financeiro→Caixa.

### Adicionado — Missão P046: editar e remover contas cadastradas (2026-08-19)
Contas a pagar já cadastradas ganharam um menu de ações por linha (D-046):
- **Editar conta**: reabre os campos do cadastro pré-preenchidos (Fornecedor/Favorecido, documento, descrição, vencimento, Classificação/Estabelecimento ou Tipo de despesa particular, forma de pagamento, observações, recorrência). Natureza não é editável; parcelas/valores já lançados não são tocados.
- **Remover conta**: apaga de vez — só oferecida quando a conta nunca recebeu pagamento.
- **Cancelar conta**: quando já existe pagamento registrado, a conta é marcada como `cancelada` em vez de apagada, preservando o histórico financeiro (o gatilho de auditoria só captura alterações, não exclusões).
- Ambas pedem confirmação num diálogo próprio antes de executar.
- Nenhuma migration nova: as políticas de RLS para update/delete de `contas` já existiam desde a 0001.

### Corrigido — Missão P045: lista de estabelecimentos e acesso aos tipos de despesa particular (2026-08-19)
Dois problemas de uso real reportados na tela "Nova conta a pagar" (D-045):
- **Migration `0003_ajuste_estabelecimentos.sql` aplicada no banco real**: lista de estabelecimentos corrigida para refletir a empresa real — `ASA — Matriz`, `Filial 01 — Eusébio`, `Filial 02 — Eusébio`. "Filial 02 - Asa Serviços" foi desativada (não excluída, para não arriscar violar a referência de contas antigas).
- **"Gerenciar tipos" agora aparece dentro do cadastro de conta**: o diálogo de tipos de despesa particular (D-044) passou a ser acessível direto ao lado do campo "Tipo de despesa particular" no `NovaContaDialog`, não só no cabeçalho de `/financeiro/particulares`. Antes, quem abria "Nova conta" a partir da página Empresa e escolhia "Particular" não tinha como criar um tipo sem fechar o formulário e navegar até outra página.

### Adicionado — Missão P044: Tipos de despesa particular, Favorecido e correção de Select (2026-08-19)
Fecha a pendência deixada em D-043 e corrige um bug de exibição (D-044):
- **Nova migration `0002_tipos_despesa_particular.sql`** (ainda não aplicada no banco — ver pendência abaixo): tabela `tipos_despesa_particular` com dono (`dono_id`) e RLS restrita ao próprio dono; coluna `contas.tipo_despesa_particular_id`; view `vw_parcelas_completo` e RPC `criar_conta_com_parcelas` recriadas para incluir o novo campo.
- **Tela "Meus tipos de despesa"** (`/financeiro/particulares`): cadastrar, renomear, ativar/desativar e excluir, com sugestões de um clique (Água, Energia, Aluguel, Internet, Escola, Cartão, Outros).
- **Formulário de nova conta**, fluxo Particular: Fornecedor vira **Favorecido** (mesma coluna, sem CNPJ/datalist), Classificação vira **Tipo de despesa particular**, e Estabelecimento/Nº documento/Data documento somem — só os campos que fazem sentido para despesa pessoal.
- **Correção: Select mostrando UUID em vez do nome** — Classificação, Estabelecimento, Tipo de despesa particular (novo), Banco (registrar pagamento) e Status (filtro) agora mostram o rótulo correto. Causa: o `Select` do projeto não usa a API `items` do base-ui; sem ela, o valor exibido cai para o dado bruto quando o `value` do item não é o próprio texto (ex.: um UUID).
- **⚠️ Pendência — migration não aplicada:** sem acesso a token de gerência do Supabase nesta sessão. Enquanto isso, a Central Financeira segue funcionando normalmente — a consulta nova falha isolada e devolve lista vazia (testado ao vivo contra o projeto real). Aplicar `supabase/migrations/0002_tipos_despesa_particular.sql` manualmente para o recurso funcionar de ponta a ponta.

### Alterado — Missão P043: Estabelecimento só em conta Empresa (2026-08-19)
Cadastro de conta particular fica mais direto (D-043) — apenas interface, nenhuma alteração de banco, migration, RLS ou permissão:
- Campo **Estabelecimento** some quando a natureza é **Particular** (no cadastro e no filtro da aba de particulares); segue igual para conta Empresa, com as filiais reais.
- O estabelecimento eventualmente já escolhido é descartado ao marcar "Particular" e novamente no envio — conta particular não grava vínculo com filial nem por engano.
- **Não implementado, registrado como pendência:** lista de "tipos de despesa particular" (Água, Aluguel, Internet…) cadastrada pela própria pessoa — exige migration (nova tabela + coluna + RLS por dono + parâmetro na RPC). A tabela `classificacoes` **não serve** para isso: é a estrutura contábil da empresa e seu RLS é aberto a todo autenticado, o que exporia os tipos pessoais da gestora ao administrativo. Detalhamento em D-043.

### Corrigido — Missão P042: login passa a ser exigido em toda a plataforma (2026-08-19)
Correção de controle de acesso (D-042): o `proxy.ts` protegia só `/financeiro/:path*`; qualquer outra rota interna (Central de Operações, Cadastros, Relatórios, Gestão da Frota, Equipe Operacional, Fechamento) ficava acessível digitando a URL direto, sem sessão.
- `proxy.ts` invertido de denylist para allowlist: só `/login`, `/recuperar-senha` e `/atualizar-senha` seguem públicas — toda outra rota exige sessão válida, com `matcher` cobrindo todas as rotas de página.
- Pós-login sem `?proximo=` agora volta para `/` (antes ia para `/financeiro`), coerente com a plataforma inteira exigir login.
- Nenhuma migration, RLS, tabela financeira, regra Empresa × Particular ou funcionalidade de módulo foi alterada — só roteamento de acesso.

### Adicionado — Missão P041.1: identidade de sessão, logout e recuperação de senha (2026-08-19)
Fecha lacunas de autenticação deixadas pela P041: identidade fixa no topo e nenhuma forma de sair ou recuperar senha.
- Tela de login com identidade "SIGA — Sistema Integrado de Gestão ASA", substituindo o texto "Complementar ao AUTEM".
- Avatar do topo (`Topbar`) passa a mostrar nome e papel reais da sessão (`carregarUsuarioSessao()`, tabela `perfis` já existente) em vez do texto fixo "Carlos — Diretoria"; sem sessão, mostra "Entrar".
- Menu do usuário com opção **Sair**, reutilizando a server action `sair()` que já existia sem nenhuma interface chamando-a.
- `/recuperar-senha` e `/atualizar-senha`: fluxo oficial do Supabase Auth (`resetPasswordForEmail` + evento `PASSWORD_RECOVERY`) — nenhuma senha é validada ou guardada pela aplicação.

### Adicionado — Missão P041: Central Financeira, primeira versão funcional (2026-08-19)
Primeiro módulo do projeto com **backend real** (D-041): banco Postgres no Supabase exclusivo "Plataforma ASA", autenticação e RLS.
- **Banco** (`supabase/migrations/0001_central_financeira.sql`, idempotente): `perfis`, `fornecedores`, `estabelecimentos`, `bancos`, `classificacoes`, `contas → parcelas → pagamentos → documentos`, `historico_alteracoes` com gatilhos, e a view `vw_parcelas_completo` com **status calculado**. Seed com **95 classificações reais** do escritório contábil em 5 grupos, 4 estabelecimentos e 6 bancos.
- **Empresa × Particular**: `natureza` obrigatória e sem padrão em toda conta; contas particulares protegidas por **RLS** (não pela interface); fechamento contábil filtra só empresa e **declara na tela e no PDF** quantas particulares foram excluídas.
- **Regra do cliente no banco**: `valor_pago` é coluna gerada (`valor + juros + multa − desconto`) — impossível gravado divergir do exibido.
- **Telas**: `/login` (e-mail e senha), `/financeiro` (contas a pagar), `/financeiro/particulares` (restrita) e `/financeiro/relatorios` (3 relatórios: Contas da Empresa, Contas Particulares e Fechamento Contábil com verificação de pendências).
- **Cadastro em uma passagem**: fornecedor reaproveitado ou criado na hora, parcelas com valor e **vencimento editáveis** (o cliente foi explícito que não seguem lógica fixa), classificação agrupada, recorrência (fixa/variável/reajustável + periodicidade + ocorrências) e observações.
- **Registro de pagamento** com juros, multa, desconto e banco, mostrando o valor final enquanto se digita.
- **Exportação XLSX e PDF funcionando de verdade** em todos os relatórios. O gerador de XLSX foi escrito sem dependência (`lib/exportar/xlsx.ts`) — o pacote `xlsx` do npm está parado em versão vulnerável e o `exceljs` custaria ~1 MB no navegador; validado gerando, descompactando e relendo o arquivo.
- **Home**: bloco financeiro com contas vencendo, vencidas, a pagar, total pago e pendências — carregado em streaming e **sem números falsos** quando não há sessão.
- **Next.js 16**: `middleware.ts` não existe mais; a proteção de rota foi escrita em `src/proxy.ts`, conforme a documentação da versão instalada.
- **WhatsApp: descartado** por confirmação do cliente — notificações só dentro da plataforma.
- Verificação: `eslint` limpo, `tsc --noEmit` limpo, `npm run build` concluído (38 rotas; `/financeiro/*` dinâmicas, Home dinâmica quando há banco configurado).

### Removido — Missão P040: Remoção completa do módulo Acionamento (2026-08-19)
Auditoria geral do estado do projeto seguida da remoção definitiva do setor Acionamento (D-040), a pedido explícito do CEO — não faz parte do escopo da Plataforma-ASA:
- **Excluídos:** `src/app/(dashboard)/acionamento/` (rota) e `src/components/acionamento/` (`ChamadosBoard`).
- **`lib/mock-data.ts`**: removidos `CHAMADOS_ATIVOS`, `StatusChamado`, `ChamadoAtivo`, `STATUS_CHAMADO_LABEL` e a função órfã `contarPendenciasPorSetor` (sem nenhum chamador desde o clone visual do Protótipo 1, D-035).
- **`lib/insights.ts`**: removidos o indicador `chamadosAguardando`, a entrada `/acionamento` em `contagensDaNavegacao()` e o card "chamados aguardando" em `indicadoresExecutivos()`.
- **Navegação**: item "Acionamento" removido da sidebar (`nav-items.ts`).
- **Busca global**: busca por "chamado" removida (`global-search.tsx`) — busca agora só por placa/motorista.
- **Onboarding**: etapa "Acionamento" removida de "Conheça a Plataforma" (`conheca-plataforma.tsx`), textos ajustados para os setores restantes.
- **Relatórios**: card "Relatório Operacional" removido (`relatorio-card.tsx`) — era específico de volume de despacho/chamados.
- **Cadastros**: textos de `quemUtiliza` que citavam Acionamento ajustados; usuário fictício "Tiago Furtado" (cujo papel só existia por causa do setor) removido de `lib/cadastros.ts`.
- **Documentação**: `PROJECT_STATE.md` e `ROADMAP.md` atualizados para refletir o estado atual; candidato "Aprofundar o setor Acionamento" removido do roadmap (decisão foi a oposta).
- Nenhuma funcionalidade compartilhada com outros setores foi alterada.
- Verificação: `eslint`, `tsc --noEmit` e `npm run build` limpos (34 páginas). Rota `/acionamento` confirmada 404 via HTTP; `/`, `/gestao-da-frota`, `/fechamento`, `/equipe-operacional`, `/cadastros` e `/relatorios` confirmadas 200.

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

### Adicionado — Missão P039: Painel executivo de Combustível na Home (2026-07-16)
A Central de Operações (`/`) ganha a seção "Combustível da Frota" (D-039), entre o KPI grid do topo e o conteúdo existente:
- 4 indicadores executivos (Estoque atual, Consumo médio diário, Autonomia estimada, Próxima compra recomendada), no mesmo `KpiCard` já usado no topo da Home.
- Gráfico de rosca (`DonutChart`, já existente desde D-035) contrastando Diesel disponível × Consumido no período.
- Lista de leituras inteligentes ao lado do gráfico, no padrão visual de "Alertas recentes" (ícone circular + texto), usando `insightsCombustivel()` sem alteração.
- Nenhuma função nova em `lib/combustivel.ts`, nenhuma outra tela alterada — só consumo do que já existia (D-036).
- Verificação: `eslint`, `tsc --noEmit`, `npm run build` (35 páginas) limpos; rota `/` testada via HTTP com os valores renderizados conferidos (6.310 L disponíveis, 810 L consumidos, 31 dias de autonomia, 29 dias para próxima compra — sem `NaN`/`undefined` visíveis).

### Adicionado — Missão P038: Runbook definitivo de publicação (2026-07-16)
Diagnóstico fechado do padrão "Preview pronto, Produção presa" que se repetiu desde a P028 (D-038):
- Novo [docs/DEPLOY.md](../docs/DEPLOY.md): diagnóstico, hipótese mais provável (Production Branch mal configurado), correção definitiva no painel da Vercel, processo manual enquanto isso não for corrigido, e explicação das duas URLs (Produção vs. Preview por branch, incluindo por que `ancoraplace` aparece no nome).
- Evidência nova que fecha o diagnóstico: a Produção só avançou para `bd292ee` entre a P035 e a P038 depois de promoção manual — nunca sozinha, confirmando que o gatilho automático não dispara.
- Confirmado (de novo): o conector Vercel deste agente não enxerga o projeto `plataforma-asa` (só `loja-elaine`), por isso nenhuma missão anterior conseguiu inspecionar/corrigir a configuração diretamente.
- Nenhum código de produto alterado — missão de infraestrutura/documentação.

### Adicionado — Missão P037: Equipe Operacional como módulo demonstrativo (2026-07-16)
`/equipe-operacional` (D-037) deixa de ser uma lista simples e vira um dos módulos mais completos da plataforma:
- Dashboard com 8 indicadores: colaboradores ativos, em serviço, folga, férias, atestados, faltas, escalas abertas, precisa de substituição.
- 4 ações — **Novo Colaborador**, **Registrar Atestado**, **Registrar Falta**, **Registrar Férias** — cada uma explicando o que faz e o benefício no tooltip; registrar atestado/férias já muda o status do colaborador na tela.
- **Escala Operacional**: quadro com uma coluna por turno (Manhã/Tarde/Noite), um cartão por equipe (Alfa/Bravo/Charlie) mostrando Motorista/Operador/Apoio e status individual, com efetivo disponível em destaque.
- **Ficha do colaborador** (painel lateral, abre ao clicar em qualquer nome): dados, histórico de ausências, histórico de escalas, documentação/treinamentos, observações.
- **Calendário mensal**: folgas, férias, atestados, faltas, treinamentos e escalas no mesmo mapa, com detalhe do dia selecionado.
- Painéis "Inteligência Operacional", "Atenção necessária" e "Atividade recente".
- Verificação: `eslint`, `tsc --noEmit`, `npm run build` (35 páginas), rotas testadas via HTTP.
