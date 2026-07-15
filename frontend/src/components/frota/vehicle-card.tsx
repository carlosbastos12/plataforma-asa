import Link from "next/link";
import { User, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { situacaoVeiculo, type Veiculo } from "@/lib/mock-data";

export function VehicleCard({ veiculo }: { veiculo: Veiculo }) {
  const status = situacaoVeiculo(veiculo);

  return (
    <Link href={`/gestao-da-frota/veiculos/${veiculo.placa}`}>
      <Card className="gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold tracking-wide text-secondary-foreground">
            {veiculo.placa}
          </span>
          <StatusBadge status={status} />
        </div>

        <div>
          <p className="text-[15px] font-medium text-foreground">{veiculo.modelo}</p>
          <p className="text-[13px] text-muted-foreground">
            {veiculo.categoria} · {veiculo.ano}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="size-3.5" strokeWidth={2} />
            <span className="truncate">{veiculo.motorista}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="size-3.5" strokeWidth={2} />
            <span>{veiculo.km.toLocaleString("pt-BR")} km rodados</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
