"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Ação de demonstração — mesmo padrão usado em Cadastros e Configurações. */
export function NovaMultaButton() {
  return (
    <Button
      className="justify-start gap-2"
      onClick={() =>
        toast.success("Nova multa: pronto para receber o lançamento", {
          description: "Nesta demonstração o formulário é ilustrativo — na versão completa, a multa entra aqui e já aparece no painel.",
        })
      }
    >
      <Plus className="size-4" /> Nova multa
    </Button>
  );
}
