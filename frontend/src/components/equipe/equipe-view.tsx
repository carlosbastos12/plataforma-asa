"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { formatarData } from "@/lib/mock-data";
import {
  EQUIPE,
  AUSENCIAS,
  ESCALA,
  type StatusTurno,
  type StatusColaborador,
} from "@/lib/equipe";
import { cn } from "@/lib/utils";
import { Clock3, UserCheck2, CircleAlert } from "lucide-react";

const STATUS_TURNO: Record<StatusTurno, { rotulo: string; classe: string }> = {
  confirmado: { rotulo: "Confirmado", classe: "bg-success-soft text-success" },
  substituicao: { rotulo: "Substituição", classe: "bg-warning-soft text-warning" },
  em_aberto: { rotulo: "Em aberto", classe: "bg-destructive-soft text-destructive" },
};

const STATUS_COLABORADOR: Record<StatusColaborador, { rotulo: string; classe: string }> = {
  disponivel: { rotulo: "Disponível", classe: "bg-success-soft text-success" },
  em_rota: { rotulo: "Em rota", classe: "bg-secondary text-secondary-foreground" },
  ausente: { rotulo: "Ausente", classe: "bg-destructive-soft text-destructive" },
  folga: { rotulo: "Folga", classe: "bg-muted text-muted-foreground" },
};

/**
 * Equipe Operacional (P033, VDC-001 dores 8/9/10): faltas, atestados e
 * escala controlados manualmente hoje. Aqui, uma ausência já mostra se
 * afeta a escala e quem cobre o turno — sem precisar cruzar duas listas.
 */
export function EquipeView() {
  const diasEscala = Array.from(new Set(ESCALA.map((t) => t.data)));

  return (
    <Tabs defaultValue="escala">
      <TabsList>
        <TabsTrigger value="escala">Escala</TabsTrigger>
        <TabsTrigger value="ausencias">Faltas e atestados</TabsTrigger>
        <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
      </TabsList>

      <TabsContent value="escala" className="mt-5 flex flex-col gap-5">
        {diasEscala.map((data) => (
          <div key={data} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{formatarData(data)}</p>
            </div>
            <ul className="divide-y divide-border">
              {ESCALA.filter((t) => t.data === data).map((t, i) => {
                const st = STATUS_TURNO[t.status];
                return (
                  <li key={i} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                    <span className="flex w-16 shrink-0 items-center gap-1.5 text-muted-foreground">
                      <Clock3 className="size-3.5" strokeWidth={2} />
                      {t.turno}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{t.colaborador}</span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", st.classe)}>
                      {st.rotulo}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="ausencias" className="mt-5 flex flex-col gap-3">
        {AUSENCIAS.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
              <UserCheck2 className="size-5" strokeWidth={2} />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Nenhuma falta ou atestado em aberto. Assim que uma ausência entrar, ela aparece aqui com o impacto na
              escala já calculado.
            </p>
          </div>
        ) : (
          AUSENCIAS.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between",
                a.impactaEscala ? "border-warning/25 border-l-4 border-l-warning" : "border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <PessoaAvatar nome={a.colaborador} papel="Colaborador" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {a.colaborador} · {a.tipo === "atestado" ? "Atestado" : "Falta"}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {a.motivo} · {formatarData(a.dataInicio)}
                    {a.dataFim !== a.dataInicio ? ` a ${formatarData(a.dataFim)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                {a.impactaEscala ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 font-medium text-warning">
                    <CircleAlert className="size-3.5" strokeWidth={2.25} />
                    {a.substituto ? `Coberto por ${a.substituto}` : "Ainda sem substituto"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 font-medium text-success">
                    Não afeta a escala
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="disponibilidade" className="mt-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {EQUIPE.map((c) => {
              const st = STATUS_COLABORADOR[c.status];
              return (
                <li key={c.nome} className="flex items-center gap-4 px-5 py-3.5">
                  <PessoaAvatar nome={c.nome} papel={c.funcao} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{c.nome}</p>
                    <p className="text-[13px] text-muted-foreground">{c.funcao}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", st.classe)}>
                    {st.rotulo}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
