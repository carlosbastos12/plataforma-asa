import { SectorTabs } from "@/components/shell/sector-tabs";

const TABS = [
  { href: "/gestao-da-frota", label: "Visão geral", exact: true },
  { href: "/gestao-da-frota/veiculos", label: "Veículos" },
  { href: "/gestao-da-frota/documentacao", label: "Documentação" },
  { href: "/gestao-da-frota/multas", label: "Multas" },
  { href: "/gestao-da-frota/combustivel", label: "Combustível" },
];

export default function GestaoDaFrotaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SectorTabs tabs={TABS} />
      {children}
    </div>
  );
}
