import { SectorTabs } from "@/components/shell/sector-tabs";
import { podeVerParticular } from "@/lib/financeiro/consultas";

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  // A aba de particulares só aparece para quem realmente pode vê-las.
  // Consulta leve de propósito: o layout precisa de um booleano, não das
  // contas — carregar `carregarFinanceiro()` aqui repetiria, a cada troca
  // de aba, a consulta mais pesada do módulo só para montar o menu.
  const mostrarParticulares = await podeVerParticular();

  const tabs = [
    { href: "/financeiro", label: "Contas a Pagar", exact: true },
    ...(mostrarParticulares ? [{ href: "/financeiro/particulares", label: "Contas Particulares" }] : []),
    { href: "/financeiro/relatorios", label: "Relatórios" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectorTabs tabs={tabs} />
      {children}
    </div>
  );
}
