import { LayoutGrid, Radio, Truck, Landmark } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  description: string;
  /** Token de identidade do setor — aplicado com moderação (ícone/realce), nunca substitui a paleta global. */
  accent?: "info" | "primary" | "brand-accent";
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Central de Operações",
    icon: LayoutGrid,
    description: "O que precisa da sua atenção hoje",
  },
  {
    href: "/acionamento",
    label: "Acionamento",
    icon: Radio,
    description: "Chamados, despacho e atendimentos ativos",
    accent: "info",
  },
  {
    href: "/gestao-da-frota",
    label: "Gestão da Frota",
    icon: Truck,
    description: "Veículos, documentação, multas e manutenção",
    accent: "primary",
  },
  {
    href: "/fechamento",
    label: "Fechamento",
    icon: Landmark,
    description: "Conferência, consolidação e caixa",
    accent: "brand-accent",
  },
];
