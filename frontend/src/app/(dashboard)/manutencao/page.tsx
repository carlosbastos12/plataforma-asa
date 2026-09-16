import Link from "next/link";
import { Wrench, ClipboardList, ShieldCheck, ShieldAlert, Package, Banknote } from "lucide-react";
import { StatCard } from "@/components/home/stat-card";
import { TipoManutencaoBadge, StatusManutencaoBadge } from "@/components/manutencao/badges";
import { MANUTENCOES, FROTA, formatarData, formatarMoeda, totalPecas, totalServicosTerceirizados } from "@/lib/mock-data";

export default function ManutencaoPage() {
  const preventivas = MANUTENCOES.filter((m) => m.tipo === "preventiva").length;
  const corretivas = MANUTENCOES.filter((m) => m.tipo === "corretiva").length;
  const pendentes = MANUTENCOES.filter((m) => m.status === "em_andamento");
  const placasPendentes = new Set(pendentes.map((m) => m.placa)).size;
  const valorPecas = MANUTENCOES.reduce((s, m) => s + totalPecas(m), 0);
  const valorServicos = MANUTENCOES.reduce((s, m) => s + totalServicosTerceirizados(m), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Serviços realizados na frota, com peças e custo por manutenção</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cada manutenção junta peças utilizadas e serviços realizados num só lugar — própria ou terceirizada, com
          o total já calculado.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Wrench} label="manutenções registradas" value={String(MANUTENCOES.length)} />
        <StatCard icon={ShieldCheck} label="preventivas" value={String(preventivas)} />
        <StatCard icon={ShieldAlert} label="corretivas" value={String(corretivas)} />
        <StatCard
          icon={ClipboardList}
          label="veículos com manutenção pendente"
          value={String(placasPendentes)}
          tone={placasPendentes > 0 ? "warning" : "success"}
        />
        <StatCard icon={Package} label="gasto com peças" value={formatarMoeda(valorPecas)} />
        <StatCard icon={Banknote} label="gasto com serviços terceirizados" value={formatarMoeda(valorServicos)} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Manutenções em andamento</h3>
          <Link href="/manutencao/manutencoes" className="text-xs font-medium text-primary">
            Ver todas as manutenções →
          </Link>
        </div>
        {pendentes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nenhuma manutenção em andamento no momento.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {pendentes.map((m) => {
                const veiculo = FROTA.find((v) => v.placa === m.placa);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <span className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">{m.placa}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{m.descricao}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {veiculo?.modelo} · {formatarData(m.data)}
                      </p>
                    </div>
                    <TipoManutencaoBadge tipo={m.tipo} />
                    <StatusManutencaoBadge status={m.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
