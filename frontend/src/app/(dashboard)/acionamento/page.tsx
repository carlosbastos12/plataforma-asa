import { ChamadosBoard } from "@/components/acionamento/chamados-board";
import { CHAMADOS_ATIVOS } from "@/lib/mock-data";

export default function AcionamentoPage() {
  const aguardando = CHAMADOS_ATIVOS.filter((c) => c.status === "aguardando").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">O chamado nasce aqui</h2>
          <p className="text-sm text-muted-foreground">
            Receba, despache e acompanhe cada atendimento até a conclusão.
          </p>
        </div>
        {aguardando > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning">
            {aguardando} {aguardando === 1 ? "chamado aguardando despacho" : "chamados aguardando despacho"}
          </span>
        )}
      </div>

      <ChamadosBoard />
    </div>
  );
}
