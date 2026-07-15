"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // `resolvedTheme` só existe depois da hidratação — antes disso, renderiza
  // um espaço reservado idêntico em servidor e cliente (evita mismatch sem
  // precisar de useEffect + setState).
  if (!resolvedTheme) {
    return <div className="size-9" aria-hidden />;
  }

  const escuro = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="text-muted-foreground"
    >
      {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}
