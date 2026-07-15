import type { Metadata } from "next";
import Link from "next/link";
import { Wallet2, ClipboardList, Layers, Building2, CircleCheckBig, ChevronRight, Clock3 } from "lucide-react";
import { SectorLinkCard } from "@/components/shell/sector-link-card";
import { CAIXA, formatarData, formatarMoeda } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fechamento",
};

export default function FechamentoPage() {
  const dias = CAIXA.map((c) => ({
    data: c.data,
    status: c.status,
    lancamentos: c.lancamentos.length,
    saldo: c.lancamentos.reduce((acc, l) => acc + l.valor, 0),
  }));
  const emAberto = dias.filter((d) => d.status === "aberto");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          O que falta para concluir os fechamentos?
        </h2>
        <p className="text-sm text-muted-foreground">
          {emAberto.length > 0
            ? `${emAberto.length} caixa(s) aguardando conferência — fechar no dia evita divergência acumulada no fim do mês.`
            : "Todos os caixas conferidos e fechados. O dia pode ser encerrado com segurança."}
        </p>
      </div>

      {/* Checklist: cada linha diz o que está pendente, o que acontece se
          ficar pendente e qual ação conclui — nunca só o registro. */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {dias.map((dia) => {
            const aberto = dia.status === "aberto";
            return (
              <li key={dia.data}>
                <Link
                  href="/fechamento/caixa"
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      aberto ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
                    )}
                  >
                    {aberto ? (
                      <Clock3 className="size-4" strokeWidth={2.25} />
                    ) : (
                      <CircleCheckBig className="size-4" strokeWidth={2.25} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Caixa de {formatarData(dia.data)}
                      {aberto ? " — aguardando fechamento" : " — fechado"}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {dia.lancamentos} lançamento(s) · saldo {aberto ? "parcial" : "conferido"} de{" "}
                      {formatarMoeda(dia.saldo)}
                    </p>
                  </div>
                  {aberto && (
                    <span className="hidden shrink-0 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                      Conferir e fechar
                    </span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Áreas do setor</h3>
          <p className="text-[13px] text-muted-foreground">
            O Caixa Particular já está em pleno funcionamento. As demais áreas têm o lugar reservado e chegam nas
            próximas etapas.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SectorLinkCard
            href="/fechamento/caixa"
            icon={Wallet2}
            title="Caixa Particular"
            description="Entradas, saídas e fechamento do dia."
            badge={emAberto.length > 0 ? `${emAberto.length} dia(s) em aberto` : "tudo fechado"}
          />
          <SectorLinkCard
            icon={ClipboardList}
            title="Conferência de Serviços"
            description="Cruzar o que foi atendido com o que foi registrado."
            badge="em breve"
            disabled
          />
          <SectorLinkCard
            icon={Layers}
            title="Consolidação"
            description="Reunir o período antes do fechamento financeiro."
            badge="em breve"
            disabled
          />
          <SectorLinkCard
            icon={Building2}
            title="Seguradoras"
            description="Relacionamento e prestação de contas com parceiros."
            badge="em breve"
            disabled
          />
        </div>
      </section>
    </div>
  );
}
