"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { entrar } from "@/lib/financeiro/acoes";

export function LoginForm() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await entrar(email, senha);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível entrar.");
        return;
      }
      const proximo = parametros.get("proximo") ?? "/financeiro";
      router.replace(proximo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.email@asareboques.com.br"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="senha" className="text-xs font-medium text-muted-foreground">
            Senha
          </label>
          <Link href="/recuperar-senha" className="text-xs font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          className="h-10"
        />
      </div>

      {erro && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[12.5px] text-destructive" role="alert">
          {erro}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-1 h-10 w-full gap-2">
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Entrar
      </Button>
    </form>
  );
}
