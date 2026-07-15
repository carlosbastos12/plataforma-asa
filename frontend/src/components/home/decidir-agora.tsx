import Link from "next/link";
import { PartyPopper, ArrowRight } from "lucide-react";
import { tarefasPrioritarias } from "@/lib/insights";

/**
 * No máximo 3 decisões por vez — cada uma responde o que está em jogo, por
 * que, e o que fazer a respeito. Nunca um status sozinho (P034).
 */
export function DecidirAgora() {
  const itens = tarefasPrioritarias(3);

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <PartyPopper className="size-5" strokeWidth={2} />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nenhuma decisão pendente agora. Assim que algo precisar de você, aparece aqui primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {itens.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className="group flex flex-col gap-2.5 rounded-2xl border border-destructive/20 border-l-4 border-l-destructive bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-[15px] font-semibold leading-snug text-foreground">{item.consequencia}</p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{item.motivo}</p>
          <p className="mt-auto flex items-center gap-1.5 text-[13px] font-medium text-primary">
            {item.acao}
            <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Link>
      ))}
    </div>
  );
}
