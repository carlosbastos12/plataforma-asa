import type { LucideIcon } from "lucide-react";
import {
  Truck,
  UserCheck,
  Building2,
  Handshake,
  ShoppingCart,
  Fuel,
  Wrench,
  FileCheck2,
  Users,
} from "lucide-react";
import { FROTA, PARCEIROS } from "./mock-data";

/**
 * Cadastros da plataforma — a base que sustenta todos os setores.
 * Dados 100% fictícios (D-005). Cada cadastro se explica: o que faz,
 * que problema resolve, quem utiliza e o benefício que entrega.
 */

export interface ItemCadastro {
  titulo: string;
  subtitulo: string;
  badge?: string;
}

export interface Cadastro {
  slug: string;
  nome: string;
  icone: LucideIcon;
  /** Frase curta exibida no card do hub. */
  resumo: string;
  oQueFaz: string;
  problemaResolve: string;
  quemUtiliza: string;
  beneficio: string;
  /** Rótulo do botão de novo registro (demonstração). */
  rotuloNovo: string;
  itens: ItemCadastro[];
}

const VEICULOS: ItemCadastro[] = FROTA.map((v) => ({
  titulo: `${v.placa} · ${v.modelo}`,
  subtitulo: `${v.categoria} · ${v.ano} · ${v.motorista}`,
  badge: `${v.km.toLocaleString("pt-BR")} km`,
}));

const MOTORISTAS: ItemCadastro[] = FROTA.map((v, i) => ({
  titulo: v.motorista,
  subtitulo: `CNH categoria ${v.categoria === "Moto" ? "A" : "E"} · válida até ${2027 + (i % 3)}`,
  badge: v.placa,
}));

const SEGURADORAS: ItemCadastro[] = PARCEIROS.map((p) => ({
  titulo: p.nome,
  subtitulo: `${p.atendimentos} atendimentos no mês`,
  badge: "ativa",
}));

export const CADASTROS: Cadastro[] = [
  {
    slug: "veiculos",
    nome: "Veículos",
    icone: Truck,
    resumo: "A ficha de cada veículo: modelo, motorista responsável e quilometragem.",
    oQueFaz: "Guarda a ficha completa de cada veículo da frota — placa, modelo, categoria e motorista responsável.",
    problemaResolve: "Informações do veículo espalhadas em lugares diferentes, cada uma numa versão.",
    quemUtiliza: "Equipe da frota e direção.",
    beneficio: "Qualquer pessoa encontra tudo sobre um veículo em segundos, sempre atualizado.",
    rotuloNovo: "Novo veículo",
    itens: VEICULOS,
  },
  {
    slug: "motoristas",
    nome: "Motoristas",
    icone: UserCheck,
    resumo: "Quem dirige cada veículo, com CNH e validade sempre à vista.",
    oQueFaz: "Registra cada motorista, a categoria da CNH e o veículo pelo qual responde.",
    problemaResolve: "Descobrir tarde demais que uma habilitação venceu ou que ninguém responde por um veículo.",
    quemUtiliza: "Acionamento (para despachar) e frota (para documentos e multas).",
    beneficio: "A indicação de condutor em multas sai na hora — a pessoa certa, sem procurar.",
    rotuloNovo: "Novo motorista",
    itens: MOTORISTAS,
  },
  {
    slug: "seguradoras",
    nome: "Seguradoras",
    icone: Building2,
    resumo: "Os parceiros que geram atendimentos, com o volume de cada um.",
    oQueFaz: "Reúne as seguradoras atendidas e o volume de atendimentos de cada uma.",
    problemaResolve: "Fechar o mês sem saber quanto cada parceiro representou na operação.",
    quemUtiliza: "Fechamento e direção.",
    beneficio: "A prestação de contas com cada seguradora começa pronta, não do zero.",
    rotuloNovo: "Nova seguradora",
    itens: SEGURADORAS,
  },
  {
    slug: "empresas-parceiras",
    nome: "Empresas Parceiras",
    icone: Handshake,
    resumo: "Oficinas e apoios que mantêm a operação rodando.",
    oQueFaz: "Cadastra oficinas, guinchos de apoio e demais parceiros operacionais.",
    problemaResolve: "Depender da memória para saber quem chamar quando um veículo precisa de socorro ou serviço.",
    quemUtiliza: "Frota e acionamento.",
    beneficio: "O contato certo aparece junto da necessidade — sem caçar telefone.",
    rotuloNovo: "Nova parceira",
    itens: [
      { titulo: "Oficina Torque Certo", subtitulo: "Mecânica pesada · atende em 24h", badge: "oficina" },
      { titulo: "Rota Norte Diesel", subtitulo: "Injeção e elétrica diesel", badge: "oficina" },
      { titulo: "Guincho Aliado 24h", subtitulo: "Apoio em rodovia · plantão", badge: "apoio" },
      { titulo: "Borracharia Trevo", subtitulo: "Pneus e socorro rápido", badge: "apoio" },
    ],
  },
  {
    slug: "fornecedores",
    nome: "Fornecedores",
    icone: ShoppingCart,
    resumo: "De quem a operação compra peças, pneus e insumos.",
    oQueFaz: "Lista os fornecedores de peças e insumos com o que cada um fornece.",
    problemaResolve: "Compras repetidas em lugares diferentes, sem histórico de quem fornece o quê.",
    quemUtiliza: "Frota e fechamento.",
    beneficio: "Compra certa, com fornecedor conhecido — e o gasto rastreável por veículo.",
    rotuloNovo: "Novo fornecedor",
    itens: [
      { titulo: "Auto Peças Meridiano", subtitulo: "Peças de reposição · entrega no dia" },
      { titulo: "Pneus Vale do Aço", subtitulo: "Pneus de carga e recapagem" },
      { titulo: "Lubrificantes Farol", subtitulo: "Óleos e filtros · contrato mensal" },
    ],
  },
  {
    slug: "postos",
    nome: "Postos de Combustível",
    icone: Fuel,
    resumo: "Onde a frota abastece, para o consumo virar informação.",
    oQueFaz: "Registra os postos credenciados onde a frota abastece.",
    problemaResolve: "Abastecimentos sem padrão, impossíveis de comparar entre veículos e períodos.",
    quemUtiliza: "Frota e fechamento.",
    beneficio: "Prepara o terreno para acompanhar consumo por veículo e flagrar desvios cedo.",
    rotuloNovo: "Novo posto",
    itens: [
      { titulo: "Posto Estrela do Vale", subtitulo: "BR-116, km 18 · diesel S10", badge: "credenciado" },
      { titulo: "Posto Horizonte", subtitulo: "Av. Perimetral, 2200 · 24h", badge: "credenciado" },
      { titulo: "Posto Âncora", subtitulo: "Anel Viário, km 4", badge: "avaliação" },
    ],
  },
  {
    slug: "tipos-manutencao",
    nome: "Tipos de Manutenção",
    icone: Wrench,
    resumo: "As categorias de serviço que padronizam o histórico da frota.",
    oQueFaz: "Padroniza as categorias de serviço usadas no histórico de cada veículo.",
    problemaResolve: "Cada manutenção descrita de um jeito, impossibilitando comparar custo e frequência.",
    quemUtiliza: "Frota.",
    beneficio: "O histórico vira informação: dá para ver onde a frota mais gasta e antecipar trocas.",
    rotuloNovo: "Novo tipo",
    itens: [
      { titulo: "Revisão preventiva", subtitulo: "Programada por quilometragem" },
      { titulo: "Freios", subtitulo: "Pastilhas, lonas e sistema" },
      { titulo: "Alinhamento e balanceamento", subtitulo: "Rodagem e suspensão" },
      { titulo: "Elétrica", subtitulo: "Bateria, chicote e iluminação" },
      { titulo: "Pneus", subtitulo: "Troca, rodízio e recapagem" },
    ],
  },
  {
    slug: "tipos-documento",
    nome: "Tipos de Documento",
    icone: FileCheck2,
    resumo: "Os documentos que a plataforma vigia para nada vencer em silêncio.",
    oQueFaz: "Define os documentos que todo veículo precisa manter e a janela de aviso de cada um.",
    problemaResolve: "Documentos que vencem em silêncio e só aparecem quando viram multa ou retenção.",
    quemUtiliza: "Frota.",
    beneficio: "Todo vencimento entra em contagem regressiva 15 dias antes — o aviso chega a tempo.",
    rotuloNovo: "Novo tipo",
    itens: [
      { titulo: "AET", subtitulo: "Autorização Especial de Trânsito · aviso 15 dias antes", badge: "obrigatório" },
      { titulo: "IPVA", subtitulo: "Imposto anual do veículo · aviso 15 dias antes", badge: "obrigatório" },
      { titulo: "Licenciamento", subtitulo: "Registro anual · aviso 15 dias antes", badge: "obrigatório" },
      { titulo: "Seguro", subtitulo: "Apólice do veículo · aviso 15 dias antes", badge: "obrigatório" },
      { titulo: "Tacógrafo", subtitulo: "Aferição periódica · aviso 15 dias antes", badge: "caminhões" },
    ],
  },
  {
    slug: "usuarios",
    nome: "Usuários",
    icone: Users,
    resumo: "Quem usa a plataforma e o que cada pessoa vê.",
    oQueFaz: "Registra as pessoas com acesso à plataforma e a área de cada uma.",
    problemaResolve: "Todo mundo vendo tudo — ou pior, ninguém sabendo quem alterou o quê.",
    quemUtiliza: "Direção.",
    beneficio: "Cada pessoa entra direto na sua área de trabalho, com o acesso certo.",
    rotuloNovo: "Novo usuário",
    itens: [
      { titulo: "Carlos", subtitulo: "Diretoria · acesso completo", badge: "ativo" },
      { titulo: "Márcia Leal", subtitulo: "Fechamento · caixa e conferência", badge: "ativo" },
      { titulo: "Tiago Furtado", subtitulo: "Acionamento · chamados e despacho", badge: "ativo" },
      { titulo: "Berenice Prado", subtitulo: "Gestão da Frota · documentos e multas", badge: "ativo" },
    ],
  },
];

export function cadastroPorSlug(slug: string): Cadastro | undefined {
  return CADASTROS.find((c) => c.slug === slug);
}
