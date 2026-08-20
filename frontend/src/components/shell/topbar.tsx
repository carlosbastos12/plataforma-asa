"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, CircleHelp, LogIn, LogOut } from "lucide-react";
import { useApresentacao } from "@/components/onboarding/conheca-plataforma";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TODAY } from "@/lib/mock-data";
import type { ContagemSetor } from "@/lib/insights";
import type { UsuarioSessao } from "@/lib/financeiro/consultas";
import { PAPEL_LABEL } from "@/lib/financeiro/tipos";
import { sair } from "@/lib/financeiro/acoes";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";
import { NAV_ITEMS, PLATAFORMA_ITEMS } from "./nav-items";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";

interface TopbarProps {
  contagens: Record<string, ContagemSetor>;
  /** Sessão real da Central Financeira — null quando ninguém está autenticado (resto da plataforma, em demonstração). */
  usuario: UsuarioSessao | null;
}

/** Duas iniciais a partir do nome real — nunca um valor fixo. */
function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// A data exibida acompanha a data de referência dos dados da demonstração —
// relógio e conteúdo contam a mesma história (correção P025).
const DATE_LABEL = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(TODAY);

export function Topbar({ contagens, usuario }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { abrir } = useApresentacao();
  const [saindo, iniciarSaida] = useTransition();

  function sairDaConta() {
    iniciarSaida(async () => {
      await sair();
      router.replace("/login");
      router.refresh();
    });
  }

  const current =
    [...NAV_ITEMS, ...PLATAFORMA_ITEMS].reverse().find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-sm md:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="px-4 pt-6 pb-2">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <BrandMark />
          </SheetHeader>
          <div className="px-3 pt-2">
            <SidebarNav contagens={contagens} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
      </Sheet>

      <div className="min-w-0 shrink-0">
        <h1 className="truncate text-[17px] font-bold tracking-tight text-foreground">{current.label}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{current.pergunta}</p>
      </div>

      <div className="flex flex-1 justify-end md:justify-center">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="hidden pr-2 text-sm capitalize text-muted-foreground lg:block">{DATE_LABEL}</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={abrir}
                aria-label="Conheça a Plataforma do ASA Reboques"
              />
            }
          >
            <CircleHelp className="size-[18px]" strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56 text-pretty">
            Reveja a apresentação: o que cada setor faz e como a plataforma trabalha por você.
          </TooltipContent>
        </Tooltip>
        <ThemeToggle />
        {usuario ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button type="button" className="rounded-full outline-none" aria-label="Menu do usuário" />}
            >
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {iniciaisDoNome(usuario.nome)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            {/* `w-auto`: por padrão o popup copia a largura do gatilho, que aqui
                é só o avatar — estreito demais para o nome e a função caberem. */}
            <DropdownMenuContent align="end" className="w-auto min-w-52">
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
                <span className="text-sm font-semibold text-foreground">{usuario.nome}</span>
                <span className="text-xs text-muted-foreground">{PAPEL_LABEL[usuario.papel]}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={saindo} onClick={sairDaConta}>
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="sm" className="gap-1.5 text-sm" onClick={() => router.push("/login")} />
              }
            >
              <LogIn className="size-[15px]" />
              Entrar
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56 text-pretty">
              Acesse a Central Financeira com seu e-mail e senha.
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
