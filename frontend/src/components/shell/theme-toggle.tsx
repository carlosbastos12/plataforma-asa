"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // `resolvedTheme` só existe depois da hidratação — antes disso, renderiza
  // um espaço reservado idêntico em servidor e cliente (evita mismatch sem
  // precisar de useEffect + setState).
  if (!resolvedTheme) {
    return <div className="size-9" aria-hidden />;
  }

  const escuro = resolvedTheme === "dark";
  const rotulo = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(escuro ? "light" : "dark")}
            aria-label={rotulo}
            className="text-muted-foreground"
          />
        }
      >
        {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </TooltipTrigger>
      <TooltipContent side="bottom">{rotulo}</TooltipContent>
    </Tooltip>
  );
}
