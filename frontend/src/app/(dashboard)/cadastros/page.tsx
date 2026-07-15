import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CADASTROS } from "@/lib/cadastros";

export const metadata: Metadata = {
  title: "Cadastros",
};

/**
 * Hub de cadastros: a base que alimenta todos os setores. Cada card diz o
 * que o cadastro faz e o benefício — não apenas o nome.
 */
export default function CadastrosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quem faz parte da sua operação?
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Veículos, pessoas e parceiros registrados uma única vez — e reaproveitados em toda a plataforma.
          Cadastro certo aqui é retrabalho a menos em todo o resto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CADASTROS.map((c) => (
          <Link
            key={c.slug}
            href={`/cadastros/${c.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <c.icone className="size-[18px]" strokeWidth={2} />
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {c.itens.length} registro(s)
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-foreground">{c.nome}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{c.resumo}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Abrir cadastro <ChevronRight className="size-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
