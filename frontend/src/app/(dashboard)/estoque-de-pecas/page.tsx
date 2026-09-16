import type { Metadata } from "next";
import { Package, MapPin, AlertTriangle, Wrench } from "lucide-react";
import { StatCard } from "@/components/home/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { ALMOXARIFADO, MANUTENCOES, statusEstoque, localizacaoCompacta, formatarData, formatarMoeda } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Estoque de Peças",
};

export default function EstoqueDePecasPage() {
  const itensEmAlerta = ALMOXARIFADO.filter((i) => statusEstoque(i) !== "regular").length;
  const itensZerados = ALMOXARIFADO.filter((i) => statusEstoque(i) === "critico").length;

  const pecasUsadasRecentemente = MANUTENCOES.flatMap((m) =>
    m.pecas.map((p) => ({
      placa: m.placa,
      data: m.data,
      descricao: m.descricao,
      peca: p,
    }))
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">O que tem no estoque — e onde está</h2>
        <p className="text-sm text-muted-foreground">
          Peças da oficina própria, com localização física e alerta antes de faltar.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Package} label="peças cadastradas" value={String(ALMOXARIFADO.length)} />
        <StatCard
          icon={AlertTriangle}
          label="estoque baixo"
          value={String(itensEmAlerta)}
          tone={itensEmAlerta > 0 ? "warning" : "success"}
        />
        <StatCard
          icon={AlertTriangle}
          label="sem estoque"
          value={String(itensZerados)}
          tone={itensZerados > 0 ? "warning" : "success"}
        />
        <StatCard icon={Wrench} label="saídas registradas" value={String(pecasUsadasRecentemente.length)} hint="peças usadas em manutenções" />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Peças cadastradas</h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {ALMOXARIFADO.map((item) => {
              const status = statusEstoque(item);
              return (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Package className="size-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.nome} <span className="font-normal text-muted-foreground">· {item.id}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" /> {item.localizacaoDescricao} ({localizacaoCompacta(item)}) · {item.categoria}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{item.quantidade} un.</p>
                    <p className="text-xs text-muted-foreground">mín. {item.quantidadeMinima}</p>
                  </div>
                  <StatusBadge
                    status={status}
                    label={status === "critico" ? "Zerado" : status === "atencao" ? "Estoque baixo" : "Em dia"}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Peças usadas recentemente</h3>
        {pecasUsadasRecentemente.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhuma peça registrada em manutenções ainda.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {pecasUsadasRecentemente.map((s, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <span className="placa-chip shrink-0 rounded-md px-2 py-1 font-mono text-xs">{s.placa}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {s.peca.qtd}x {s.peca.nome}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {formatarData(s.data)} · {s.descricao} ·{" "}
                      {s.peca.origem === "estoque_proprio" ? "Estoque próprio" : s.peca.fornecedor ?? "Compra específica"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatarMoeda(s.peca.qtd * s.peca.valorUnitario)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Conceito de demonstração: estoque e localização são dados fictícios fixos. A baixa de estoque ao registrar
        uma manutenção é só visual (na tela de &quot;Nova manutenção&quot;) — o saldo aqui não é recalculado
        automaticamente.
      </p>
    </div>
  );
}
