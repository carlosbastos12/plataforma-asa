import type { Metadata } from "next";
import { ChamadosBoard } from "@/components/acionamento/chamados-board";
import { CHAMADOS_ATIVOS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Acionamento",
};

export default function AcionamentoPage() {
  const fila = CHAMADOS_ATIVOS.filter((c) => c.status === "aguardando").sort((a, b) =>
    a.horaAbertura.localeCompare(b.horaAbertura)
  );
  const maisAntigo = fila[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Quem precisa da sua atenção agora?
          </h2>
          <p className="text-sm text-muted-foreground">
            {fila.length > 0
              ? `${fila.length} cliente(s) esperando na estrada — o mais antigo desde as ${maisAntigo.horaAbertura}. Despachar primeiro quem espera há mais tempo.`
              : "Ninguém na fila agora. Todo chamado novo aparece aqui no momento em que chega."}
          </p>
        </div>
        {fila.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning">
            {fila.length} {fila.length === 1 ? "chamado aguardando despacho" : "chamados aguardando despacho"}
          </span>
        )}
      </div>

      <ChamadosBoard />
    </div>
  );
}
