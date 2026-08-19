# Roadmap — Plataforma-ASA

> Plano de evolução por fases. Prioridade e escopo de cada fase são **decisão de produto**, a confirmar com o PM (ChatGPT) e o CEO (Carlos) antes de iniciar.

## Fase 0 — Sprint Zero (concluída)

Fundação documental do projeto. Sem funcionalidade, sem código.
- Estrutura de pastas e documentos estratégicos criados.
- Base de conhecimento (`../Auditoria-ASA/`) referenciada e delimitada como somente-leitura.
- Governança e papéis registrados.

## Fase 1 — Demonstração navegável, organizada por módulo (concluída)

Primeira versão real do frontend (Next.js), com 5 telas organizadas por módulo (Frota, Documentação, Multas, Caixa Particular) mais a Central de Operações. Dados simulados, sem backend.

## Missão 02 — Arquitetura da Experiência Operacional (concluída)

A organização por módulo foi substituída por organização **por setor real da ASA**: Acionamento, Gestão da Frota e Fechamento. A Central de Operações passou a incluir um fluxo visual conectando os três setores na ordem real da operação. Ver [PROJECT_STATE.md](PROJECT_STATE.md) para o detalhamento.

## Missão P040 — Remoção do setor Acionamento (concluída)

O setor **Acionamento** (quadro de chamados simulado) foi removido por completo da plataforma — não faz parte do escopo da Plataforma-ASA. Ver D-040 em [DECISIONS.md](DECISIONS.md).

## Próxima missão (proposta, a validar com o PM)

Candidatos identificados ao longo das últimas missões, em ordem sugerida:

1. **Gestão Financeira / Contas a Pagar** — próxima frente de produto, a iniciar após a auditoria geral desta missão (P040).
2. **Entender o processo real de Fechamento** com a equipe ASA (conferência de serviços, consolidação, relacionamento com seguradoras) — hoje é só conceito visual (D-015); é a maior lacuna de conhecimento do produto.
3. **Cofre de Credenciais** — risco de segurança já identificado na auditoria (senhas em texto plano), ainda não representado na plataforma (destacado novamente em D-034).
4. Validação com a diretoria da arquitetura por setor antes de qualquer decisão de backend.

## Fase 3 — Primeira versão real (**iniciada na Central Financeira**)

**Status: iniciada em 2026-08-19 pela missão P041, restrita ao módulo financeiro** (D-041). A Central de Gestão Administrativa e Financeira tem banco Postgres real (Supabase exclusivo "Plataforma ASA"), autenticação e RLS. Os demais módulos **permanecem** na fase de demonstração — a passagem de cada um para a Fase 3 exige decisão explícita do CEO.

Próximos itens desta fase, na ordem sugerida:
1. **Importação do AUTEM** (XLSX) — bloqueada até recebermos uma amostra real do arquivo exportado.
2. **Upload de documentos** (NF, boleto, comprovante) e avaliação do Google Drive.
3. **Geração automática das ocorrências** de contas recorrentes.
4. Pacote de fechamento contábil com os documentos anexados.

## Fora do roadmap por ora

- Qualquer integração automática com o AUTEM (a auditoria não confirmou se existe API/exportação automatizada — ver `Auditoria-ASA/Analise/07_Visao_Tecnica_e_Roadmap.md`).
- Regras de negócio do processo de Fechamento — não inventar até entender o processo real (D-015).
- Qualquer módulo fora do que já foi validado, até decisão do PM.

## Histórico de mudanças no roadmap

Ver [CHANGELOG.md](CHANGELOG.md).
