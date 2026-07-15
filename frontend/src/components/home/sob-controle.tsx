import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { FROTA, CAIXA, CHAMADOS_ATIVOS, statusVencimento, situacaoVeiculo } from "@/lib/mock-data";

/**
 * Faixa de tranquilidade (P029): antes de qualquer pendência, a home mostra
 * o que já está em ordem — e continua sendo vigiado. Cada item leva à tela
 * que sustenta a afirmação.
 */
export function SobControle() {
  const docs = FROTA.flatMap((v) => v.docs);
  const docsEmDia = docs.filter((d) => statusVencimento(d.vencimento) === "regular").length;
  const aptos = FROTA.filter((v) => situacaoVeiculo(v) !== "critico").length;
  const concluidos = CHAMADOS_ATIVOS.filter((c) => c.status === "concluido").length;
  const fechados = CAIXA.filter((c) => c.status === "fechado").length;

  const itens = [
    { href: "/gestao-da-frota/veiculos", texto: `${aptos} de ${FROTA.length} veículos aptos a rodar` },
    { href: "/gestao-da-frota/documentacao", texto: `${docsEmDia} documentos em dia — e vigiados` },
    { href: "/acionamento", texto: `${concluidos} atendimentos concluídos hoje` },
    { href: "/fechamento", texto: `${fechados} caixas conferidos e fechados` },
  ].filter((i) => !i.texto.startsWith("0 "));

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
