import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Wallet2, BarChart3, ShieldCheck, CalendarPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Sigla } from "@/components/sigla";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { NovaMultaButton } from "@/components/multas/nova-multa-button";
import { CAIXA, formatarData, formatarMoeda } from "@/lib/mock-data";
import { calcularIndicadores, proximosVencimentos, vencimentosCriticos, multasPorOrgao, leituraOperacional } from "@/lib/insights";
import { CAIXA_ULTIMOS_30_DIAS, CAIXA_30_DIAS_LABELS, MULTAS_POR_MES } from "@/lib/dashboard-demo";

export const metadata: Metadata = {
  title: "Central de Operações",
};

const COR_ORGAO: Record<string, string> = {
  AMC: "var(--primary)",
  DETRAN: "var(--info)",
  DNIT: "var(--warning)",
  PRF: "var(--destructive)",
};

/**
 * Dashboard executivo (Clone do Protótipo 1) — clone visual do Protótipo 1 a pedido do CEO:
 * KPI grid, gráficos e tabela de vencimentos substituem a home-assistente
 * das missões P029/P033/P034 (ver D-035 em DECISIONS.md).
 */
export default function CentralDeOperacoesPage() {
  const i = calcularIndicadores();
  const criticos7d = vencimentosCriticos(7);
  const vencimentos = proximosVencimentos(6);
  const donutOrgao = multasPorOrgao().map((d) => ({ ...d, color: COR_ORGAO[d.label] ?? "var(--muted-foreground)" }));
  const alertas = leituraOperacional().slice(0, 5);

  const totalCaixaMes = CAIXA.flatMap((c) => c.lancamentos).reduce((acc, l) => acc + l.valor, 0);
  const atendimentosMes = CAIXA.flatMap((c) => c.lancamentos).filter((l) => l.tipo === "entrada").length;
  const docsEmDiaPct = Math.round((i.frotaApta / i.frotaTotal) * 100);

  const ALERT_TOM: Record<string, { bg: string; fg: string }> = {
    critico: { bg: "bg-destructive-soft", fg: "text-destructive" },
    atencao: { bg: "bg-warning-soft", fg: "text-warning" },
    ok: { bg: "bg-success-soft", fg: "text-success" },
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={AlertTriangle}
          tone="crit"
          label="Vencimentos críticos (7 dias)"
          value={String(criticos7d.total)}
          foot={criticos7d.detalhe}
        />
        <KpiCard
          icon={Wallet2}
          tone="warn"
          label="Multas em aberto"
          value={formatarMoeda(i.valorEmRisco)}
          foot={`${i.multasAguardando} multa(s) pendentes de indicação`}
        />
        <KpiCard
          icon={BarChart3}
          tone="ok"
          label="Caixa Particular (mês)"
          value={formatarMoeda(totalCaixaMes)}
          foot={`${atendimentosMes} atendimentos particulares`}
        />
        <KpiCard
          icon={ShieldCheck}
          tone="info"
          label="Frota com doc. em dia"
          value={`${i.frotaApta} / ${i.frotaTotal}`}
          foot={`${docsEmDiaPct}% da frota regularizada`}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader
              title="Caixa Particular — últimos 30 dias"
              subtitle="Total consolidado de remoções/reboques pagos direto pelo cliente"
              action={
                <Link href="/fechamento/caixa" className="text-[12.5px] font-semibold text-primary">
                  Ver Caixa Particular →
                </Link>
              }
            />
            <PanelBody>
              <LineChart
                series={[{ data: CAIXA_ULTIMOS_30_DIAS, color: "var(--primary)" }]}
                xLabels={CAIXA_30_DIAS_LABELS}
                currency
              />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-primary" /> Valor recebido por dia (R$)
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Multas por mês"
              subtitle="Últimos 6 meses — quantidade de multas identificadas"
              action={
                <Link href="/gestao-da-frota/multas" className="text-[12.5px] font-semibold text-primary">
                  Ver Multas →
                </Link>
              }
            />
            <PanelBody>
              <BarChart data={MULTAS_POR_MES} color="var(--info)" />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Próximos vencimentos"
              subtitle="Documentação legal da frota — ordenado por urgência"
              action={
                <Link href="/gestao-da-frota/documentacao" className="text-[12.5px] font-semibold text-primary">
                  Ver Documentação →
                </Link>
              }
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias restantes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vencimentos.map((v, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <span className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">{v.placa}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Sigla termo={v.documento} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatarData(v.vencimento)}</TableCell>
                    <TableCell className="font-bold">{v.dias < 0 ? `venceu há ${Math.abs(v.dias)}d` : `${v.dias} dias`}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Alertas recentes" />
            <div className="flex flex-col divide-y divide-border">
              {alertas.map((a, idx) => {
                const tom = ALERT_TOM[a.tom];
                const conteudo = (
                  <div className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${tom.bg} ${tom.fg}`}>
                      <span className="size-2 rounded-full bg-current" />
                    </span>
                    <p className="text-[13px] leading-relaxed text-foreground">{a.texto}</p>
                  </div>
                );
                return a.href ? (
                  <Link key={idx} href={a.href} className="transition-colors hover:bg-secondary/60">
                    {conteudo}
                  </Link>
                ) : (
                  <div key={idx}>{conteudo}</div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Multas por órgão" />
            <PanelBody>
              {donutOrgao.length > 0 ? (
                <DonutChart data={donutOrgao} />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma multa registrada na frota.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Ações rápidas" />
            <PanelBody className="flex flex-col gap-2">
              <NovaMultaButton />
              <Button
                variant="outline"
                className="justify-start gap-2 border-primary/30 bg-primary-soft text-primary hover:bg-primary-soft/70"
                render={<Link href="/gestao-da-frota/documentacao" />}
              >
                <CalendarPlus className="size-4" /> Lançar vencimento
              </Button>
              <Button variant="ghost" className="justify-start gap-2" render={<Link href="/fechamento/caixa" />}>
                <Wallet2 className="size-4" /> Ver caixa de hoje
                <ArrowRight className="ml-auto size-3.5" />
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
