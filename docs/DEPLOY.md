# Publicação — GitHub → Vercel → Produção

> Runbook permanente (Missão P038). Existe porque, por várias missões seguidas, todo push em `master` virou apenas um deployment **Preview** na Vercel — a Produção (`plataforma-asa.vercel.app`) nunca atualizou sozinha, mesmo com o branch de produção configurado como `master`. Este documento explica o porquê (até onde dá pra confirmar de fora do painel), o que fazer a cada push enquanto isso não for corrigido na raiz, e como corrigir a raiz de uma vez.

## Diagnóstico

**Fato confirmado (não é suposição):** a cada push em `master`, a Vercel gera um deployment nas URLs de Preview (`plataforma-asa-git-master-ancoraplace.vercel.app`) normalmente, mas a URL de produção (`plataforma-asa.vercel.app`) **não muda sozinha** — fica presa no último deployment promovido manualmente, mesmo dias depois e vários commits atrás.

**Evidência (Missão P035 + P038):**
- GitHub está limpo: repositório único (`carlosbastos12/plataforma-asa`), branch única (`master`), sem branch órfã.
- A produção só avançou quando alguém clicou manualmente em "Promote to Production" no painel da Vercel (confirmado: entre a Missão P035 e a P038, a produção pulou do commit anterior para `bd292ee` só depois dessa ação manual — nunca sozinha).
- O agente Claude conectado a este projeto **não tem acesso de API/MCP ao projeto `plataforma-asa` na Vercel** — o conector só enxerga o projeto `loja-elaine` dentro do time "Carlos" (slug `ancoraplace`). Por isso nenhuma missão anterior conseguiu ler ou corrigir a configuração diretamente — só inferir pelo comportamento observado via HTTP.

**Hipótese mais provável (não confirmada, porque não há acesso ao painel):** o campo **Production Branch**, em *Project Settings → Git*, não está configurado como `master` (ex.: ainda está como `main`, o padrão da Vercel para projetos novos). Quando isso acontece, **todo** deployment de `master` nasce como Preview, e vira Produção **somente** com "Promote to Production" manual — exatamente o padrão observado em 100% dos pushes desta sessão.

**Hipótese secundária:** existe alguma proteção de "aprovação antes de promover" ativa nas configurações de Git/Deployment Protection do projeto.

## Correção definitiva (fazer uma vez, no painel da Vercel)

1. Acesse **vercel.com → projeto `plataforma-asa` → Settings → Git**.
2. Confira o campo **Production Branch**. Se não estiver `master`, mude para `master` e salve.
3. Em **Settings → Git**, confirme que a integração com o GitHub está **Connected** (não pausada) e apontando para `carlosbastos12/plataforma-asa`.
4. Em **Settings → Domains**, clique em `plataforma-asa.vercel.app` e confirme que ele está atribuído a **Production** (não fixado manualmente a um deployment específico — se estiver, existe um botão para "remover atribuição fixa" e voltar a seguir a Produção automaticamente).
5. Em **Settings → Deployment Protection**, confirme que não há "Require approval" ativo para o branch `master`.
6. Depois de corrigir, faça um commit trivial (ou clique em "Redeploy" no último deployment de `master`) e confirme que desta vez ele nasce **direto como Production**, sem precisar de promoção manual.

## Enquanto a causa raiz não é corrigida — o que fazer a cada push

1. Depois do `git push`, aguardar a Vercel terminar o build (1–2 min).
2. Ir em **vercel.com → plataforma-asa → Deployments**, achar o deployment mais recente do branch `master`.
3. Menu "⋯" → **Promote to Production**.
4. Confirmar em `https://plataforma-asa.vercel.app` que o conteúdo novo apareceu (pode levar até ~1 min pelo cache).

## As duas URLs — o que cada uma é

| URL | O que é | Por que às vezes parecem diferentes |
|---|---|---|
| `plataforma-asa.vercel.app` | **Alias de Produção** — sempre serve o deployment marcado como "Production" no painel. | Só muda quando alguém promove um deployment novo — nunca sozinho, pela causa raiz acima. |
| `plataforma-asa-git-master-ancoraplace.vercel.app` | **Alias de branch** — sempre serve o deployment **mais recente do branch `master`**, automaticamente, a cada push. | É sempre a versão mais nova. `ancoraplace` no nome é só o slug do time da conta Vercel (time "Carlos") — não é um projeto legado nem dependência entre projetos, é a convenção de nomenclatura padrão da Vercel (`{projeto}-git-{branch}-{time}.vercel.app`). |

Esta segunda URL tem **Vercel Deployment Protection (SSO)** ativa — só abre para quem está logado na Vercel no navegador. Isso é normal para URLs de Preview e não precisa ser desativado; só explica por que uma ferramenta automatizada (como este agente, via `curl`) não consegue abrir essa URL para conferir.

## Acesso do agente Claude à Vercel (opcional, melhora futuras missões)

O conector Vercel deste projeto Claude está autorizado apenas para o projeto `loja-elaine`. Se `plataforma-asa` for adicionado ao escopo do conector (Vercel → Configurações da integração/conector → adicionar o projeto), o agente passa a conseguir **ler e corrigir** Production Branch, Domains e promover deployments diretamente, sem depender de instruções manuais a cada missão.

---
*Ver também: [DECISIONS.md](../DECISIONS.md) D-038 · Missões P035 e P038 para o histórico completo da investigação.*
