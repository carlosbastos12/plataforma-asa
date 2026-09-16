import { LayoutGrid, Truck, Landmark, FolderOpen, FileText, Settings, Users2, Wallet2, Wrench, Warehouse } from "lucide-react";

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
  /** O benefício que o setor entrega — exibido no hover da navegação (regra: nada clicável sem contexto). */
  beneficio: string;
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
    beneficio: "Abra o dia já sabendo por onde começar — sem percorrer tela por tela.",
  },
  {
    href: "/gestao-da-frota",
    label: "Gestão da Frota",
    icon: Truck,
    description: "Veículos, documentação, multas e manutenção",
    pergunta: "Quais veículos impedem a minha operação?",
    beneficio: "Nenhum documento vence sem aviso e nenhuma multa dobra por esquecimento.",
    accent: "primary",
    children: [
      { href: "/gestao-da-frota/veiculos", label: "Veículos" },
      { href: "/gestao-da-frota/documentacao", label: "Documentação" },
      { href: "/gestao-da-frota/multas", label: "Multas" },
      { href: "/gestao-da-frota/combustivel", label: "Combustível" },
    ],
  },
  {
    href: "/manutencao",
    label: "Manutenção",
    icon: Wrench,
    description: "Serviços realizados, peças usadas e custo por manutenção",
    pergunta: "O que foi feito em cada caminhão, e quanto custou?",
    beneficio: "Peças e serviços de cada manutenção num só lugar — própria ou terceirizada, com o total já calculado.",
    accent: "info",
    children: [{ href: "/manutencao/manutencoes", label: "Manutenções" }],
  },
  {
    href: "/estoque-de-pecas",
    label: "Estoque de Peças",
    icon: Warehouse,
    description: "Peças da oficina própria, com localização física",
    pergunta: "Quais peças tenho disponíveis, e onde estão?",
    beneficio: "Estoque baixo avisa antes de faltar peça na hora da manutenção.",
    accent: "info",
    children: [{ href: "/estoque-de-pecas/movimentacoes", label: "Movimentações" }],
  },
  {
    href: "/fechamento",
    label: "Fechamento",
    icon: Landmark,
    description: "Conferência, consolidação e caixa",
    pergunta: "O que falta para concluir os fechamentos?",
    beneficio: "O dia termina conferido — o fim do mês chega sem surpresa acumulada.",
    accent: "brand-accent",
    children: [{ href: "/fechamento/caixa", label: "Caixa Particular" }],
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: Wallet2,
    description: "Contas a pagar, vencimentos e fechamento contábil",
    pergunta: "O que a empresa tem a pagar?",
    beneficio: "Nenhuma conta vence esquecida — e o fechamento do mês já sai pronto.",
    accent: "brand-accent",
    children: [
      { href: "/financeiro", label: "Contas a Pagar" },
      { href: "/financeiro/relatorios", label: "Relatórios" },
    ],
  },
  {
    href: "/equipe-operacional",
    label: "Equipe Operacional",
    icon: Users2,
    description: "Escala, faltas e atestados da equipe",
    pergunta: "Quem está disponível para operar hoje?",
    beneficio: "Uma ausência nunca pega a escala de surpresa — a substituição já aparece aqui.",
  },
];

/** Áreas de apoio: alimentam e leem os setores, sem pertencer ao fluxo do dia. */
export const PLATAFORMA_ITEMS: NavItem[] = [
  {
    href: "/cadastros",
    label: "Cadastros",
    icon: FolderOpen,
    description: "Veículos, pessoas e parceiros da operação",
    pergunta: "Quem faz parte da minha operação?",
    beneficio: "Registrado uma vez, aproveitado em toda a plataforma — sem redigitação.",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: FileText,
    description: "Leituras prontas da operação por período",
    pergunta: "O que os números dizem sobre a operação?",
    beneficio: "Relatórios que saem prontos para reunião — ninguém monta nada à mão.",
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    description: "Acessos, alertas e preferências",
    pergunta: "Como a plataforma se adapta a você?",
    beneficio: "Avisos no seu tempo e cada pessoa com o acesso certo.",
  },
];
