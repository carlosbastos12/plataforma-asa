# Estado do Projeto — Plataforma-ASA

> Snapshot do que existe **agora**. Para histórico, ver [CHANGELOG.md](CHANGELOG.md). Para o que vem a seguir, ver [ROADMAP.md](ROADMAP.md).

## Fase atual

**Missão P030 — Ecossistema Premium — entregue (aguardando publicação).** A plataforma ganhou o entorno de produto completo (D-029): **Cadastros** (9 cadastros autoexplicativos em tela genérica), **Relatórios** (6 leituras com exemplo ilustrativo, sem backend) e **Configurações** (experiência honesta), com a navegação separada em "Setores" e "Plataforma". Acumula P029 (onboarding "Conheça a Plataforma ASA", home tranquilidade-first, sidebar sem moldura — D-028) e P027 (uma pergunta por tela — D-027). Produção atual (plataforma-asa.vercel.app) está na P027/P028; P029+P030 estão na árvore de trabalho, sem commit — publicação em missão separada. Ainda sem backend, banco, autenticação ou integração.

## O que existe

| Item | Estado |
|---|---|
| Fundação documental (Sprint Zero) | ✅ Completa |
| Stack técnica do `frontend/` | ✅ Next.js + React + TypeScript + Tailwind v4 + shadcn/ui + Lucide + Motion + next-themes (D-007, D-018) |
| Design tokens próprios (paleta, tipografia) | ✅ Implementados (D-010) |
| Organização por setor (Acionamento / Gestão da Frota / Fechamento) | ✅ Nova arquitetura de navegação (D-014) |
| **Sub-navegação por abas** dentro de Gestão da Frota e Fechamento | ✅ Corrige regressão de cliques introduzida pelo hub-only da Missão 02 (D-019) |
| Central de Operações (home) | ✅ Saudação conversacional, pendências priorizadas e fluxo visual dos 3 setores — cartões de estatística redundantes removidos (D-020) |
| **Acionamento** | ✅ Quadro de chamados ativos por status; contagem duplicada removida (D-020) |
| **Gestão da Frota** | ✅ Veículos, Documentação e Multas reais, agora a 1 clique de qualquer página do setor; Combustível/Vistorias/Compras como conceito futuro sinalizado |
| **Fechamento** | ✅ Caixa Particular real; Conferência/Consolidação/Seguradoras como conceito visual, sem regra de negócio inventada (D-015) |
| **Busca global** (placa, motorista ou chamado) | ✅ Nova nesta missão — resultado leva direto à tela certa (D-021) |
| **Tema claro/escuro** | ✅ Novo nesta missão — alternável pelo usuário, tokens já existiam desde a Fase 1 (D-018) |
| Identidade visual por setor | ✅ Cor de destaque própria por setor, sobre os mesmos tokens globais (D-016) |
| Dataset fictício | ✅ Todo novo, sem reaproveitar dado da auditoria nem de protótipos anteriores (D-012) |
| **Estados vazios elegantes** (frota, documentação, multas) | ✅ Componente compartilhado `EmptyState` (D-022) |
| **Ações de demonstração com resposta real** (Despachar, Fechar caixa) | ✅ Estado local + toast de confirmação (D-023) |
| **Busca global com carregamento simulado** | ✅ Latência + esqueleto de carregamento (D-024) |
| Verificação de qualidade | ✅ `tsc --noEmit` limpo, `eslint` limpo (0 erros), `npm run build` concluído (21 páginas), todas as rotas testadas via HTTP |
| Verificação visual (screenshot) | ⚠️ Não realizada — ferramenta indisponível nesta sessão; recomendada antes de apresentação |
| Preparação para publicação (GitHub) | ✅ `LICENSE` (D-025), `frontend/.env.example`, `frontend/README.md` atualizado |
| Repositório Git | ✅ Inicializado, sem commits |
| Deploy (Vercel) | ⚠️ Build local verificado; deploy real ainda não realizado |

## O que NÃO existe (intencionalmente, nesta fase)

- ❌ Backend, banco de dados, autenticação, API — nenhum será criado até decisão explícita (ver [ROADMAP.md](ROADMAP.md), Fase 3).
- ❌ Cofre de Credenciais e um Dashboard/Relatórios dedicado — a Central de Operações cumpre esse papel por ora.
- ❌ Regras de negócio do processo de Fechamento (conferência, consolidação, seguradoras) — ainda não conhecidas; apenas conceito visual (D-015).
- ❌ Combustível, Vistorias e Compras da frota como telas reais — hoje são cartões sinalizando escopo futuro dentro de Gestão da Frota.
- ❌ Conteúdo em `docs/`, `pesquisas/`, `referencias/`, `scripts/` — aguardando necessidade real.

## Pendências abertas

1. **Verificação visual humana** antes de qualquer apresentação à diretoria — nenhuma captura de tela foi possível durante o desenvolvimento.
2. **Entender o processo real de Fechamento** com a equipe ASA antes de transformar os cartões conceituais em telas funcionais (D-015).
3. **Validar com o PM** se Acionamento deveria, no futuro, consumir dados reais do AUTEM em vez de simulados.
4. **Confirmar o texto de `LICENSE`** (D-025) com o CEO antes de tornar o repositório público.
5. Ver o relatório da Missão 03 (Sprint de Valor) para a nota crítica atribuída à plataforma e as ressalvas antes de uma apresentação real; ver o checklist de publicação para os passos de GitHub/Vercel ainda não executados (push ao remoto, deploy real).

## Como rodar localmente

```bash
cd frontend
npm install   # se ainda não foi feito
npm run dev
```
Acesse `http://localhost:3000`.

## Última atualização

2026-07-15 — Missão P030 (Ecossistema Premium) entregue: Cadastros, Relatórios e Configurações como experiência, navegação em grupos "Setores"/"Plataforma", estados vazios com ação. Build com 33 páginas. Aguardando missão de publicação (sem commit).
