import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Gauge, Hash } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import {
  FROTA,
  situacaoVeiculo,
  statusVencimento,
  diasRestantes,
  formatarData,
  formatarMoeda,
} from "@/lib/mock-data";
import { VehicleTimeline } from "@/components/frota/vehicle-timeline";

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
          <span className="rounded-lg bg-secondary px-3 py-2 font-mono text-base font-semibold tracking-wide text-secondary-foreground">
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
                    <p className="text-sm font-medium text-foreground">{doc.tipo}</p>
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
            <div className="overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Órgão</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculo.multas.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.orgao}</TableCell>
                      <TableCell className="text-muted-foreground">{formatarData(m.data)}</TableCell>
                      <TableCell className="font-medium">{formatarMoeda(m.valor)}</TableCell>
                      <TableCell>
                        {m.status === "paga" ? (
                          <StatusBadge status="regular" />
                        ) : (
                          <StatusBadge status="critico" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manutencoes" className="mt-5">
          {veiculo.manutencoes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Nenhuma manutenção registrada para este veículo.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Oficina</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculo.manutencoes.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{formatarData(m.data)}</TableCell>
                      <TableCell>{m.km.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>{m.servico}</TableCell>
                      <TableCell>{m.oficina}</TableCell>
                      <TableCell className="font-medium">{formatarMoeda(m.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
