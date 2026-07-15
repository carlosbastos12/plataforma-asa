import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CADASTROS, cadastroPorSlug } from "@/lib/cadastros";
import { NovoCadastroButton } from "@/components/cadastros/novo-cadastro-button";
import { EmptyState } from "@/components/empty-state";

export function generateStaticParams() {
  return CADASTROS.map((c) => ({ tipo: c.slug }));
}

/**
 * Tela genérica de cadastro: primeiro se apresenta (o que faz, problema,
 * quem usa, benefício), depois lista os registros — nunca o contrário.
 */
export default async function CadastroDetalhePage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  const cadastro = cadastroPorSlug(tipo);
  if (!cadastro) notFound();

  const explicacoes = [
    { rotulo: "O que faz", texto: cadastro.oQueFaz },
    { rotulo: "Problema que resolve", texto: cadastro.problemaResolve },
    { rotulo: "Quem utiliza", texto: cadastro.quemUtiliza },
    { rotulo: "Principal benefício", texto: cadastro.beneficio },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cadastros"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os cadastros
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <cadastro.icone className="size-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{cadastro.nome}</h2>
            <p className="text-sm text-muted-foreground">{cadastro.resumo}</p>
          </div>
        </div>
        <NovoCadastroButton rotulo={cadastro.rotuloNovo} nomeCadastro={cadastro.nome} />
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-border bg-secondary/30 p-5 sm:grid-cols-2">
        {explicacoes.map((e) => (
          <div key={e.rotulo}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{e.rotulo}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{e.texto}</p>
          </div>
        ))}
      </div>

      {cadastro.itens.length === 0 ? (
        <EmptyState
          icon={cadastro.icone}
          title={`Nenhum registro em ${cadastro.nome} ainda`}
          description="Assim que o primeiro registro entrar, ele passa a aparecer em toda a plataforma automaticamente."
          action={<NovoCadastroButton rotulo={cadastro.rotuloNovo} nomeCadastro={cadastro.nome} />}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {cadastro.itens.map((item) => (
              <li key={item.titulo} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/40">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{item.titulo}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{item.subtitulo}</p>
                </div>
                {item.badge && (
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {item.badge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
