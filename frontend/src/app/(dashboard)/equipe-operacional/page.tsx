import type { Metadata } from "next";
import { UserCog2, CircleCheckBig } from "lucide-react";
import { EquipeView } from "@/components/equipe/equipe-view";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { ausenciasComImpactoNaEscala, turnosEmAberto, ausenciasAtivas } from "@/lib/equipe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Equipe Operacional",
};

export default function EquipeOperacionalPage() {
  const impacto = ausenciasComImpactoNaEscala();
  const abertos = turnosEmAberto();
  const todas = ausenciasAtivas();

  let descricao =
    "A escala, as faltas e os atestados da equipe reunidos — cada ausência já mostra se afeta a operação e quem cobre o turno.";
  if (impacto.length > 0) {
    descricao = `${impacto.length} ausência(s) podem afetar a escala. ${abertos.length > 0 ? `${abertos.length} turno(s) ainda sem colaborador definido.` : "Todos os turnos já têm cobertura."}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Quem está disponível para operar hoje?
        </h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>

      {/* Impacto em linguagem humana (P034, relato do Vitor): uma ausência
          nunca é só um registro — é sempre "quem, por quê, quem cobre, o que
          isso mudou na operação". */}
      {todas.length > 0 && (
        <div className="flex flex-col gap-3">
          {todas.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <PessoaAvatar nome={a.colaborador} papel="Colaborador" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">{a.colaborador}</p>
                <p className="text-[13px] text-muted-foreground">
                  {a.tipo === "atestado" ? "Afastado por atestado" : "Em falta"} hoje · {a.motivo}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-medium",
                  a.impactaEscala && !a.substituto
                    ? "bg-destructive-soft text-destructive"
                    : "bg-success-soft text-success"
                )}
              >
                {a.impactaEscala && !a.substituto ? (
                  <>
                    <UserCog2 className="size-4 shrink-0" strokeWidth={2.25} />
                    Ainda sem substituto — turno em risco
                  </>
                ) : a.impactaEscala && a.substituto ? (
                  <>
                    <CircleCheckBig className="size-4 shrink-0" strokeWidth={2.25} />
                    Substituído por {a.substituto} — nenhum chamado ficou descoberto
                  </>
                ) : (
                  <>
                    <CircleCheckBig className="size-4 shrink-0" strokeWidth={2.25} />
                    Não afeta a escala de hoje
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EquipeView />
    </div>
  );
}
