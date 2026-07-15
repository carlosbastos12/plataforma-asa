# frontend/

Aplicação da Plataforma-ASA — demonstração navegável, sem backend (ver [../PROJECT_STATE.md](../PROJECT_STATE.md)).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · shadcn/ui · Lucide · Motion (framer-motion). Confirmada pelo CEO ao abrir a Fase 1 — ver D-007 em [../DECISIONS.md](../DECISIONS.md).

## Rodar localmente

```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção localmente |
| `npm run lint` | ESLint |

## Variáveis de ambiente

Nenhuma é obrigatória nesta fase — sem backend, sem API real. Ver [`.env.example`](.env.example).

## Estrutura

```
src/
├── app/
│   ├── layout.tsx              Fontes (Geist), ThemeProvider, TooltipProvider, Toaster, metadata
│   ├── globals.css             Design tokens (paleta, tipografia) — ver D-010
│   └── (dashboard)/            Grupo de rotas com a casca (sidebar + topbar)
│       ├── layout.tsx
│       ├── page.tsx            Central de Operações (home)
│       ├── acionamento/page.tsx          Quadro de chamados ativos
│       ├── gestao-da-frota/
│       │   ├── layout.tsx                Sub-navegação por abas do setor
│       │   ├── page.tsx                  Hub do setor
│       │   ├── veiculos/page.tsx         Lista de veículos
│       │   ├── veiculos/[placa]/page.tsx Ficha do veículo (documentação, multas, manutenções, linha do tempo)
│       │   ├── documentacao/page.tsx
│       │   └── multas/page.tsx
│       └── fechamento/
│           ├── layout.tsx                Sub-navegação por abas do setor
│           ├── page.tsx                  Hub do setor
│           └── caixa/page.tsx            Caixa Particular
├── components/
│   ├── ui/                     Componentes shadcn/ui (gerados, não editar à mão sem necessidade)
│   ├── shell/                  Sidebar, topbar, busca global, alternância de tema, sub-abas de setor
│   ├── home/ frota/ documentacao/ multas/ acionamento/ caixa/   Componentes específicos de cada tela
│   ├── empty-state.tsx         Estado vazio compartilhado
│   └── status-badge.tsx        Badge de status compartilhado (crítico/atenção/em dia)
└── lib/
    ├── mock-data.ts            Dataset fictício único — ver D-012 em ../DECISIONS.md
    └── utils.ts                Utilitário `cn` do shadcn/ui
```

Rotas por setor: **Acionamento** (`/acionamento`), **Gestão da Frota** (`/gestao-da-frota/*`) e **Fechamento** (`/fechamento/*`) — ver D-014 em `../DECISIONS.md`.

## Regras válidas neste código

- **Sem backend, sem banco, sem autenticação, sem API** nesta fase — todo dado vem de `src/lib/mock-data.ts`.
- **Nenhum dado real da ASA** — nem da Auditoria-ASA, nem dos protótipos anteriores. Todo identificador (placa, motorista, parceiro) é fictício e novo (D-012 em `../DECISIONS.md`).
- Paleta e tipografia seguem os tokens definidos em `src/app/globals.css` — não introduzir cores soltas fora desses tokens.
- Ações de escrita (despachar motorista, fechar caixa) são **simuladas**: alteram apenas o estado local do React e mostram um toast — nada é persistido.
