import { Suspense } from "react";
import type { Metadata } from "next";
import { AtualizarSenhaForm } from "@/components/financeiro/atualizar-senha-form";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Definir nova senha — Plataforma ASA",
};

export default function AtualizarSenhaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-[var(--chart-2)] text-sm font-extrabold text-white shadow-sm">
            ASA
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-foreground">ASA Reboques</div>
            <div className="text-[11px] text-muted-foreground">SIGA — Sistema Integrado de Gestão ASA</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Definir nova senha</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Escolha uma nova senha para acessar a Central Financeira.
            </p>
          </div>

          {SUPABASE_CONFIGURADO ? (
            <Suspense fallback={<div className="h-32" />}>
              <AtualizarSenhaForm />
            </Suspense>
          ) : (
            <p className="rounded-lg bg-warning-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-warning">
              A conexão com o banco de dados ainda não foi configurada nesta instalação.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
