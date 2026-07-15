"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, Users, ShieldCheck, BellRing, SlidersHorizontal, Mail, Plug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfigItem {
  slug: string;
  nome: string;
  icone: LucideIcon;
  oQueE: string;
  beneficio: string;
  /** Rota real quando a área já existe (ex.: usuários vive em Cadastros). */
  href?: string;
  emBreve?: boolean;
}

/**
 * Card de configuração: sempre diz o que a área é e o benefício. O que já
 * existe navega; o que vem depois responde com honestidade ao clique.
 */
export function ConfigCard({ item }: { item: ConfigItem }) {
  const conteudo = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all",
        item.emBreve ? "opacity-70" : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <item.icone className="size-[18px]" strokeWidth={2} />
        </div>
        {item.emBreve && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            em breve
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-medium text-foreground">{item.nome}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{item.oQueE}</p>
        <p className="mt-2 text-[13px] font-medium text-primary">{item.beneficio}</p>
      </div>
      {!item.emBreve && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          Abrir <ChevronRight className="size-3.5" />
        </span>
      )}
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{conteudo}</Link>;
  }

  return (
    <button
      onClick={() =>
        toast.info(`${item.nome}: reservado e a caminho`, {
          description: item.emBreve
            ? "Esta área chega nas próximas etapas — o lugar dela já está garantido aqui."
            : "Nesta demonstração esta área é ilustrativa. Na versão completa, ela abre aqui.",
        })
      }
      className="text-left"
    >
      {conteudo}
    </button>
  );
}

/** Grade completa (client): os ícones vivem aqui para não cruzarem a fronteira server → client. */
const ITENS: ConfigItem[] = [
  {
    slug: "usuarios",
    nome: "Usuários",
    icone: Users,
    oQueE: "As pessoas com acesso à plataforma e a área de cada uma.",
    beneficio: "Cada pessoa entra direto no seu trabalho, com o acesso certo.",
    href: "/cadastros/usuarios",
  },
  {
    slug: "permissoes",
    nome: "Permissões",
    icone: ShieldCheck,
    oQueE: "O que cada perfil pode ver e fazer em cada setor.",
    beneficio: "O caixa fica com quem fecha o caixa — e a direção vê tudo.",
  },
  {
    slug: "alertas",
    nome: "Alertas",
    icone: BellRing,
    oQueE: "Com quantos dias de antecedência cada prazo começa a avisar.",
    beneficio: "O aviso chega no seu tempo de reação — nem cedo demais, nem tarde.",
  },
  {
    slug: "preferencias",
    nome: "Preferências",
    icone: SlidersHorizontal,
    oQueE: "Tema claro ou escuro, tela inicial e o jeito de exibir os números.",
    beneficio: "A plataforma se adapta a você — não o contrário.",
  },
  {
    slug: "notificacoes",
    nome: "Notificações",
    icone: Mail,
    oQueE: "O que chega por e-mail ou aviso no sistema, e para quem.",
    beneficio: "O urgente encontra você — sem afogar ninguém em aviso.",
  },
  {
    slug: "integracoes",
    nome: "Integrações",
    icone: Plug,
    oQueE: "Conexões com outros sistemas da operação.",
    beneficio: "Menos digitação dupla: o dado nasce num lugar e aparece nos dois.",
    emBreve: true,
  },
];

export function ConfiguracoesGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ITENS.map((item) => (
        <ConfigCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
