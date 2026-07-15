import { LayoutGrid, Radio, Truck, Landmark } from "lucide-react";

export interface NavChild {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  description: string;
  /** A pergunta que a tela responde — exibida como subtítulo da página. */
  pergunta: string;
  /** Token de identidade do setor — aplicado com moderação (ícone/realce), nunca substitui a paleta global. */
  accent?: "info" | "primary" | "brand-accent";
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Central de Operações",
    icon: LayoutGrid,
    description: "O que precisa da sua atenção hoje",
    pergunta: "Como está a minha operação hoje?",
  },
  {
    href: "/acionamento",
    label: "Acionamento",
    icon: Radio,
    description: "Chamados, despacho e atendimentos ativos",
    pergunta: "Quem precisa da minha atenção agora?",
    accent: "info",
  },
  {
    href: "/gestao-da-frota",
    label: "Gestão da Frota",
    icon: Truck,
    description: "Veículos, documentação, multas e manutenção",
    pergunta: "Quais veículos impedem a minha operação?",
    accent: "primary",
    children: [
      { href: "/gestao-da-frota/veiculos", label: "Veículos" },
      { href: "/gestao-da-frota/documentacao", label: "Documentação" },
      { href: "/gestao-da-frota/multas", label: "Multas" },
    ],
  },
  {
    href: "/fechamento",
    label: "Fechamento",
    icon: Landmark,
    description: "Conferência, consolidação e caixa",
    pergunta: "O que falta para concluir os fechamentos?",
    accent: "brand-accent",
    children: [{ href: "/fechamento/caixa", label: "Caixa Particular" }],
  },
];
