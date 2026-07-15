# Plataforma-ASA

Plataforma operacional complementar ao **AUTEM** para a ASA (Aguanambi Freios Ltda) — construída a partir do conhecimento consolidado na **Auditoria-ASA**.

> Projeto em **Fase 1**: primeira demonstração navegável entregue (Next.js, dados simulados, sem backend). Ver [PROJECT_STATE.md](PROJECT_STATE.md) para o estado exato.

## O que é

Uma plataforma que organiza e digitaliza o que hoje só existe em planilha, papel ou controle paralelo na operação da ASA — sem substituir o AUTEM, que continua sendo o sistema principal da empresa.

## Qual problema resolve

A auditoria (`../Auditoria-ASA/`) mapeou 1.925 planilhas em uso ativo e encontrou, entre outros achados: um processo (Caixa Particular) espalhado em 759 arquivos Excel sem consolidação; vencimentos de documentação de frota digitados manualmente em até 3 lugares diferentes; uma planilha de multas rodando no limite do Excel (~30 mil fórmulas); e senhas de sistemas críticos guardadas em texto plano. Detalhes completos em [PRODUCT_VISION.md](PRODUCT_VISION.md).

## Relação com a Auditoria-ASA

| | Auditoria-ASA | Plataforma-ASA |
|---|---|---|
| **Papel** | Projeto de descoberta — **encerrado** | Projeto de construção — **ativo** |
| **Hoje é** | Base de conhecimento, somente consulta | Produto em desenvolvimento |
| **O que compartilham** | Apenas conhecimento (relatórios em `Analise/`) | Nenhum código, nenhuma estrutura reaproveitada |

## Governança

| Papel | Responsável |
|---|---|
| CEO / Especialista do Negócio | Carlos |
| Product Manager / Arquiteto da Plataforma | ChatGPT |
| CTO / Engenheiro | Claude Code |

Detalhes em [CLAUDE.md](CLAUDE.md).

## Estrutura do projeto

```
Plataforma-Asa/
├── CLAUDE.md              Constituição do projeto — ler primeiro
├── README.md              Este arquivo
├── PROJECT_STATE.md        Estado atual do projeto
├── PRODUCT_VISION.md       Visão de produto (missão, usuários, princípios)
├── ROADMAP.md              Plano de evolução por fases
├── DECISIONS.md            Registro de decisões (ADR simplificado)
├── CHANGELOG.md            Histórico de mudanças
├── LICENSE                 Direitos sobre este repositório
├── docs/                  Documentação técnica e de produto (glossário, especificações)
├── frontend/               Aplicação Next.js — primeira demonstração navegável (ver frontend/README.md)
├── assets/                 Identidade visual (logo, ícones, imagens)
├── prototipos/             Demonstrações navegáveis (HTML ou o que for decidido)
├── pesquisas/              Pesquisas de mercado e UX específicas deste produto
├── referencias/            Material de referência externo (inspiração, concorrência)
└── scripts/                Scripts utilitários de desenvolvimento
```

## Como começar

1. Leia [CLAUDE.md](CLAUDE.md) — as regras do projeto.
2. Leia [PRODUCT_VISION.md](PRODUCT_VISION.md) — o que estamos construindo e para quem.
3. Veja [PROJECT_STATE.md](PROJECT_STATE.md) — o que já existe.
4. Veja [ROADMAP.md](ROADMAP.md) — o que vem a seguir.

## Convenções

- Documentação em **português brasileiro**.
- **Dados sempre fictícios** em qualquer tela, protótipo ou demonstração (política em [CLAUDE.md](CLAUDE.md), seção 7).
- Nenhum dado, nome ou arquivo da Auditoria-ASA é copiado para dentro deste projeto — apenas referenciado por link.
