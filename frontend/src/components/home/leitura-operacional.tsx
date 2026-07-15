import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { leituraOperacional, type ItemLeitura } from "@/lib/insights";
import { cn } from "@/lib/utils";

const CORES: Record<ItemLeitura["tom"], string> = {
  ok: "bg-success",
  atencao: "bg-warning",
  critico: "bg-destructive",
};

/**
 * A home lê a operação por você, como faria um assistente que já conferiu
 * tudo antes de você chegar (P033): cada linha é uma frase pronta, nunca
 * um número cru — e cita o dado que a sustenta.
 */
export function LeituraOperacional() {
  const itens = leituraOperacional();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" strokeWidth={2.25} />
        Leitura de hoje
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {itens.map((item, i) => {
          const conteudo = (
            <>
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", CORES[item.tom])} />
              <span className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-foreground">{item.texto}</span>
              {item.href && (
                <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              )}
            </>
          );
          return (
            <li key={i} className="py-2.5 first:pt-0 last:pb-0">
              {item.href ? (
                <Link href={item.href} className="group flex items-start gap-2.5 -mx-1 rounded-lg px-1 transition-colors hover:text-primary">
                  {conteudo}
                </Link>
              ) : (
                <div className="flex items-start gap-2.5">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
