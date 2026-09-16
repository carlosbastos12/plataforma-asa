import { AppShell } from "@/components/shell/app-shell";
import { ApresentacaoProvider } from "@/components/onboarding/conheca-plataforma";
import { EstoqueProvider } from "@/components/estoque/estoque-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApresentacaoProvider>
      <EstoqueProvider>
        <AppShell>{children}</AppShell>
      </EstoqueProvider>
    </ApresentacaoProvider>
  );
}
