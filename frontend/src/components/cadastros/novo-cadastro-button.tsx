"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Ação de novo registro (demonstração): responde de verdade ao clique e
 * explica seu propósito no hover — nenhum botão sem contexto.
 */
export function NovoCadastroButton({ rotulo, nomeCadastro }: { rotulo: string; nomeCadastro: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.success(`${rotulo}: pronto para receber o cadastro`, {
                description: `Nesta demonstração o formulário de ${nomeCadastro.toLowerCase()} é ilustrativo — na versão completa, o registro entra aqui e aparece em toda a plataforma na hora.`,
              })
            }
          />
        }
      >
        <Plus className="size-4" /> {rotulo}
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-pretty">
        Adiciona um registro a este cadastro. Registrado uma vez, ele aparece em toda a plataforma — sem redigitação.
      </TooltipContent>
    </Tooltip>
  );
}
