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

## Próxima missão (proposta, a validar com o PM)

Candidatos identificados ao longo da Missão 02, em ordem sugerida:

1. **Entender o processo real de Fechamento** com a equipe ASA (conferência de serviços, consolidação, relacionamento com seguradoras) — hoje é só conceito visual (D-015); é a maior lacuna de conhecimento do produto.
2. **Aprofundar o setor Acionamento** — hoje é um quadro de chamados simulado; decidir se e como ele deveria refletir o que o AUTEM já faz, sem duplicar esforço.
3. **Cofre de Credenciais** — risco de segurança já identificado na auditoria (senhas em texto plano), ainda não representado na plataforma.
4. Validação com a diretoria da arquitetura por setor antes de qualquer decisão de backend.

## Fase 3 — Primeira versão real (futura, não iniciar sem aprovação explícita)

Só se inicia após validação da diretoria. Envolve decisões ainda não tomadas neste projeto: backend, banco de dados, autenticação, hospedagem, integração (se houver) com o AUTEM.

## Fora do roadmap por ora

- Qualquer integração automática com o AUTEM (a auditoria não confirmou se existe API/exportação automatizada — ver `Auditoria-ASA/Analise/07_Visao_Tecnica_e_Roadmap.md`).
- Regras de negócio do processo de Fechamento — não inventar até entender o processo real (D-015).
- Qualquer módulo fora do que já foi validado, até decisão do PM.

## Histórico de mudanças no roadmap

Ver [CHANGELOG.md](CHANGELOG.md).
