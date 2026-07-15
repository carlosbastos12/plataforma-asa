import { Greeting } from "@/components/home/greeting";
import { TaskList } from "@/components/home/task-list";
import { SectorFlow } from "@/components/home/sector-flow";
import { montarTarefasDoDia, contarPendenciasPorSetor } from "@/lib/mock-data";

export default function CentralDeOperacoesPage() {
  const tarefas = montarTarefasDoDia();
  const criticos = tarefas.filter((t) => t.severidade === "critico");
  const atencao = tarefas.filter((t) => t.severidade === "atencao");
  const setores = contarPendenciasPorSetor();

  return (
    <div className="flex flex-col gap-8">
      <Greeting totalCriticos={criticos.length} totalAtencao={atencao.length} />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">O que precisa da sua atenção</h2>
          <p className="text-sm text-muted-foreground">
            Ordenado por urgência — toque em qualquer item para resolver.
          </p>
        </div>
        <TaskList tarefas={tarefas} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Onde você quer trabalhar agora?</h2>
          <p className="text-sm text-muted-foreground">
            O mesmo caminho de todo atendimento: nasce no Acionamento, roda pela Gestão da Frota, se consolida no Fechamento.
          </p>
        </div>
        <SectorFlow
          acionamento={setores.acionamento}
          gestaoDaFrota={setores.gestaoDaFrota}
          fechamento={setores.fechamento}
        />
      </section>
    </div>
  );
}
