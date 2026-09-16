import { SectorTabs } from "@/components/shell/sector-tabs";

const TABS = [
  { href: "/manutencao", label: "Visão geral", exact: true },
  { href: "/manutencao/manutencoes", label: "Manutenções" },
];

export default function ManutencaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SectorTabs tabs={TABS} />
      {children}
    </div>
  );
}
