"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recuperarSenha } from "@/lib/financeiro/acoes";

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, iniciar] = useTransition();

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await recuperarSenha(email);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível enviar o e-mail agora.");
        return;
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-3.5">
        <p className="rounded-lg bg-success-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-success">
          Se este e-mail estiver cadastrado, um link de recuperação foi enviado. Verifique também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar para o login
        </Link>
      </div>
    );
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

      {erro && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[12.5px] text-destructive" role="alert">
          {erro}
        </p>
      )}

      <Button type="submit" disabled={enviando} className="mt-1 h-10 w-full gap-2">
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        Enviar link de recuperação
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Voltar para o login
      </Link>
    </form>
  );
}
