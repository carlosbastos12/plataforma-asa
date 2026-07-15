import type { Metadata } from "next";
import { Greeting } from "@/components/home/greeting";
import { TaskList } from "@/components/home/task-list";
import { SectorFlow } from "@/components/home/sector-flow";
import { KpiStrip } from "@/components/home/kpi-strip";
import { montarTarefasDoDia } from "@/lib/mock-data";
import { calcularIndicadores } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Central de Operações",
};

export default function CentralDeOperacoesPage() {
  const tarefas = montarTarefasDoDia();
  const criticos = tarefas.filter((t) => t.severidade === "critico");
  const atencao = tarefas.filter((t) => t.severidade === "atencao");
  const indicadores = calcularIndicadores();

  return (
    <div className="flex flex-col gap-8">
      <Greeting totalCriticos={criticos.length} totalAtencao={atencao.length} />

      <KpiStrip indicadores={indicadores} />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Decidir agora</h2>
          <p className="text-sm text-muted-foreground">
            O que já venceu ou está estourando o prazo — em ordem de urgência.
          </p>
        </div>
        <TaskList tarefas={tarefas} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Onde você quer trabalhar agora?</h2>
          <p className="text-sm text-muted-foreground">
            O caminho de todo atendimento: nasce no Acionamento, roda pela Gestão da Frota, se consolida no Fechamento.
          </p>
        </div>
        <SectorFlow
          acionamento={indicadores.chamadosAguardando}
          gestaoDaFrota={indicadores.docsVencidos + indicadores.multasAguardando}
          fechamento={indicadores.caixasEmAberto}
        />
      </section>
    </div>
  );
}
