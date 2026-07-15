# Estado do Projeto — Plataforma-ASA

> Snapshot do que existe **agora**. Para histórico, ver [CHANGELOG.md](CHANGELOG.md). Para o que vem a seguir, ver [ROADMAP.md](ROADMAP.md).

## Fase atual

**Missão P034 — Orientada à operação real — entregue (aguardando publicação).** Home remodelada por completo (D-032): dashboard executivo de 6 números, "Decidir agora" limitado a 3 itens com consequência+motivo+ação, "Tudo sob controle" e fluxo de 5 estações (Acionamento → Frota → Equipe → Combustível → Fechamento). Ficha do veículo agora abre no prontuário unificado; Gestão da Frota ganhou faixa de indicadores; Equipe Operacional ganhou banners de impacto por ausência; sidebar com contraste reduzido (D-033). Acumula P033 (Voz do Cliente — D-031), P032 (identidade visual — D-030, publicada), P031 (marca "ASA Reboques"), P030 (ecossistema — D-029) e P029 (onboarding — D-028). P029–P032 já publicadas; P033–P034 estão na árvore de trabalho, aguardando commit/push. Ainda sem backend, banco, autenticação ou integração.

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
| **Gestão da Frota** | ✅ Veículos, Documentação, Multas e **Combustível** (tanque da base + abastecimento externo, P033) reais; Vistorias/Compras como conceito futuro sinalizado |
| **Fechamento** | ✅ Caixa Particular real; Conferência/Consolidação/Seguradoras como conceito visual, sem regra de negócio inventada (D-015) |
| **Equipe Operacional** | ✅ Novo setor (P033): escala por turno, faltas/atestados com impacto na escala já calculado, disponibilidade da equipe |
| **Voz do Cliente** (`docs/BUSINESS/VOZ_DO_CLIENTE.md`) | ✅ Novo nesta missão — fonte oficial de requisitos reais, nunca exposta na interface (D-031) |
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
- ❌ Vistorias e Compras da frota como telas reais — hoje são cartões sinalizando escopo futuro dentro de Gestão da Frota (Combustível deixou este grupo na P033).
- ❌ Rastreabilidade de alterações (quem mudou o quê e quando) — exige backend real; pendência registrada em D-031.
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

2026-07-15 — Missão P034 (Orientada à operação real) entregue: home remodelada (dashboard executivo, Decidir agora limitado a 3, fluxo de 5 estações), ficha do veículo como prontuário unificado, Gestão da Frota com faixa de indicadores, Equipe Operacional com banners de impacto, sidebar de contraste reduzido. Build com 35 páginas. Pendências documentadas: rastreabilidade de alterações (D-031) e fluxo "Despachar motorista" como inferência de demonstração (D-030), ambas a revisar em rodada futura.
