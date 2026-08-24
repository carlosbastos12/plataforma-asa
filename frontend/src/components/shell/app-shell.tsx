import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { PageTransition } from "./page-transition";
import { contagensDaNavegacao } from "@/lib/insights";
import { carregarUsuarioSessao } from "@/lib/financeiro/consultas";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const contagens = contagensDaNavegacao();
  // Sem sessão (a maior parte da plataforma segue em demonstração, sem
  // login) `usuario` vem null — o topo trata esse caso, nunca inventa nome.
  const usuario = await carregarUsuarioSessao();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar contagens={contagens} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar contagens={contagens} usuario={usuario} />
        <main className="flex-1 px-4 py-6 md:py-9 2xl:px-8">
          {/*
            Largura máxima (P032): em telas largas o conteúdo respira nas
            laterais em vez de esticar — equilíbrio antes de densidade.

            A partir de 2xl (1536px) o limite sobe para 90rem. Motivo: num
            monitor de 1920px sobravam ~450px de margem vazia de cada lado
            enquanto a tabela de Contas a Pagar, com 9 colunas de dado
            financeiro, era cortada por barra de rolagem. Espaço em branco
            é escolha de projeto; espaço em branco ao lado de um conteúdo
            que não cabe é desperdício. Abaixo de 1536px nada muda — ali a
            largura já é limitada pela própria tela.
          */}
          <div className="mx-auto w-full max-w-6xl 2xl:max-w-[90rem]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
