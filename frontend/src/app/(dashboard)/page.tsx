import type { Metadata } from "next";
import { Greeting } from "@/components/home/greeting";
import { LeituraOperacional } from "@/components/home/leitura-operacional";
import { DashboardExecutivo } from "@/components/home/dashboard-executivo";
import { DecidirAgora } from "@/components/home/decidir-agora";
import { TudoSobControle } from "@/components/home/tudo-sob-controle";
import { SectorFlow } from "@/components/home/sector-flow";
import { montarTarefasDoDia } from "@/lib/mock-data";
import { calcularIndicadores } from "@/lib/insights";
import { ausenciasComImpactoNaEscala } from "@/lib/equipe";
import { diasDeAutonomiaTanque } from "@/lib/combustivel";

export const metadata: Metadata = {
  title: "Central de Operações",
};

/**
 * Ordem da home (P034): saudação → leitura do assistente → dashboard
 * executivo → decidir agora (máx. 3) → tudo sob controle → fluxo
 * operacional. A home mostra a operação, não uma lista de módulos.
 */
export default function CentralDeOperacoesPage() {
  const tarefas = montarTarefasDoDia();
  const criticos = tarefas.filter((t) => t.severidade === "critico");
  const atencao = tarefas.filter((t) => t.severidade === "atencao");
  const indicadores = calcularIndicadores();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Greeting totalCriticos={criticos.length} totalAtencao={atencao.length} />
        <LeituraOperacional />
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">A operação em números</h2>
          <p className="text-sm text-muted-foreground">Toque em qualquer número para ver o que está por trás dele.</p>
        </div>
        <DashboardExecutivo />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Decidir agora</h2>
          <p className="text-sm text-muted-foreground">
            O que precisa da sua decisão hoje — nunca mais que três de uma vez.
          </p>
        </div>
        <DecidirAgora />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Tudo sob controle</h2>
          <p className="text-sm text-muted-foreground">O que já está em ordem — e continua sendo vigiado.</p>
        </div>
        <TudoSobControle />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Onde você quer trabalhar agora?</h2>
          <p className="text-sm text-muted-foreground">
            O caminho de todo atendimento: nasce no Acionamento, passa pela Frota e pela Equipe, consome
            Combustível e se consolida no Fechamento.
          </p>
        </div>
        <SectorFlow
          acionamento={indicadores.chamadosAguardando}
          gestaoDaFrota={indicadores.docsVencidos + indicadores.multasAguardando}
          equipe={ausenciasComImpactoNaEscala().length}
          combustivelDias={diasDeAutonomiaTanque()}
          fechamento={indicadores.caixasEmAberto}
        />
      </section>
    </div>
  );
}
