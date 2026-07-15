import type { Metadata } from "next";
import { EquipeView } from "@/components/equipe/equipe-view";
import { ausenciasComImpactoNaEscala, turnosEmAberto } from "@/lib/equipe";

export const metadata: Metadata = {
  title: "Equipe Operacional",
};

export default function EquipeOperacionalPage() {
  const impacto = ausenciasComImpactoNaEscala();
  const abertos = turnosEmAberto();

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
      <EquipeView />
    </div>
  );
}
