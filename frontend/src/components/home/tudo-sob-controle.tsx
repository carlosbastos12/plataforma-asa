import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { itensSobControle } from "@/lib/insights";

/**
 * O que já está em ordem — mostrado só depois das decisões, para nunca
 * disfarçar um problema, mas também para a home nunca soar só como uma
 * lista de alarmes (P034).
 */
export function TudoSobControle() {
  const itens = itensSobControle();
  if (itens.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-soft/60 px-3 py-1.5 text-[13px] font-medium text-foreground/80 transition-all hover:-translate-y-0.5 hover:border-success/40"
        >
          <CircleCheckBig className="size-3.5 text-success" strokeWidth={2.25} />
          {item.texto}
        </Link>
      ))}
    </div>
  );
}
