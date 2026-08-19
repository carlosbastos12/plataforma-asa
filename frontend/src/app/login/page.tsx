import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/financeiro/login-form";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Entrar — Plataforma ASA",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Marca em versão clara — o BrandMark da sidebar usa texto branco. */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-[var(--chart-2)] text-sm font-extrabold text-white shadow-sm">
            ASA
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-foreground">ASA Reboques</div>
            <div className="text-[11px] text-muted-foreground">Complementar ao AUTEM</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Central Financeira</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Esta área trabalha com informações financeiras reais. Entre com seu acesso para continuar.
            </p>
          </div>

          {SUPABASE_CONFIGURADO ? (
            <Suspense fallback={<div className="h-56" />}>
              <LoginForm />
            </Suspense>
          ) : (
            <p className="rounded-lg bg-warning-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-warning">
              A conexão com o banco de dados ainda não foi configurada nesta instalação. O acesso será liberado
              assim que as credenciais forem definidas.
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
            Cada pessoa enxerga apenas o que o seu acesso permite. As contas particulares da gestora são
            protegidas no próprio banco de dados.
          </p>
        </div>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar para a plataforma
        </Link>
      </div>
    </main>
  );
}
