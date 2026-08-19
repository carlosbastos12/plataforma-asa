import { SectorTabs } from "@/components/shell/sector-tabs";
import { carregarFinanceiro } from "@/lib/financeiro/consultas";

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  // A aba de particulares só aparece para quem realmente pode vê-las.
  const { perfil } = await carregarFinanceiro();

  const tabs = [
    { href: "/financeiro", label: "Contas a Pagar", exact: true },
    ...(perfil?.pode_ver_particular ? [{ href: "/financeiro/particulares", label: "Contas Particulares" }] : []),
    { href: "/financeiro/relatorios", label: "Relatórios" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectorTabs tabs={tabs} />
      {children}
    </div>
  );
}
