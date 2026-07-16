"use client";

import { useState } from "react";
import { UserCheck2, Truck, Coffee, Palmtree, Stethoscope, UserX, ListChecks, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/kpi-card";
import { NovoColaboradorDialog } from "./novo-colaborador-dialog";
import { RegistrarAusenciaDialog } from "./registrar-ausencia-dialog";
import { EscalaBoard } from "./escala-board";
import { InteligenciaEquipePanel, AlertasEquipePanel, TimelineEquipePanel } from "./inteligencia-equipe-panel";
import { FichaColaboradorSheet } from "./ficha-colaborador-sheet";
import { ListaColaboradores } from "./lista-colaboradores";
import { CalendarioEquipe } from "./calendario-equipe";
import {
  EQUIPE,
  AUSENCIAS,
  quadroDeEscala,
  insightsEquipe,
  alertasEquipe,
  turnosEmAberto,
  timelineEquipe,
  type Colaborador,
  type Ausencia,
} from "@/lib/equipe";

/**
 * Equipe Operacional como módulo operacional, não "RH" (P037): uma falta,
 * um atestado ou uma férias mudam a capacidade da empresa de atender
 * chamados — cada peça da tela mostra essa ligação, não só o registro.
 */
export function EquipeView() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(EQUIPE);
  const [ausencias, setAusencias] = useState<Ausencia[]>(AUSENCIAS);
  const [selecionado, setSelecionado] = useState<Colaborador | null>(null);

  const quadro = quadroDeEscala(colaboradores);
  const insights = insightsEquipe(colaboradores);
  const alertas = alertasEquipe(colaboradores, ausencias);
  const abertas = turnosEmAberto();

  const ativos = colaboradores.length;
  const emServico = colaboradores.filter((c) => c.status === "disponivel" || c.status === "em_rota").length;
  const folga = colaboradores.filter((c) => c.status === "folga").length;
  const ferias = colaboradores.filter((c) => c.status === "ferias").length;
  const emAtestado = colaboradores.filter((c) => c.status === "ausente").length;
  const faltas = ausencias.filter((a) => a.tipo === "falta").length;
  const necessidadeSubstituicao = ausencias.filter((a) => a.impactaEscala && !a.substituto).length;

  function registrarAusencia(a: Ausencia) {
    setAusencias((atual) => [a, ...atual]);
    if (a.tipo === "atestado" || a.tipo === "ferias") {
      setColaboradores((atual) =>
        atual.map((c) => (c.nome === a.colaborador ? { ...c, status: a.tipo === "atestado" ? "ausente" : "ferias" } : c))
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <KpiCard icon={UserCheck2} tone="info" label="Colaboradores ativos" value={String(ativos)} />
        <KpiCard icon={Truck} tone="ok" label="Em serviço" value={String(emServico)} />
        <KpiCard icon={Coffee} tone="ok" label="Folga" value={String(folga)} />
        <KpiCard icon={Palmtree} tone="warn" label="Férias" value={String(ferias)} />
        <KpiCard icon={Stethoscope} tone="crit" label="Atestados" value={String(emAtestado)} />
        <KpiCard icon={UserX} tone={faltas > 0 ? "warn" : "ok"} label="Faltas" value={String(faltas)} />
        <KpiCard icon={ListChecks} tone={abertas.length > 0 ? "warn" : "ok"} label="Escalas abertas" value={String(abertas.length)} />
        <KpiCard icon={UserCog} tone={necessidadeSubstituicao > 0 ? "crit" : "ok"} label="Precisa de substituição" value={String(necessidadeSubstituicao)} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <NovoColaboradorDialog onRegistrar={(c) => setColaboradores((atual) => [...atual, c])} />
        <RegistrarAusenciaDialog tipo="atestado" onRegistrar={registrarAusencia} />
        <RegistrarAusenciaDialog tipo="falta" onRegistrar={registrarAusencia} />
        <RegistrarAusenciaDialog tipo="ferias" onRegistrar={registrarAusencia} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4">
              <EscalaBoard cartoes={quadro} onSelecionar={setSelecionado} />
              <AlertasEquipePanel alertas={alertas} />
            </div>
            <div className="flex flex-col gap-4">
              <InteligenciaEquipePanel insights={insights} />
              <TimelineEquipePanel atividades={timelineEquipe()} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colaboradores" className="mt-4">
          <ListaColaboradores colaboradores={colaboradores} onSelecionar={setSelecionado} />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <CalendarioEquipe />
        </TabsContent>
      </Tabs>

      <FichaColaboradorSheet colaborador={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  );
}
