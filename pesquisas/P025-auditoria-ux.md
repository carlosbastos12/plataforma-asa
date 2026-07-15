# P025 — Auditoria UX/UI Completa da Plataforma ASA

> Auditoria de produto conduzida sob a ótica de um diretor avaliando a compra, não de um desenvolvedor.
> Método: leitura integral do código visual (tokens, medidas, textos) + HTML renderizado de todas as rotas.
> Limitação declarada: sem captura de tela nesta sessão — nenhuma conclusão aqui depende de renderização pixel-perfect; todas derivam de medidas e conteúdo verificáveis no código.

---

## 1. O diagnóstico em uma frase

**A Plataforma ASA mostra *estado* — nunca mostra *valor*.** Ela informa o que está vencido, mas nunca diz o que isso custa, o que ela evitou, nem o que fazer a respeito. Um diretor vê uma lista de problemas bem formatada; ele deveria ver um sistema que trabalha por ele.

## 2. Primeira impressão (os 5 segundos)

**O que funciona:** a saudação conversacional ("Boa noite, Carlos. Hoje existem 16 tarefas aguardando. Vamos começar?") é o melhor momento do produto — é o único lugar onde o sistema fala como gente e assume protagonismo.

**O que falha:**
- O primeiro conteúdo real é uma **lista de 16 problemas** em cards branco-cinza idênticos. A emoção transmitida é "você tem trabalho acumulado", não "eu estou cuidando disso para você".
- **Nenhum número grande em lugar nenhum.** O único texto grande do produto inteiro é a frase da saudação. Diretores leem números antes de frases — e todos os números do produto estão em badges de 11–12px.
- O sistema nunca se apresenta. Não existe uma linha sequer dizendo o que ele substitui (1.925 planilhas, papel, WhatsApp). Quem chega frio vê "um sistema administrativo bonito".
- Veredito dos 5 segundos: **CRUD bonito.** Funciona, é limpo, mas não impressiona.

## 3. Hierarquia visual

Problema estrutural: **tudo tem o mesmo peso.** Cards com o mesmo `p-5`, mesmo `rounded-2xl`, mesma borda, títulos de 15px e descrições de 13px em todas as telas. Não existe um elemento dominante em nenhuma tela.

Evidência dura: fora da home, **toda tela começa com um `h2` de 16px** (`text-base`). O "título" da página no topbar tem 15px. Ou seja: o texto mais importante de cada tela é praticamente do tamanho do texto comum. Compare com Stripe/Vercel: um número de 36–48px, um rótulo de 12px, e o resto recua.

## 4. Peso visual

- **A sidebar é o elemento mais pesado da tela inteira** (256px de `#101B19`, quase preto, em cima de um fundo `#F5F7F6` claro) — e carrega apenas **4 links**. Custo visual altíssimo para pouquíssimo conteúdo. É o inverso do benchmark (Linear/Notion: chrome silencioso, conteúdo alto).
- O aviso "Camada complementar" ocupa espaço nobre permanente na sidebar, **em todas as telas, para sempre**. É conteúdo de rodapé/onboarding com proeminência de navegação.
- A paleta própria (petróleo `#0E5E52` + cobre `#B6631A`) é genuinamente boa e diferenciada — mas aparece quase só em ícones de 18px e badges minúsculos. O produto tem identidade e a esconde.

## 5. Jornada do usuário ("se eu fosse diretor da ASA")

- **A promessa central quebra no primeiro clique.** A home diz "toque em qualquer item para *resolver*". Clico em "AET AMC venceu — RDX4A17" → caio na ficha do veículo → e lá não existe **nenhuma ação**: não dá para renovar, marcar como tratado, avisar o motorista, nada. A promessa era "resolver"; a entrega é "olhar". Isso, mais que qualquer estética, é o que faz o produto parecer cadastro.
- O que eu esperaria ver e não vi: **quanto dinheiro está em risco** (multas + documentos vencidos têm consequência financeira direta — AET vencida é multa e retenção do guincho); **o que mudou desde ontem**; **quem** está resolvendo o quê.
- O que me deixaria inseguro: os números que não batem entre menu (14) e tela (6+2); a data do topo divergente dos prazos; vocabulário de projeto vazando para a interface ("conceito, a definir" — diretor não deveria ver linguagem de gestão de projeto dentro do produto).

## 6. Valor percebido

O sistema transmite **organização**, não **inteligência**. A inteligência existe no código — `situacaoVeiculo()` compõe severidade de documentos + multas; `montarTarefasDoDia()` prioriza por urgência — mas é **invisível**: o produto nunca explica *por que* algo é crítico. Uma linha de microcopy ("Crítico porque a AET venceu há 7 dias — veículo sujeito a retenção") transformaria a mesma informação em inteligência percebida. Automação: zero sinais (nada "foi feito automaticamente" em lugar nenhum).

## 7. Design emocional

Sentimento atual: **"mais um sistema"** — porém um sistema honesto e bem-acabado. Por quê: neutralidade cromática dominante, ausência de momentos de recompensa (fechar o caixa do dia — o momento emocional máximo da operação — responde com um toast padrão), ausência de qualquer celebração de progresso. O único "momento assinatura" é o SectorFlow da home, e ele está subvendido: cards brancos iguais aos demais, setas de conexão em cinza 30% de opacidade.

## 8. Elementos clicáveis sem propósito percebido (regra Embarque)

Inventário completo dos que violam a diretriz:

| Elemento | Violação |
|---|---|
| Avatar "CA" (topbar) | Parece clicável, não faz nada. Ou vira menu real, ou perde a aparência de botão. |
| Alternador de tema | Ícone sem tooltip — não diz o que faz antes do clique. |
| Badges vermelhos da sidebar | Não explicam o que contam (misturam docs críticos + multas + atenção) — e é daí que nasce o "14 vs 8". |
| "Despachar motorista" | Não diz **quem** vai despachar nem por qual critério. Ação cega. |
| Cards "conceito futuro/a definir" | Desabilitados sem explicar por que existem, quando chegam, o que farão. Deveriam ter tooltip ("Chega na Fase 2 — controle de abastecimento por veículo"). |
| Chips de placa nas tabelas | São links para a ficha do veículo, mas têm cara de etiqueta estática. |
| "Fechar caixa do dia" | Ação de aparência irreversível sem confirmação e sem explicar o que "fechar" implica. |
| Busca global | Invisível no mobile (`hidden md:block`) e sem atalho de teclado sugerido. |

## 9. Tabelas — quais merecem existir

- **Documentação (48 linhas despejadas)** — ❌ como está. 36 das 48 linhas estão "Em dia" (uma vence em 302 dias). Deve virar: **grupos por urgência** — bloco "Vencidos (6)" em cards vermelhos com ação, bloco "Próximos 15 dias (6)", e "Em dia (36)" **colapsado** com um check verde. Tabela completa vira visão secundária ("ver tudo").
- **Multas (4 linhas)** — ❌ tabela para 4 itens é maquinário demais. Virar cards com contagem regressiva de prazo de indicação (o prazo é o drama real da multa).
- **Tabelas da ficha do veículo** (multas/manutenções, 0–2 linhas) — ✅ aceitáveis, escopo pequeno e contextual.
- **Lançamentos do caixa** — ✅ já é lista, correto.

## 10. Dashboard: executivo ou operacional?

**Operacional** — e isso não é defeito para o dia a dia, é defeito para a *venda*. A demo será vista por diretoria. Falta a camada executiva: uma faixa de 3–4 números grandes no topo da home — **R$ em risco** (multas em aberto + exposição por docs vencidos), **frota apta** (7 de 10), **caixa do dia** (R$ 450) — cada um clicável, cada um com uma palavra de tendência ("2 a mais que ontem"). O restante da home já é bom e permanece.

## 11. Menu lateral

Ajuda pouco, pesa muito (item 4). Recomendação: **enriquecer em vez de encolher** — sub-itens por setor (Veículos, Documentação, Multas visíveis direto), contagens *separadas por significado* (vencidos ≠ atenção), e o aviso AUTEM reduzido a uma linha de rodapé com tooltip. Alternativa mais ousada (avaliar com o PM): rail fino de ícones + labels no hover, devolvendo ~190px de largura ao conteúdo.

## 12. Cores

- A paleta é um ativo real — petróleo + cobre não parece template. Problema é **subuso**, não excesso.
- Excesso de preto: **sim, um caso** — a sidebar quase preta no tema claro cria o maior contraste da tela exatamente onde há menos informação.
- Contraste de texto: `--muted-foreground #5D6E6A` sobre `#F5F7F6` fica na casa de 4.6:1 — aceitável, mas usado em 13px em quase todo texto secundário; subir levemente o peso ou o tom em textos de 13px.

## 13. Ícones

Lucide, consistentes, bom. Dois pontos: `Landmark` (prédio de banco) para "Fechamento" não comunica fechamento de caixa para leigo — considerar `Wallet`/`CircleCheckBig`; e todo ícone-botão sem rótulo precisa de tooltip (tema, menu mobile).

## 14. Microinterações — onde faltam

Existentes (bom): hover-lift nos cards, entrada em cascata, toasts, skeleton na busca.
Faltando, em ordem de impacto percebido:
1. **Tooltip explicativo em toda sigla** (AET, AMC, DNIT, PRF, tacógrafo) — "AET: Autorização Especial de Trânsito. Sem ela o guincho não circula; sujeito a multa e retenção."
2. **Count-up nos números** ao entrar na tela (600ms) — números que "chegam" parecem calculados, não digitados.
3. **Destaque pós-ação**: após "Despachar", o card que mudou de coluna pulsa 1x na cor do setor — causalidade visível.
4. **Confirmação leve no "Fechar caixa"** + momento de recompensa no fechamento (check animado, "Dia fechado. Saldo conferido: R$ 450").
5. **Atalho `/` ou `Ctrl+K`** para a busca, com a tecla desenhada no campo.
6. Placa copiável com um clique (ícone de copiar no hover).

## 15. Linguagem

- Siglas sem explicação em todas as telas — item 14.1 resolve.
- **Vocabulário interno vazando**: "Camada complementar", "conceito, a definir", "conceito futuro", "(ação simulada nesta demonstração)". Diretor não deve ler linguagem de gestão de projeto na interface. Trocar por "Em breve" + tooltip, e concentrar o disclaimer de simulação em um único banner discreto de demo.

## 16. Benchmark (síntese aplicável, sem cópia)

| Referência | Lição para a ASA |
|---|---|
| **Stripe** | Um número enorme por contexto; tabela só depois do resumo. A ASA tem zero números grandes. |
| **Linear** | Chrome quieto, conteúdo alto; velocidade como identidade. A ASA tem o inverso: sidebar gritando, conteúdo sussurrando. |
| **Notion** | A interface some atrás do conteúdo. O aviso permanente da sidebar é anti-Notion. |
| **Vercel** | Uma métrica-herói por card, muito branco. Aplicável direto à faixa executiva. |
| **Framer** | Movimento comunica causa e efeito (despacho → card viaja → pulso). |
| **ClickUp/Monday/Asana** | Pessoas humanizam dados: avatares de motorista nas tarefas e chamados — hoje motorista é só texto. |
| **Plane** | Sidebar com seções e disclosure — modelo para a sidebar enriquecida. |

## 17. Wireframes textuais

**Home (nova):**
```
┌────────────────────────────────────────────────────────────┐
│ Boa noite, Carlos.  A frota tem 3 pontos pedindo decisão.  │
│                                                            │
│ ┌ R$ 3.2 mil ─┐ ┌ 7/10 ──────┐ ┌ R$ 450 ────┐ ┌ 2 ───────┐ │
│ │ em risco    │ │ frota apta │ │ caixa hoje │ │ chamados │ │
│ │ multas+docs │ │ 3 críticos │ │ 4 lançtos  │ │ na fila  │ │
│ └─────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                                                            │
│ Decidir agora (3)          ▸ ver todas as 16 pendências    │
│ ● AET venceu — RDX4A17 · custa até R$ X → [Tratar]         │
│ ● Multa 2d p/ indicar — R$ 267,90       → [Indicar]        │
│ ● Caixa 16/08 sem fechamento            → [Fechar]         │
│                                                            │
│ [Acionamento 2] ──▶ [Frota 3+11] ──▶ [Fechamento 2]        │
└────────────────────────────────────────────────────────────┘
```

**Documentação (nova):**
```
🔴 Vencidos (6) — ação imediata          [cards com CTA]
🟡 Vencem em até 15 dias (6)             [cards compactos]
🟢 Em dia (36)                        ▸ expandir / ver tabela
```

**Multas (nova):**
```
R$ 463,13 em aberto  ·  2 aguardando indicação
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ ⏱ 2 DIAS PARA INDICAR        │ │ ⏱ 3 DIAS PARA INDICAR        │
│ RDX4A17 · Renê · AMC         │ │ VYX1E92 · Théo · DETRAN      │
│ R$ 267,90        [Indicar →] │ │ R$ 195,23        [Indicar →] │
└──────────────────────────────┘ └──────────────────────────────┘
Pagas (2) ▸
```

**Ficha do veículo — topo com veredicto:**
```
RDX4A17 · Volvo FH 460 · Renê Salgado
⛔ NÃO APTO PARA RODAR — AET vencida há 7 dias
   O que fazer: renovar AET no órgão AMC.  [Marcar como tratado]
```

## 18. Nova arquitetura visual (princípios)

1. **Um herói por tela** — cada tela elege UM elemento dominante (número, veredicto ou ação) em 32–40px; todo o resto recua um degrau.
2. **Chrome quieto** — sidebar mais clara ou mais fina; conteúdo ganha o contraste que hoje é da moldura.
3. **Cor com significado exclusivo** — vermelho/âmbar/verde só para estado; petróleo para ação/navegação; cobre só para o momento-assinatura.
4. **Estado → consequência → ação** — toda linha crítica responde às três perguntas: o que aconteceu, o que custa, o que fazer.
5. **Pessoas visíveis** — avatar do motorista em tarefas, chamados e ficha.

## 19. Nova hierarquia da informação

1. Dinheiro em risco → 2. Capacidade de operar (frota apta) → 3. O que decidir agora (3 itens máx.) → 4. Fluxo dos setores → 5. Tudo o mais (progressivo, colapsado).

## 20. Plano de implementação em pequenas missões

| # | Missão | Escopo | Impacto |
|---|---|---|---|
| M0 | **Confiança nos números** | Corrigir data topbar vs TODAY; unificar semântica 14 vs 8; "Paga" em vez de "Em dia"; `<title>` por página | Elimina as 4 quebras de confiança — pré-requisito de tudo |
| M1 | **Linguagem que explica** | Tooltips de siglas; eliminar vocabulário de projeto da UI; tooltip em todo clicável sem contexto (regra Embarque) | Alto, custo baixo |
| M2 | **Faixa executiva na home** | 4 números-herói com count-up e clique | Transforma a primeira impressão |
| M3 | **Documentação por urgência** | Grupos vermelho/âmbar/verde-colapsado; tabela vira secundária | Mata a tela mais cansativa |
| M4 | **Multas em cards** | Countdown de prazo + CTA "Indicar" | Drama certo no lugar certo |
| M5 | **Veredicto na ficha do veículo** | Banner apto/não-apto + "o que fazer" + marcar como tratado (estado local) | Cumpre a promessa "resolver" |
| M6 | **Sidebar 2.0** | Sub-itens por setor, contagens com significado, disclaimer para rodapé, avatar vira menu (ou deixa de parecer botão) | Rebalanceia o peso visual |
| M7 | **Microinterações** | Pulso pós-despacho, recompensa no fechamento do caixa, Ctrl+K, placa copiável | O "polish" que encanta |
| M8 | **Humanização** | Avatares de motorista (iniciais) em tarefas/chamados/ficha | Dado vira gente |

Ordem recomendada: M0 → M1 → M2 → M5 → M3 → M4 → M6 → M7 → M8. As missões M0–M2 sozinhas mudam a resposta do diretor de "mais um sistema" para "isso me entende".
