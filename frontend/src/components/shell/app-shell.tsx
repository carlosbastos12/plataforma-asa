import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { PageTransition } from "./page-transition";
import { contagensDaNavegacao } from "@/lib/insights";

export function AppShell({ children }: { children: React.ReactNode }) {
  const contagens = contagensDaNavegacao();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar contagens={contagens} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar contagens={contagens} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-9">
          {/* Largura máxima (P032): em telas largas o conteúdo respira nas
              laterais em vez de esticar — equilíbrio antes de densidade. */}
          <div className="mx-auto w-full max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
