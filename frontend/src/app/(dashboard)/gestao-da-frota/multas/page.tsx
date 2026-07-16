import type { Metadata } from "next";
import { Wallet2, Clock3, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { MultasView } from "@/components/multas/multas-view";
import { FROTA, formatarMoeda } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Multas da Frota",
};

export default function MultasPage() {
  const todas = FROTA.flatMap((v) => v.multas);
  const aguardando = todas.filter((m) => m.status === "aguardando_indicacao");
  const pagas = todas.filter((m) => m.status === "paga");
  const valorAberto = aguardando.reduce((acc, m) => acc + m.valor, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">O que pode gerar prejuízo?</h2>
        <p className="text-sm text-muted-foreground">
          {aguardando.length > 0
            ? "Indicar o condutor a tempo evita que o valor da multa dobre."
            : "Nenhuma multa com prazo correndo. Quando uma chegar, o prazo de indicação aparece em contagem regressiva."}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard icon={Wallet2} tone="crit" label="Valor em aberto" value={formatarMoeda(valorAberto)} foot={`${aguardando.length} multa(s) pendentes`} />
        <KpiCard icon={Clock3} tone="warn" label="Aguardando indicação" value={String(aguardando.length)} foot="prazo em contagem regressiva" />
        <KpiCard icon={CheckCircle2} tone="ok" label="Pagas" value={String(pagas.length)} foot="sem pendência restante" />
      </section>

      <MultasView />
    </div>
  );
}
