import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { explicarDocumento } from "@/lib/insights";
import { cn } from "@/lib/utils";

/**
 * Sigla ou termo técnico com explicação em tooltip — nenhuma sigla aparece
 * na interface sem responder "o que é e por que importa" a um hover.
 */
export function Sigla({ termo, className }: { termo: string; className?: string }) {
  const explicacao = explicarDocumento(termo);
  if (explicacao === termo) return <span className={className}>{termo}</span>;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2",
              className
            )}
          />
        }
      >
        {termo}
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty">{explicacao}</TooltipContent>
    </Tooltip>
  );
}
