import { AlertTriangle, Clock3, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/home/stat-card";
import { MultasTable } from "@/components/multas/multas-table";
import { FROTA, formatarMoeda } from "@/lib/mock-data";

export default function MultasPage() {
  const todas = FROTA.flatMap((v) => v.multas);
  const aguardando = todas.filter((m) => m.status === "aguardando_indicacao");
  const pagas = todas.filter((m) => m.status === "paga");
  const valorAberto = aguardando.reduce((acc, m) => acc + m.valor, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Multas da frota, sem planilha</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe o prazo de indicação de condutor antes que ele vença.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={AlertTriangle} label="valor em aberto" value={formatarMoeda(valorAberto)} tone="warning" />
        <StatCard icon={Clock3} label="aguardando indicação" value={String(aguardando.length)} tone="warning" />
        <StatCard icon={CheckCircle2} label="pagas" value={String(pagas.length)} tone="success" />
      </section>

      <MultasTable />
    </div>
  );
}
