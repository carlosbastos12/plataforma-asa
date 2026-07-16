import { Phone, IdCard, CalendarDays, GraduationCap } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatarData } from "@/lib/mock-data";
import { STATUS_COLABORADOR_LABEL, TIPO_AUSENCIA_LABEL, ausenciasPorColaborador, ESCALA, type Colaborador } from "@/lib/equipe";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/**
 * Ficha do colaborador: tudo sobre uma pessoa num só painel — histórico de
 * atestados, faltas, férias e escalas, sem precisar cruzar telas (P037).
 */
export function FichaColaboradorSheet({ colaborador, onClose }: { colaborador: Colaborador | null; onClose: () => void }) {
  const ausencias = colaborador ? ausenciasPorColaborador(colaborador.nome) : [];
  const escalas = colaborador ? ESCALA.filter((e) => e.colaborador === colaborador.nome) : [];

  return (
    <Sheet open={!!colaborador} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {colaborador && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg" className="size-14">
                  <AvatarFallback className="text-base font-bold">{iniciais(colaborador.nome)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{colaborador.nome}</SheetTitle>
                  <SheetDescription>{colaborador.funcao} · Equipe {colaborador.equipe}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              <section className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5" /> {colaborador.telefone}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><IdCard className="size-3.5" /> CNH {colaborador.cnhCategoria}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-3.5" /> Desde {formatarData(colaborador.dataAdmissao)}</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {STATUS_COLABORADOR_LABEL[colaborador.status]}
                  </span>
                </div>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Histórico de ausências</p>
                {ausencias.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[13px] text-muted-foreground">
                    Nenhum atestado, falta ou férias registrado.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {ausencias.map((a) => (
                      <li key={a.id} className="rounded-lg border border-border px-3 py-2.5 text-[13px]">
                        <p className="font-medium text-foreground">{TIPO_AUSENCIA_LABEL[a.tipo]}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatarData(a.dataInicio)}{a.dataFim !== a.dataInicio ? ` a ${formatarData(a.dataFim)}` : ""} · {a.motivo}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Histórico de escalas</p>
                {escalas.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[13px] text-muted-foreground">
                    Nenhum turno registrado ainda.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {escalas.map((e, i) => (
                      <li key={i} className="flex items-center justify-between text-[13px]">
                        <span className="text-foreground">{formatarData(e.data)} · {e.turno}</span>
                        <span className="text-xs text-muted-foreground">{e.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <GraduationCap className="size-3.5" /> Documentação e treinamentos
                </p>
                <ul className="flex flex-col gap-1.5 text-[13px] text-foreground">
                  <li>CNH categoria {colaborador.cnhCategoria} — dentro da validade</li>
                  <li>NR-11 — reciclagem em dia</li>
                </ul>
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Observações</p>
                <p className="rounded-lg bg-secondary/40 px-3 py-2.5 text-[13px] text-muted-foreground">
                  Nenhuma observação registrada para {colaborador.nome.split(" ")[0]}.
                </p>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
