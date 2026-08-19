# CLAUDE.md — Constituição do Projeto **Plataforma-ASA**

> Documento oficial e permanente do produto. Toda decisão de desenvolvimento deve respeitar o que está aqui.
> **Idioma:** sempre responder e documentar em **português brasileiro**.

## 1. O que é este projeto

A **Plataforma-ASA** é a plataforma operacional complementar ao AUTEM para a ASA (Aguanambi Freios Ltda), construída a partir de tudo que foi descoberto durante o projeto **Auditoria-ASA** (encerrado como projeto de descoberta, mantido como base de conhecimento).

Este é um **projeto novo e independente**. Não há compartilhamento de código nem de estrutura com a Auditoria-ASA — apenas de conhecimento.

## 2. Papéis e governança

| Papel | Pessoa/Agente | Responsabilidade |
|---|---|---|
| **CEO / Especialista do Negócio** | Carlos | Decide o que serve para o negócio real da ASA. Validação final. |
| **Product Manager / Arquiteto da Plataforma** | ChatGPT | Decisões de produto: o que construir, em que ordem, como deve funcionar. |
| **CTO / Engenheiro** | Claude Code | Implementação. Traduz decisões de produto em documentação técnica, protótipo e (futuramente) código. |

**Regra prática:** decisões de produto/arquitetura (o quê e por quê) pertencem a Carlos e ao PM. Decisões de implementação (como construir o que foi decidido) pertencem ao CTO. Quando este projeto precisar tomar uma decisão de produto que ainda não foi validada, isso deve ficar registrado como **pendência** em [DECISIONS.md](DECISIONS.md), não decidido unilateralmente.

## 3. Base de conhecimento

A pasta `../Auditoria-ASA/` é a documentação oficial do negócio — **somente consulta, nunca modificar**. Usar principalmente:
- `Auditoria-ASA/Analise/` — todos os relatórios da auditoria (inventário de planilhas, processos, entidades, oportunidades, MVP, visão técnica, benchmark de mercado).
- `Auditoria-ASA/Calude.md` — briefing original que originou a auditoria.

Nenhum arquivo de `Auditoria-ASA/` deve ser copiado, movido ou editado a partir deste projeto.

## 4. Referência de engenharia

`../Projeto-Embarque/` é usado **apenas como inspiração arquitetural** — organização de pastas, clareza de documentação, qualidade de experiência. **Não copiar código nem conteúdo** de lá. É referência de forma, não de conteúdo.

## 5. Objetivo do produto

Uma plataforma operacional que **complementa o AUTEM, nunca o substitui**. Ataca o que hoje só existe em planilha, papel ou controle paralelo:
- Elimina retrabalho de planilha (ex.: os 759 arquivos de Caixa Particular identificados na auditoria).
- Elimina controles em papel onde fizer sentido digitalizar.
- Organiza e centraliza informação hoje espalhada.
- Dá à direção uma visão que hoje não existe em lugar nenhum.

Ver [PRODUCT_VISION.md](PRODUCT_VISION.md) para a visão completa.

## 6. Fase atual: demonstração navegável **+ Central Financeira real**

O projeto vive hoje em **dois regimes simultâneos**, e é importante não confundi-los:

**a) Módulos operacionais — seguem como demonstração** (Frota, Documentação, Multas, Combustível, Equipe Operacional, Fechamento/Caixa):
- ❌ Sem backend, sem banco, sem autenticação.
- ✅ Frontend navegável com dados **simulados** (política de dados fictícios da seção 7 vale integralmente aqui).

**b) Central de Gestão Administrativa e Financeira — sistema real** (D-041, a partir da missão P041):
- ✅ Banco Postgres real em projeto **Supabase exclusivo ("Plataforma ASA")**, autenticação por e-mail/senha e Row Level Security.
- ✅ Opera **dado real do cliente** — a política de dados fictícios da seção 7 **não** se aplica a este módulo, porque aqui o propósito é justamente substituir a planilha real.
- ✅ Toda conta é obrigatoriamente **Empresa** ou **Particular**; as particulares são protegidas por RLS e nunca entram no fechamento contábil.

**Regra prática:** um módulo só sai do regime (a) para o (b) por decisão explícita do CEO, registrada em [DECISIONS.md](DECISIONS.md). Nenhum módulo novo ganha backend por iniciativa da engenharia.

Stack definida: Next.js (App Router) + React + TypeScript + Tailwind v4 + shadcn/ui (D-007, D-018), com Supabase no módulo financeiro (D-041).

## 7. Política permanente de dados fictícios

**Nunca usar dados reais da ASA em telas, protótipos ou demonstrações** — mesmo sendo o cliente legítimo deste projeto. Motivo: a auditoria já identificou o risco de misturar identificador real (placa, nome de motorista) com valor fictício (ver `Auditoria-ASA/Analise/`, correção feita no Protótipo 2 da auditoria) — isso confunde o que é real com o que é ilustrativo.
- Todo dado em tela de demonstração é **sintético**, com estrutura realista (baseada nos padrões reais descobertos na auditoria: placas, tipos de documento, valores, prazos), mas nenhum identificador real do cliente.
- Na dúvida, tratar como confidencial e usar exemplo fictício.

## 8. Princípios de produto

1. **Complementar, nunca substituto** — o AUTEM continua sendo o sistema principal.
2. **Sem treinamento** — pensado para quem usa Excel, papel e WhatsApp no dia a dia; cada tela se explica sozinha.
3. **Ação antes de gráfico** — mostrar o que precisa de atenção, não decorar a tela com indicadores.
4. **Simplicidade acima de quantidade** — poucas telas bem feitas, não muitas telas medianas.
5. **Rastreabilidade** — toda decisão de produto registrada em [DECISIONS.md](DECISIONS.md).

## 9. Diretrizes de identidade visual

- Visual elegante, poucos elementos, muito espaço em branco.
- Cards modernos, ícones consistentes, excelente tipografia.
- Responsivo.
- Nenhuma tela pode "assustar" um usuário com pouca familiaridade com informática — clareza acima de densidade de informação.

## 10. Regras de desenvolvimento desta fase

- **Não criar banco, backend, autenticação, API ou integração real** para os módulos em regime de demonstração (seção 6a). A exceção é a Central Financeira (seção 6b), já autorizada em D-041 — e qualquer nova exceção exige decisão explícita do CEO.
- **Nunca versionar credenciais.** Chaves de ambiente vivem em `.env.local` (ignorado pelo git) e nas variáveis da Vercel. A chave `service_role` do Supabase não entra na aplicação em hipótese alguma.
- Toda funcionalidade nova precisa resolver uma dor **já identificada na auditoria** — nada é adicionado "por adicionar". Se a dor não está documentada em `Auditoria-ASA/Analise/`, registrar a hipótese e validar com o PM antes de construir.
- Documentar decisões relevantes em [DECISIONS.md](DECISIONS.md).
- Manter [PROJECT_STATE.md](PROJECT_STATE.md) e [CHANGELOG.md](CHANGELOG.md) atualizados a cada entrega.

## 11. Referências

- Visão do produto: [PRODUCT_VISION.md](PRODUCT_VISION.md)
- Estado atual: [PROJECT_STATE.md](PROJECT_STATE.md)
- Plano de evolução: [ROADMAP.md](ROADMAP.md)
- Decisões registradas: [DECISIONS.md](DECISIONS.md)
- Histórico de mudanças: [CHANGELOG.md](CHANGELOG.md)
- Estrutura do repositório: [README.md](README.md)
