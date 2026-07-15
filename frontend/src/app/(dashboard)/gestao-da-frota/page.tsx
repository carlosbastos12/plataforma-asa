import { Truck, FileCheck2, ShieldAlert, Fuel, ClipboardCheck, ShoppingCart } from "lucide-react";
import { SectorLinkCard } from "@/components/shell/sector-link-card";
import { FROTA, statusVencimento } from "@/lib/mock-data";
import { diasDeAutonomiaTanque } from "@/lib/combustivel";

export default function GestaoDaFrotaPage() {
  const docsVencidos = FROTA.flatMap((v) => v.docs).filter((d) => statusVencimento(d.vencimento) === "critico").length;
  const multasAbertas = FROTA.flatMap((v) => v.multas).filter((m) => m.status === "aguardando_indicacao").length;
  const autonomia = diasDeAutonomiaTanque();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">A frota que mantém a operação rodando</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Documentação, multas, combustível, manutenção e o histórico completo de cada veículo — tudo no mesmo
          lugar, com aviso antes de qualquer prazo vencer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectorLinkCard
          href="/gestao-da-frota/veiculos"
          icon={Truck}
          title="Veículos"
          description="Cadastro, motorista responsável e histórico completo de cada placa."
          badge={`${FROTA.length} veículos`}
        />
        <SectorLinkCard
          href="/gestao-da-frota/documentacao"
          icon={FileCheck2}
          title="Documentação"
          description="AET, IPVA, licenciamento, seguro, certificados e tacógrafo com semáforo de vencimento."
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
          href="/gestao-da-frota/combustivel"
          icon={Fuel}
          title="Combustível"
          description="Tanque da base e abastecimento externo, no mesmo lugar."
          badge={autonomia <= 3 ? `${autonomia} dia(s) de estoque` : "estoque saudável"}
        />
        <SectorLinkCard
          icon={ClipboardCheck}
          title="Vistorias"
          description="Checklist e histórico de vistorias por veículo."
          badge="em breve"
          disabled
        />
        <SectorLinkCard
          icon={ShoppingCart}
          title="Compras da frota"
          description="Peças e serviços relacionados à manutenção."
          badge="em breve"
          disabled
        />
      </div>
    </div>
  );
}
