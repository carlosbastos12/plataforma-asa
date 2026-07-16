"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle, Wallet2, Loader2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/ui/kpi-card";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { CAIXA, formatarData, formatarMoeda } from "@/lib/mock-data";
import { CAIXA_ULTIMOS_30_DIAS, CAIXA_30_DIAS_LABELS } from "@/lib/dashboard-demo";
import { cn } from "@/lib/utils";

function turno(hora: string): string {
  const h = Number(hora.split(":")[0]);
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

const COR_FORMA: Record<string, string> = {
  PIX: "var(--primary)",
  Cartão: "var(--info)",
  Espécie: "var(--warning)",
};

/** Caixa Particular (Clone do Protótipo 1, clone do Protótipo 1 `caixa.html`) — KPI + gráfico do mês + tabela de lançamentos + composição por forma de pagamento. */
export function CaixaView() {
  const [selecionada, setSelecionada] = useState(CAIXA[0].data);
  const [fechadosNestaSessao, setFechadosNestaSessao] = useState<Set<string>>(new Set());
  const [fechando, setFechando] = useState(false);

  const dia = CAIXA.find((c) => c.data === selecionada) ?? CAIXA[0];
  const estaFechado = dia.status === "fechado" || fechadosNestaSessao.has(dia.data);

  const entradas = dia.lancamentos.filter((l) => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const saidas = dia.lancamentos.filter((l) => l.tipo === "saida").reduce((acc, l) => acc - l.valor, 0);
  const saldo = entradas - saidas;

  const totalMes = CAIXA.flatMap((c) => c.lancamentos).reduce((acc, l) => acc + l.valor, 0);
  const emAberto = CAIXA.filter((c) => c.status === "aberto" && !fechadosNestaSessao.has(c.data)).length;

  const porForma = Object.entries(
    dia.lancamentos.reduce<Record<string, number>>((acc, l) => {
      acc[l.forma] = (acc[l.forma] ?? 0) + Math.abs(l.valor);
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value: Math.round(value), color: COR_FORMA[label] ?? "var(--muted-foreground)" }));

  function fecharCaixa() {
    setFechando(true);
    // pequena espera simulada — reforça que a ação foi processada, não é instantânea "demais"
    setTimeout(() => {
      setFechadosNestaSessao((atual) => new Set(atual).add(dia.data));
      setFechando(false);
      toast.success(`Caixa de ${formatarData(dia.data)} fechado`, {
        description: `Saldo conferido: ${formatarMoeda(saldo)}. (ação simulada nesta demonstração)`,
      });
    }, 700);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet2} tone="ok" label="Total do dia" value={formatarMoeda(saldo)} foot={`${dia.lancamentos.length} atendimento(s)`} />
        <KpiCard icon={ArrowDownCircle} tone="info" label="Total do mês" value={formatarMoeda(totalMes)} foot="soma de todos os dias registrados" />
        <KpiCard icon={ArrowUpCircle} tone="warn" label="Em aberto" value={String(emAberto)} foot="dia(s) aguardando fechamento" />
        <KpiCard icon={CheckCircle2} tone="ok" label="Divergências no mês" value="0" foot="nenhuma divergência em aberto" />
      </section>

      <Panel>
        <PanelHeader title="Fechamento diário — últimos 30 dias" subtitle="Valor total recebido por dia" />
        <PanelBody>
          <BarChart data={CAIXA_ULTIMOS_30_DIAS.map((v, i) => ({ label: CAIXA_30_DIAS_LABELS[i] || "", value: v }))} color="var(--primary)" currency />
        </PanelBody>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CAIXA.map((c, i) => {
              const abertoDeVerdade = c.status === "aberto" && !fechadosNestaSessao.has(c.data);
              return (
                <button
                  key={c.data}
                  onClick={() => setSelecionada(c.data)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    c.data === selecionada
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {abertoDeVerdade && c.data !== selecionada && <span className="size-1.5 rounded-full bg-warning" />}
                  {formatarData(c.data)}
                  {i === 0 && " (hoje)"}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar lançamento..." className="w-56 pl-9" disabled />
              </div>
              <Button
                className="gap-1.5"
                onClick={() =>
                  toast.success("Lançamento pronto para ser registrado", {
                    description: "Nesta demonstração o formulário é ilustrativo — na versão completa, o lançamento entra direto nesta tabela.",
                  })
                }
              >
                <Plus className="size-4" /> Novo lançamento
              </Button>
            </div>
          </div>

          <Panel>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-[14.5px] font-bold text-foreground">Lançamentos de {formatarData(dia.data)}</p>
                <p className="text-xs text-muted-foreground">{dia.lancamentos.length} registro(s)</p>
              </div>
              {estaFechado ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" /> Fechado
                </span>
              ) : (
                <Tooltip>
                  <TooltipTrigger render={<Button size="sm" className="gap-1.5" onClick={fecharCaixa} disabled={fechando} />}>
                    {fechando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    {fechando ? "Fechando..." : "Fechar caixa do dia"}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-60 text-pretty">
                    Confere e trava o saldo do dia. Fechado no mesmo dia, o caixa nunca acumula divergência para o
                    fim do mês.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dia.lancamentos.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{turno(l.hora)}</span>
                    </TableCell>
                    <TableCell className="text-foreground">{l.descricao}</TableCell>
                    <TableCell>
                      {l.placa ? <span className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">{l.placa}</span> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.forma}</TableCell>
                    <TableCell className={cn("font-bold", l.valor > 0 ? "text-success" : "text-destructive")}>
                      {l.valor > 0 ? "+" : ""}
                      {formatarMoeda(l.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Por forma de pagamento" />
            <PanelBody>
              {porForma.length > 0 ? <DonutChart data={porForma} size={150} /> : <p className="text-sm text-muted-foreground">Sem lançamentos no dia.</p>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Como funciona" />
            <PanelBody>
              <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-[13px] leading-relaxed text-muted-foreground">
                Cada atendimento vira um lançamento único, consolidado em tempo real — sem depender de conferir
                arquivo por arquivo no fim do mês.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
