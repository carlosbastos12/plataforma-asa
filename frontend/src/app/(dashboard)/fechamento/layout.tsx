import { SectorTabs } from "@/components/shell/sector-tabs";

const TABS = [
  { href: "/fechamento", label: "Visão geral", exact: true },
  { href: "/fechamento/caixa", label: "Caixa Particular" },
];

export default function FechamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SectorTabs tabs={TABS} />
      {children}
    </div>
  );
}
