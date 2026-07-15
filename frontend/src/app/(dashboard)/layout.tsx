import { AppShell } from "@/components/shell/app-shell";
import { ApresentacaoProvider } from "@/components/onboarding/conheca-plataforma";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApresentacaoProvider>
      <AppShell>{children}</AppShell>
    </ApresentacaoProvider>
  );
}
