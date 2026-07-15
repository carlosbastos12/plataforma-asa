import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { iniciais } from "@/lib/insights";
import { cn } from "@/lib/utils";

/**
 * Avatar de pessoa por iniciais, com cor determinística derivada do nome —
 * a mesma pessoa tem sempre a mesma cor em qualquer tela. Humaniza dados
 * que antes eram só texto ("motorista: Fulano").
 */

const PALETA = [
  "bg-[color-mix(in_oklch,var(--chart-1)_18%,transparent)] text-[var(--chart-1)]",
  "bg-[color-mix(in_oklch,var(--chart-2)_18%,transparent)] text-[var(--chart-2)]",
  "bg-[color-mix(in_oklch,var(--chart-3)_18%,transparent)] text-[var(--chart-3)]",
  "bg-[color-mix(in_oklch,var(--chart-4)_22%,transparent)] text-[var(--chart-4)]",
  "bg-[color-mix(in_oklch,var(--chart-5)_18%,transparent)] text-[var(--chart-5)]",
];

function corPara(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) % 997;
  return PALETA[hash % PALETA.length];
}

interface PessoaAvatarProps {
  nome: string;
  /** Papel exibido no tooltip (ex.: "Motorista"). */
  papel?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PessoaAvatar({ nome, papel = "Motorista", size = "sm", className }: PessoaAvatarProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("inline-flex cursor-default", className)} />}>
        <Avatar size={size}>
          <AvatarFallback className={cn("font-semibold", corPara(nome))}>{iniciais(nome)}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        {papel}: {nome}
      </TooltipContent>
    </Tooltip>
  );
}
