import { Truck, FileCheck2, ShieldAlert, Fuel, ClipboardCheck, ShoppingCart } from "lucide-react";
import { SectorLinkCard } from "@/components/shell/sector-link-card";
import { FROTA, statusVencimento } from "@/lib/mock-data";

export default function GestaoDaFrotaPage() {
  const docsVencidos = FROTA.flatMap((v) => v.docs).filter((d) => statusVencimento(d.vencimento) === "critico").length;
  const multasAbertas = FROTA.flatMap((v) => v.multas).filter((m) => m.status === "aguardando_indicacao").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">A frota que mantém a operação rodando</h2>
        <p className="text-sm text-muted-foreground">
          Veículos, documentação e multas — hoje espalhados em planilha, agora num só setor.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectorLinkCard
          href="/gestao-da-frota/veiculos"
          icon={Truck}
          title="Veículos"
          description="Cadastro, motorista responsável e histórico de cada placa."
          badge={`${FROTA.length} veículos`}
        />
        <SectorLinkCard
          href="/gestao-da-frota/documentacao"
          icon={FileCheck2}
          title="Documentação"
          description="AET, IPVA, licenciamento, seguro e tacógrafo com semáforo de vencimento."
          badge={docsVencidos > 0 ? `${docsVencidos} vencido(s)` : "em dia"}
        />
        <SectorLinkCard
          href="/gestao-da-frota/multas"
          icon={ShieldAlert}
          title="Multas"
          description="Indicação de condutor e acompanhamento de prazo."
          badge={multasAbertas > 0 ? `${multasAbertas} em aberto` : "em dia"}
        />
        <SectorLinkCard
          icon={Fuel}
          title="Combustível"
          description="Controle de abastecimento e consumo por veículo."
          badge="conceito futuro"
          disabled
        />
        <SectorLinkCard
          icon={ClipboardCheck}
          title="Vistorias"
          description="Checklist e histórico de vistorias por veículo."
          badge="conceito futuro"
          disabled
        />
        <SectorLinkCard
          icon={ShoppingCart}
          title="Compras da frota"
          description="Peças e serviços relacionados à manutenção."
          badge="conceito futuro"
          disabled
        />
      </div>
    </div>
  );
}
