"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TODAY, formatarData } from "@/lib/mock-data";
import { eventosCalendario, type TipoEventoCalendario } from "@/lib/equipe";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const COR_TIPO: Record<TipoEventoCalendario, string> = {
  folga: "bg-muted-foreground",
  ferias: "bg-warning",
  atestado: "bg-destructive",
  falta: "bg-destructive",
  treinamento: "bg-info",
  escala: "bg-primary",
};

const LEGENDA: { tipo: TipoEventoCalendario; rotulo: string }[] = [
  { tipo: "escala", rotulo: "Escala" },
  { tipo: "folga", rotulo: "Folga" },
  { tipo: "ferias", rotulo: "Férias" },
  { tipo: "atestado", rotulo: "Atestado/Falta" },
  { tipo: "treinamento", rotulo: "Treinamento" },
];

function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Calendário mensal: folgas, férias, atestados, faltas, treinamentos e escalas — tudo no mesmo mapa do mês (P037). */
export function CalendarioEquipe() {
  const eventos = eventosCalendario();
  const ano = TODAY.getFullYear();
  const mes = TODAY.getMonth();
  const hojeISO = TODAY.toISOString().slice(0, 10);

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];

  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(TODAY.getDate());
  const eventosDoDia = diaSelecionado ? eventos.filter((e) => e.data === iso(ano, mes, diaSelecionado)) : [];

  return (
    <Panel>
      <PanelHeader title={TODAY.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} subtitle="Folgas, férias, atestados, faltas, treinamentos e escalas no mesmo mapa" />
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-muted-foreground">
          {DIAS_SEMANA.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {celulas.map((dia, i) => {
            if (dia === null) return <div key={i} />;
            const dataISO = iso(ano, mes, dia);
            const tiposDoDia = Array.from(new Set(eventos.filter((e) => e.data === dataISO).map((e) => e.tipo)));
            const ehHoje = dataISO === hojeISO;
            return (
              <button
                key={i}
                onClick={() => setDiaSelecionado(dia)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[12.5px] transition-colors",
                  ehHoje ? "bg-primary text-white font-bold" : diaSelecionado === dia ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/60"
                )}
              >
                {dia}
                <span className="flex gap-0.5">
                  {tiposDoDia.slice(0, 3).map((t) => (
                    <span key={t} className={cn("size-1.5 rounded-full", ehHoje ? "bg-white" : COR_TIPO[t])} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
          {LEGENDA.map((l) => (
            <span key={l.tipo} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("size-2 rounded-full", COR_TIPO[l.tipo])} /> {l.rotulo}
            </span>
          ))}
        </div>

        {diaSelecionado && (
          <div className="mt-4 rounded-lg bg-secondary/40 p-3">
            <p className="text-[12.5px] font-semibold text-foreground">{formatarData(iso(ano, mes, diaSelecionado))}</p>
            {eventosDoDia.length === 0 ? (
              <p className="mt-1 text-[13px] text-muted-foreground">Nenhum evento neste dia.</p>
            ) : (
              <ul className="mt-1.5 flex flex-col gap-1">
                {eventosDoDia.map((e, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-foreground">
                    <span className={cn("size-1.5 shrink-0 rounded-full", COR_TIPO[e.tipo])} /> {e.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
