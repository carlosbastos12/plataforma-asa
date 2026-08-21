# Estado do Projeto — Plataforma-ASA

> Snapshot do que existe **agora**. Para histórico, ver [CHANGELOG.md](CHANGELOG.md). Para o que vem a seguir, ver [ROADMAP.md](ROADMAP.md).

## Fase atual

**Importador de despesas por planilha — primeira versão pronta (D-050).** Botão "Importar AutEM" em Contas a Pagar: lê o XLSX, mostra a prévia (novos / já existentes / possível duplicidade / com problema) e só grava depois de confirmação. Construído sem assumir o layout da AutEM — o reconhecimento de colunas é por nome, isolado num arquivo só. **O layout de homologação é fictício; o oficial ainda precisa ser validado com um arquivo real de exportação.** ⚠️ **Migration `0005_origem_importacao.sql` pendente de aplicação** — até lá o importador se recusa a funcionar e explica o motivo na tela.

**Anterior — Etapas 1–4 finalizadas (D-047 + D-048).** Ajustes do teste real aplicados: visualizar documento agora abre o PDF em vez de pedir para salvar (com botão separado de baixar, e o bucket seguindo privado); janela de documentos alargada, sem rolagem horizontal; novo botão reutilizável **"ⓘ Como funciona?"**, estreado no Fechamento para a Contabilidade; e navegação do módulo mais rápida — o layout deixou de repetir a consulta mais pesada do Financeiro só para montar o menu.

**Base — Etapas 1–4 (D-047).** Grupo→Classificação em dois passos; campo Histórico (com catálogo de modelos reais); nova exportação para a contabilidade no grão de PAGAMENTO (13 colunas exatas da planilha real do escritório contábil); Documentos e anexos (NF/boleto/comprovante) com Storage real e bucket privado. **Migration `0004_historico_grupo_documentos.sql` já aplicada no banco real** (2026-08-20), com todos os objetos confirmados por consulta direta — o código está pronto para deploy. Importador da AutEM, vínculo Multa↔Conta, Frota↔Conta e Combustível↔Conta ficam para etapas seguintes, por decisão explícita da missão.

**Anterior — Login exigido em toda a plataforma (P042).** Correção de controle de acesso: antes só `/financeiro` pedia sessão; qualquer outra rota interna abria direto pela URL, sem login. Agora `/login`, `/recuperar-senha` e `/atualizar-senha` são as únicas rotas públicas — todo o resto exige sessão válida (D-042). Identidade da sessão (nome/papel), logout e recuperação de senha também ficaram prontos nesta rodada (P041.1).

**Anterior — Central Financeira no ar, primeiro módulo com banco de dados real (P041).** A Central de Gestão Administrativa e Financeira saiu da demonstração: banco Postgres em projeto Supabase exclusivo, autenticação por e-mail/senha, RLS separando **Empresa × Particular**, cadastro de contas com parcelas, registro de pagamento, 3 relatórios e exportação XLSX/PDF funcionando (D-041). O restante da plataforma **segue como demonstração com dado fictício, mas agora atrás do mesmo login** — ver [CLAUDE.md](CLAUDE.md) §6.

**Anterior — Setor Acionamento removido por completo (P040).** Auditoria geral do estado do projeto seguida da remoção definitiva do setor Acionamento (quadro de chamados simulado) — não faz parte do escopo da Plataforma-ASA. Ver D-040. Acumula: painel executivo de Combustível na Home (D-039), Combustível (D-036, ciclo completo de entrada/abastecimento/estoque reativo) e Equipe Operacional (D-037, dashboard/escala/calendário) como experiências completas; clone visual do Protótipo 1 (D-035, publicado): sidebar escura, azul institucional, Home como dashboard clássico, tabelas em Documentação/Multas/Caixa. Ainda sem backend, banco, autenticação ou integração.

## O que existe

| Item | Estado |
|---|---|
| Fundação documental (Sprint Zero) | ✅ Completa |
| **Central Financeira** (`/financeiro`) | ✅ **Sistema real** (D-041): Supabase exclusivo, login, RLS, contas → parcelas → pagamentos, 3 relatórios, exportação XLSX/PDF. Grupo→Classificação, Histórico, exportação contábil em grão de pagamento e Documentos/anexos com Storage (D-047). Migrations `0001` a `0004` **todas aplicadas** no banco real; requer as env vars configuradas |
| Backend / banco / autenticação | ✅ Existem **apenas** na Central Financeira; demais módulos seguem sem backend |
| Stack técnica do `frontend/` | ✅ Next.js + React + TypeScript + Tailwind v4 + shadcn/ui + Lucide + Motion + next-themes (D-007, D-018) |
| Design tokens próprios (paleta, tipografia) | ✅ Implementados (D-010) |
| Organização por setor (Gestão da Frota / Fechamento) | ✅ Nova arquitetura de navegação (D-014); setor Acionamento removido por completo na P040 (D-040) |
| **Sub-navegação por abas** dentro de Gestão da Frota e Fechamento | ✅ Corrige regressão de cliques introduzida pelo hub-only da Missão 02 (D-019) |
| Central de Operações (home) | ✅ Dashboard executivo (clone visual do Protótipo 1 — D-035), com painel de Combustível (D-039) |
| **Gestão da Frota** | ✅ Veículos, Documentação, Multas e **Combustível** (ciclo completo: entrada, abastecimento base/externo, estoque reativo, inteligência — P036/D-036) reais; Vistorias/Compras como conceito futuro sinalizado |
| **Fechamento** | ✅ Caixa Particular real; Conferência/Consolidação/Seguradoras como conceito visual, sem regra de negócio inventada (D-015) |
| **Equipe Operacional** | ✅ Módulo completo (P037/D-037): dashboard de 8 indicadores, 4 ações (colaborador/atestado/falta/férias), escala por equipe/turno, ficha do colaborador, calendário mensal, inteligência/alertas |
| **Voz do Cliente** (`docs/BUSINESS/VOZ_DO_CLIENTE.md`) | ✅ Novo nesta missão — fonte oficial de requisitos reais, nunca exposta na interface (D-031) |
| **Busca global** (placa ou motorista) | ✅ Nova nesta missão — resultado leva direto à tela certa (D-021); busca por chamado removida junto com o setor Acionamento (D-040) |
| **Tema claro/escuro** | ✅ Novo nesta missão — alternável pelo usuário, tokens já existiam desde a Fase 1 (D-018) |
| Identidade visual por setor | ✅ Cor de destaque própria por setor, sobre os mesmos tokens globais (D-016) |
| Dataset fictício | ✅ Todo novo, sem reaproveitar dado da auditoria nem de protótipos anteriores (D-012) |
| **Estados vazios elegantes** (frota, documentação, multas) | ✅ Componente compartilhado `EmptyState` (D-022) |
| **Ações de demonstração com resposta real** (Fechar caixa, registrar combustível/equipe) | ✅ Estado local + toast de confirmação (D-023 e seguintes) |
| **Busca global com carregamento simulado** | ✅ Latência + esqueleto de carregamento (D-024) |
| Verificação de qualidade | ✅ `tsc --noEmit` limpo, `eslint` limpo (0 erros), `npm run build` concluído (21 páginas), todas as rotas testadas via HTTP |
| Verificação visual (screenshot) | ⚠️ Não realizada — ferramenta indisponível nesta sessão; recomendada antes de apresentação |
| Preparação para publicação (GitHub) | ✅ `LICENSE` (D-025), `frontend/.env.example`, `frontend/README.md` atualizado |
| Repositório Git | ✅ Inicializado, sem commits |
| Deploy (Vercel) | ⚠️ Build local verificado; deploy real ainda não realizado |

## O que NÃO existe (intencionalmente, nesta fase)

- ❌ Backend, banco de dados e autenticação **nos módulos operacionais** (Frota, Combustível, Equipe, Fechamento) — seguem como demonstração. A exceção autorizada é a Central Financeira (D-041).
- ❌ Importação/integração com o AUTEM — aguardando uma amostra real do arquivo exportado (XLSX).
- ❌ Upload de documentos e Google Drive — a tabela `documentos` já existe e está relacionada, mas nada é enviado ainda.
- ❌ Geração automática das ocorrências de contas recorrentes — o cadastro já guarda tipo, periodicidade e nº de ocorrências.
- ❌ Cofre de Credenciais e um Dashboard/Relatórios dedicado — a Central de Operações cumpre esse papel por ora.
- ❌ Regras de negócio do processo de Fechamento (conferência, consolidação, seguradoras) — ainda não conhecidas; apenas conceito visual (D-015).
- ❌ Vistorias e Compras da frota como telas reais — hoje são cartões sinalizando escopo futuro dentro de Gestão da Frota (Combustível deixou este grupo na P033).
- ❌ Rastreabilidade de alterações (quem mudou o quê e quando) — exige backend real; pendência registrada em D-031.
- ❌ Conteúdo em `docs/`, `pesquisas/`, `referencias/`, `scripts/` — aguardando necessidade real.

## Pendências abertas

1. **Verificação visual humana** antes de qualquer apresentação à diretoria — nenhuma captura de tela foi possível durante o desenvolvimento.
2. **Entender o processo real de Fechamento** com a equipe ASA antes de transformar os cartões conceituais em telas funcionais (D-015).
3. **Confirmar o texto de `LICENSE`** (D-025) com o CEO antes de tornar o repositório público.
4. Ver o relatório da Missão 03 (Sprint de Valor) para a nota crítica atribuída à plataforma e as ressalvas antes de uma apresentação real; ver o checklist de publicação para os passos de GitHub/Vercel ainda não executados (push ao remoto, deploy real).
5. **Gestão Financeira / Contas a Pagar** — próxima frente de produto (fora de escopo desta missão P040).

## Como rodar localmente

```bash
cd frontend
npm install   # se ainda não foi feito
npm run dev
```
Acesse `http://localhost:3000`.

## Última atualização

2026-07-16 — Missão P039 (Painel executivo de Combustível na Home — D-039) entregue: nova seção "Combustível da Frota" na Central de Operações, com 4 indicadores, gráfico de rosca e leituras inteligentes, consumindo exclusivamente dados já existentes em `lib/combustivel.ts` (D-036). Nenhuma outra tela alterada. Build com 35 páginas, rota `/` testada via HTTP. Pendências seguem as mesmas de antes: rastreabilidade de alterações (D-031) e fluxo "Despachar motorista" como inferência de demonstração (D-030).
