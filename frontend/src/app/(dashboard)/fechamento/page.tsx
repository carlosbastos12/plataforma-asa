import { Wallet2, ClipboardList, Layers, Building2, Info } from "lucide-react";
import { SectorLinkCard } from "@/components/shell/sector-link-card";
import { CAIXA } from "@/lib/mock-data";

export default function FechamentoPage() {
  const caixaAberto = CAIXA.filter((c) => c.status === "aberto").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Onde o dia se consolida</h2>
        <p className="text-sm text-muted-foreground">
          Conferência do que foi atendido, fechamento financeiro e relação com as seguradoras.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-secondary/30 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          O Caixa Particular já funciona de verdade nesta demonstração. As demais áreas deste setor ainda são
          <strong className="text-foreground"> conceito visual</strong> — o processo real de conferência e fechamento
          com seguradoras ainda precisa ser detalhado com a equipe da ASA antes de qualquer regra ser definida.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectorLinkCard
          href="/fechamento/caixa"
          icon={Wallet2}
          title="Caixa Particular"
          description="Entradas, saídas e fechamento do dia."
          badge={caixaAberto > 0 ? `${caixaAberto} dia(s) em aberto` : "tudo fechado"}
        />
        <SectorLinkCard
          icon={ClipboardList}
          title="Conferência de Serviços"
          description="Cruzar o que foi atendido com o que foi registrado."
          badge="conceito, a definir"
          disabled
        />
        <SectorLinkCard
          icon={Layers}
          title="Consolidação"
          description="Reunir o período antes do fechamento financeiro."
          badge="conceito, a definir"
          disabled
        />
        <SectorLinkCard
          icon={Building2}
          title="Seguradoras"
          description="Relacionamento e prestação de contas com parceiros."
          badge="conceito, a definir"
          disabled
        />
      </div>
    </div>
  );
}
