import { SectorTabs } from "@/components/shell/sector-tabs";

const TABS = [
  { href: "/estoque-de-pecas", label: "Estoque", exact: true },
  { href: "/estoque-de-pecas/movimentacoes", label: "Movimentações" },
];

export default function EstoqueDePecasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SectorTabs tabs={TABS} />
      {children}
    </div>
  );
}
