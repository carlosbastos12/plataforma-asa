import Link from "next/link";
import { User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { veredictoVeiculo } from "@/lib/insights";
import { situacaoVeiculo, type Veiculo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function VehicleCard({ veiculo }: { veiculo: Veiculo }) {
  const status = situacaoVeiculo(veiculo);
  const veredicto = veredictoVeiculo(veiculo);

  return (
    <Link href={`/gestao-da-frota/veiculos/${veiculo.placa}`}>
      <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold tracking-wide text-secondary-foreground">
            {veiculo.placa}
          </span>
          <StatusBadge status={status} />
        </div>

        <div>
          <p className="text-[15px] font-medium text-foreground">{veiculo.modelo}</p>
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <User className="size-3.5" strokeWidth={2} />
            <span className="truncate">{veiculo.motorista}</span>
            <span aria-hidden>·</span>
            {veiculo.categoria}
          </p>
        </div>

        {/* O card já responde a pergunta da tela: por que este veículo importa
            agora e o que fazer a respeito — sem exigir o clique. */}
        <div className="mt-auto border-t border-border pt-3">
          <p
            className={cn(
              "text-[13px] font-medium",
              status === "critico" ? "text-destructive" : status === "atencao" ? "text-warning" : "text-success"
            )}
          >
            {veredicto.titulo}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {status === "regular" ? veredicto.motivo : veredicto.acao}
          </p>
        </div>
      </Card>
    </Link>
  );
}
