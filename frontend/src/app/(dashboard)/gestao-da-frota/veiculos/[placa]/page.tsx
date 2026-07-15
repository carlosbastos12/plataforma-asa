import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Gauge, Hash, CircleAlert, CircleCheckBig, Clock3, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { Sigla } from "@/components/sigla";
import { veredictoVeiculo } from "@/lib/insights";
import {
  FROTA,
  situacaoVeiculo,
  statusVencimento,
  diasRestantes,
  formatarData,
  formatarMoeda,
} from "@/lib/mock-data";
import { VehicleTimeline } from "@/components/frota/vehicle-timeline";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return FROTA.map((v) => ({ placa: v.placa }));
}

export default async function VeiculoDetalhePage({
  params,
}: {
  params: Promise<{ placa: string }>;
}) {
  const { placa } = await params;
  const veiculo = FROTA.find((v) => v.placa === placa);
  if (!veiculo) notFound();

  const status = situacaoVeiculo(veiculo);
  const veredicto = veredictoVeiculo(veiculo);
  const critico = veredicto.nivel === "critico";
  const atencao = veredicto.nivel === "atencao";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/gestao-da-frota/veiculos"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para a frota
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="placa-chip rounded-lg px-3 py-2 font-mono text-base">
            {veiculo.placa}
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {veiculo.modelo} <span className="text-muted-foreground font-normal">· {veiculo.ano}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" /> {veiculo.motorista}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="size-3.5" /> {veiculo.km.toLocaleString("pt-BR")} km
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Hash className="size-3.5" /> {veiculo.categoria}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={status} className="text-sm" />
      </div>

      {/* Veredicto: a primeira coisa que a tela responde é "este veículo pode
          operar hoje?" — com o motivo e a ação que muda a resposta. */}
      <div
        className={cn(
          "flex items-start gap-3.5 rounded-2xl border p-5",
          critico
            ? "border-destructive/25 bg-destructive-soft/50"
            : atencao
              ? "border-warning/25 bg-warning-soft/50"
              : "border-success/25 bg-success-soft/50"
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            critico
              ? "bg-destructive-soft text-destructive"
              : atencao
                ? "bg-warning-soft text-warning"
                : "bg-success-soft text-success"
          )}
        >
          {critico ? (
            <CircleAlert className="size-5" strokeWidth={2.25} />
          ) : (
            <CircleCheckBig className="size-5" strokeWidth={2.25} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-foreground">{veredicto.titulo}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{veredicto.motivo}</p>
          <p className="mt-1.5 text-sm font-medium text-foreground">→ {veredicto.acao}</p>
        </div>
      </div>

      <Tabs defaultValue="documentacao">
        <TabsList>
          <TabsTrigger value="documentacao">Documentação</TabsTrigger>
          <TabsTrigger value="multas">Multas</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
          <TabsTrigger value="linha-do-tempo">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="documentacao" className="mt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {veiculo.docs.map((doc) => {
              const sev = statusVencimento(doc.vencimento);
              const d = diasRestantes(doc.vencimento);
              return (
                <div key={doc.tipo} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      <Sigla termo={doc.tipo} />
                    </p>
                    <StatusBadge status={sev} />
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {d < 0 ? `Venceu há ${Math.abs(d)} dia(s)` : `Vence em ${d} dia(s)`} · {formatarData(doc.vencimento)}
                  </p>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="multas" className="mt-5">
          {veiculo.multas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Nenhuma multa registrada para este veículo.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {veiculo.multas.map((m) => {
                  const aberta = m.status === "aguardando_indicacao";
                  const prazo = m.prazoIndicacao ? diasRestantes(m.prazoIndicacao) : null;
                  return (
                    <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          aberta ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"
                        )}
                      >
                        {aberta ? <Clock3 className="size-4" strokeWidth={2.25} /> : <CircleCheckBig className="size-4" strokeWidth={2.25} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          <Sigla termo={m.orgao} /> · {formatarData(m.data)}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {aberta
                            ? prazo !== null
                              ? prazo < 0
                                ? `Prazo de indicação estourado há ${Math.abs(prazo)} dia(s) — resolver evita agravamento.`
                                : `${prazo} dia(s) para indicar o condutor — dentro do prazo, o valor não dobra.`
                              : "Aguardando indicação de condutor."
                            : m.status === "paga"
                              ? "Paga — nenhuma pendência restante."
                              : "Condutor indicado — sem risco de agravamento."}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatarMoeda(m.valor)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manutencoes" className="mt-5">
          {veiculo.manutencoes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Nenhuma manutenção registrada para este veículo.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {veiculo.manutencoes.map((m, i) => (
                  <li key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Wrench className="size-4" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{m.servico}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {formatarData(m.data)} · {m.km.toLocaleString("pt-BR")} km · {m.oficina}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatarMoeda(m.valor)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="linha-do-tempo" className="mt-5">
          <VehicleTimeline veiculo={veiculo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
