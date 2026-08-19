import Link from "next/link";
import {
  Wallet2,
  CalendarClock,
  AlertTriangle,
  CircleCheckBig,
  TriangleAlert,
  ArrowRight,
  Lock,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { carregarResumoEmpresa } from "@/lib/financeiro/consultas";
import { calcularIndicadores } from "@/lib/financeiro/indicadores";
import { formatarMoeda } from "@/lib/financeiro/formato";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { criarClienteServidor } from "@/lib/supabase/server";

function Cabecalho() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-bold text-foreground">Financeiro — Contas a Pagar</h3>
        <p className="text-xs text-muted-foreground">
          Somente contas da empresa. Particulares nunca entram neste painel.
        </p>
      </div>
      <Link
        href="/financeiro"
        className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        Abrir Central Financeira <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/**
 * Bloco financeiro da Central de Operações.
 *
 * Mostra número real ou não mostra número nenhum — nunca zero fictício:
 * um indicador financeiro errado na primeira tela custa mais caro que a
 * ausência dele.
 */
export async function PainelFinanceiroHome() {
  if (!SUPABASE_CONFIGURADO) return null;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="flex flex-col gap-3">
        <Cabecalho />
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Lock className="size-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Entre para ver os números financeiros</p>
            <p className="text-[12.5px] text-muted-foreground">
              Esta área trabalha com dados reais e exige acesso identificado.
            </p>
          </div>
        </Link>
      </section>
    );
  }

  const linhas = await carregarResumoEmpresa();
  const i = calcularIndicadores(linhas);
  const pendencias = i.semClassificacao + i.semDocumento;

  return (
    <section className="flex flex-col gap-3">
      <Cabecalho />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarClock}
          tone={i.vencendoHoje > 0 ? "warn" : "ok"}
          label="Vencendo hoje"
          value={String(i.vencendoHoje)}
          foot={formatarMoeda(i.valorVencendoHoje)}
          href="/financeiro"
        />
        <KpiCard
          icon={AlertTriangle}
          tone={i.vencidas > 0 ? "crit" : "ok"}
          label="Contas vencidas"
          value={String(i.vencidas)}
          foot={formatarMoeda(i.valorVencido)}
          href="/financeiro"
        />
        <KpiCard
          icon={Wallet2}
          tone="info"
          label="A pagar"
          value={formatarMoeda(i.valorAPagar)}
          foot={`${i.aPagar} parcela(s) em aberto`}
          href="/financeiro"
        />
        <KpiCard
          icon={CircleCheckBig}
          tone="ok"
          label="Total pago"
          value={formatarMoeda(i.valorPago)}
          foot={`${i.totalPago} parcela(s) quitada(s)`}
          href="/financeiro/relatorios"
        />
      </div>

      {pendencias > 0 && (
        <Link
          href="/financeiro/relatorios"
          className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/60 px-4 py-3 transition-colors hover:border-warning/60"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2.25} />
          <p className="text-[12.5px] leading-relaxed text-foreground">
            <span className="font-semibold text-warning">{pendencias} pendência(s)</span> podem travar o
            fechamento contábil
            {i.semClassificacao > 0 && ` — ${i.semClassificacao} sem classificação`}
            {i.semDocumento > 0 && `, ${i.semDocumento} sem nº de documento`}.
          </p>
        </Link>
      )}
    </section>
  );
}

/** Esqueleto exibido enquanto o painel carrega, para a Home não "pular". */
export function PainelFinanceiroHomeSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <div className="h-9" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    </section>
  );
}
