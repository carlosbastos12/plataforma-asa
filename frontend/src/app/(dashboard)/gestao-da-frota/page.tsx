import { Truck, FileCheck2, ShieldAlert, Fuel, ClipboardCheck, Package, CircleAlert, Wrench } from "lucide-react";
import { SectorLinkCard } from "@/components/shell/sector-link-card";
import { StatCard } from "@/components/home/stat-card";
import { FROTA, ALMOXARIFADO, situacaoVeiculo, statusVencimento, statusPreventiva, statusEstoque } from "@/lib/mock-data";
import { diasDeAutonomiaTanque } from "@/lib/combustivel";
import { PreventivaCard } from "@/components/frota/preventiva-card";

export default function GestaoDaFrotaPage() {
  const todosDocs = FROTA.flatMap((v) => v.docs);
  const docsVencidos = todosDocs.filter((d) => statusVencimento(d.vencimento) === "critico").length;
  const docsEmDiaPct = Math.round((todosDocs.filter((d) => statusVencimento(d.vencimento) === "regular").length / todosDocs.length) * 100);
  const multasAbertas = FROTA.flatMap((v) => v.multas).filter((m) => m.status === "aguardando_indicacao").length;
  const frotaApta = FROTA.filter((v) => situacaoVeiculo(v) !== "critico").length;
  const autonomia = diasDeAutonomiaTanque();
  const itensEmAlertaEstoque = ALMOXARIFADO.filter((i) => statusEstoque(i) !== "regular").length;

  // Manutenção preventiva por km (conceito de demonstração — ver preventiva-card.tsx).
  const preventivasComStatus = FROTA.flatMap((v) =>
    v.preventivas.map((p) => ({ placa: v.placa, atualKm: v.km, preventiva: p, status: statusPreventiva(v.km, p) }))
  );
  const preventivasEmAlerta = preventivasComStatus
    .filter((p) => p.status !== "regular")
    .sort((a, b) => (a.status === "critico" ? -1 : 1) - (b.status === "critico" ? -1 : 1));
  const preventivasVencidas = preventivasComStatus.filter((p) => p.status === "critico").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">A frota que mantém a operação rodando</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Documentação, multas, combustível, manutenção e o histórico completo de cada veículo — tudo no mesmo
          lugar, com aviso antes de qualquer prazo vencer.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={Truck} label="frota apta a operar" value={`${frotaApta}/${FROTA.length}`} tone={frotaApta === FROTA.length ? "success" : "default"} />
        <StatCard icon={FileCheck2} label="documentação em dia" value={`${docsEmDiaPct}%`} tone={docsEmDiaPct === 100 ? "success" : "default"} />
        <StatCard icon={CircleAlert} label="pendências críticas" value={String(docsVencidos + multasAbertas)} tone={docsVencidos + multasAbertas > 0 ? "warning" : "success"} />
        <StatCard icon={Fuel} label="diesel disponível" value={`${autonomia}d`} hint="autonomia do tanque da base" tone={autonomia <= 3 ? "warning" : "default"} />
        <StatCard icon={Wrench} label="manutenção preventiva vencida" value={String(preventivasVencidas)} tone={preventivasVencidas > 0 ? "warning" : "success"} />
      </section>

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
          href="/gestao-da-frota/almoxarifado"
          icon={Package}
          title="Almoxarifado"
          description="Estoque de peças da oficina própria, com localização."
          badge={itensEmAlertaEstoque > 0 ? `${itensEmAlertaEstoque} item(ns) em alerta` : "estoque em dia"}
        />
      </div>

      {preventivasEmAlerta.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" strokeWidth={2.25} />
            <h3 className="text-sm font-semibold text-foreground">Manutenção preventiva por quilometragem</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {preventivasEmAlerta.map((p) => (
              <PreventivaCard key={p.placa} placa={p.placa} atualKm={p.atualKm} preventiva={p.preventiva} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Conceito de demonstração: compara a quilometragem atual de cada veículo com a última troca
            registrada, sem atualização automática — na Plataforma ASA completa, esse valor poderá vir dos
            registros de abastecimento ou de atualização manual.
          </p>
        </section>
      )}
    </div>
  );
}
