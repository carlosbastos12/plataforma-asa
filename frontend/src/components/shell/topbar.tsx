"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, CircleHelp } from "lucide-react";
import { useApresentacao } from "@/components/onboarding/conheca-plataforma";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TODAY } from "@/lib/mock-data";
import type { ContagemSetor } from "@/lib/insights";
import { BrandMark } from "./brand-mark";
import { SidebarNav } from "./sidebar-nav";
import { NAV_ITEMS, PLATAFORMA_ITEMS } from "./nav-items";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";

interface TopbarProps {
  contagens: Record<string, ContagemSetor>;
}

// A data exibida acompanha a data de referência dos dados da demonstração —
// relógio e conteúdo contam a mesma história (correção P025).
const DATE_LABEL = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(TODAY);

export function Topbar({ contagens }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { abrir } = useApresentacao();

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
        <h1 className="truncate text-[15px] font-semibold text-foreground">{current.label}</h1>
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
                aria-label="Conheça a Plataforma ASA"
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
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                CA
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom">Carlos — Diretoria</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
