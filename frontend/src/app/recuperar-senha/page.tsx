import { Suspense } from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { RecuperarSenhaForm } from "@/components/financeiro/recuperar-senha-form";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Recuperar senha — Plataforma ASA",
};

export default function RecuperarSenhaPage() {
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
            <h1 className="text-lg font-bold tracking-tight text-foreground">Esqueci minha senha</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Informe o e-mail da sua conta. Enviaremos um link para você definir uma nova senha.
            </p>
          </div>

          {SUPABASE_CONFIGURADO ? (
            <Suspense fallback={<div className="h-40" />}>
              <RecuperarSenhaForm />
            </Suspense>
          ) : (
            <p className="rounded-lg bg-warning-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-warning">
              A conexão com o banco de dados ainda não foi configurada nesta instalação.
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
            Ninguém, nem a própria plataforma, consegue ver sua senha atual — o link define uma nova diretamente com o
            Supabase.
          </p>
        </div>
      </div>
    </main>
  );
}
