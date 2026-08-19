"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Estado = "verificando" | "pronto" | "invalido" | "concluido";

/**
 * Define a nova senha depois do clique no link de recuperação.
 *
 * Fluxo oficial do Supabase Auth: o cliente de navegador detecta a sessão
 * de recuperação automaticamente pela URL (`detectSessionInUrl`, ligado por
 * padrão) e dispara o evento `PASSWORD_RECOVERY` — só então é seguro pedir
 * a nova senha. Nada aqui é validado ou guardado pela aplicação; quem
 * confirma a troca é o próprio Supabase.
 */
export function AtualizarSenhaForm() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  useEffect(() => {
    const supabase = criarClienteNavegador();

    const { data: assinatura } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") setEstado("pronto");
    });

    // Cobre o caso de o evento já ter disparado antes deste componente
    // montar: se já existe sessão válida, também é seguro seguir.
    supabase.auth.getSession().then(({ data }) => {
      setEstado((atual) => (atual === "verificando" ? (data.session ? "pronto" : "invalido") : atual));
    });

    return () => assinatura.subscription.unsubscribe();
  }, []);

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    iniciar(async () => {
      const supabase = criarClienteNavegador();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        setErro("Não foi possível definir a nova senha. Solicite um novo link.");
        return;
      }
      setEstado("concluido");
      setTimeout(() => {
        router.replace("/financeiro");
        router.refresh();
      }, 1500);
    });
  }

  if (estado === "verificando") {
    return (
      <div className="flex h-32 items-center justify-center text-[13px] text-muted-foreground">
        Verificando o link…
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <p className="rounded-lg bg-destructive-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-destructive">
        Este link de recuperação é inválido ou expirou. Solicite um novo em{" "}
        <a href="/recuperar-senha" className="font-medium underline">
          Esqueci minha senha
        </a>
        .
      </p>
    );
  }

  if (estado === "concluido") {
    return (
      <p className="rounded-lg bg-success-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-success">
        Senha atualizada. Redirecionando para a Central Financeira…
      </p>
    );
  }

  return (
    <form onSubmit={submeter} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-xs font-medium text-muted-foreground">
          Nova senha
        </label>
        <Input
          id="senha"
          type="password"
          autoComplete="new-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className="text-xs font-medium text-muted-foreground">
          Confirmar nova senha
        </label>
        <Input
          id="confirmar"
          type="password"
          autoComplete="new-password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
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
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        Salvar nova senha
      </Button>
    </form>
  );
}
