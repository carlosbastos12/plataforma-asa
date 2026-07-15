# Voz do Cliente — Plataforma do ASA Reboques

> Documento permanente de engenharia de produto. Fonte oficial de requisitos reais, coletados diretamente de colaboradores da operação. **Nunca referenciar este documento, seu conteúdo ou sua origem na interface do produto** — a mesma regra de [CLAUDE.md](../../CLAUDE.md) (§ regra permanente da auditoria) se aplica aqui: a plataforma nunca revela de onde veio a ideia, apenas entrega o benefício.

## Como usar este documento

Toda melhoria de produto que responda a uma dor aqui registrada deve citar o registro correspondente (ex.: "responde a VDC-001") em [DECISIONS.md](../../DECISIONS.md) ou no changelog da missão — não na interface. Novas entrevistas/depoimentos entram como novos registros, nunca sobrescrevendo os anteriores.

---

## Registro VDC-001

- **Colaborador:** Vitor
- **Área:** Operação da Frota / Apoio Operacional
- **Data de coleta:** 2026-07-15 (missão P033)

### Dores relatadas

1. Informações espalhadas — sem um lugar único para consultar.
2. Demora para localizar informações quando precisa decidir rápido.
3. Falta de alertas — descobre o problema depois que ele já virou prejuízo.
4. Retrabalho — a mesma informação registrada mais de uma vez, em lugares diferentes.
5. Controle manual de combustível.
6. Controle manual de manutenção.
7. Controle manual de documentos.
8. Controle manual de atestados.
9. Controle manual de faltas.
10. Controle manual de escalas.
11. Falta de rastreabilidade das alterações — não dá para saber quem mudou o quê e quando.
12. Integração inexistente entre áreas — frota, combustível e equipe não conversam entre si.
13. Diversas planilhas para um único processo.
14. Dificuldade para localizar o histórico completo de um veículo (documentos + multas + manutenção + combustível, tudo junto).
15. Controle misto de abastecimento — parte no tanque interno da base, parte em postos externos durante viagem, sem visão unificada.

### Como cada dor foi endereçada nesta missão (P033)

| Dor | Resposta na plataforma |
|---|---|
| 1, 2, 3, 4 | Home reformulada como assistente: abre com leitura em linguagem natural do estado da operação, não com números crus. |
| 5, 15 | Nova área **Combustível** dentro de Gestão da Frota — dois fluxos: Tanque da Base (entrada/saída/estoque/fornecedor) e Abastecimento Externo (posto/motorista/veículo/viagem). |
| 6, 7 | Reforço de linguagem na Gestão da Frota e na ficha do veículo: documentação, manutenção, certificados, AET e tacógrafo apresentados como um histórico centralizado único. |
| 8, 9, 10 | Nova área **Equipe Operacional** — faltas, atestados, escala e disponibilidade, com substituição sugerida quando uma ausência afeta a escala. |
| 11 | Ainda não endereçada nesta missão — requer trilha de auditoria (quem/quando/o quê), que é funcionalidade de backend. Registrada como pendência.
| 12, 13, 14 | Ficha do veículo já reúne documentos + multas + manutenção (desde a P027); Combustível nesta missão passa a fazer parte do mesmo histórico. |

### Pendências em aberto

- Rastreabilidade de alterações (dor 11) depende de persistência real — fora do escopo desta fase (sem backend, ver [CLAUDE.md](../../CLAUDE.md) §6).
- Integração formal entre Combustível e Fechamento (custo de combustível refletindo no caixa) não foi construída nesta missão — ver [ROADMAP.md](../../ROADMAP.md).
