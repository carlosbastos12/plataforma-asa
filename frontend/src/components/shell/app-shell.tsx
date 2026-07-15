import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { PageTransition } from "./page-transition";
import { contarPendenciasPorSetor } from "@/lib/mock-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const setores = contarPendenciasPorSetor();
  const contagens: Record<string, number> = {
    "/acionamento": setores.acionamento,
    "/gestao-da-frota": setores.gestaoDaFrota,
    "/fechamento": setores.fechamento,
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar contagens={contagens} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar contagens={contagens} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
