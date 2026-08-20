import type { Metadata } from "next";
import { ContasView } from "@/components/financeiro/contas-view";
import { AvisoConfiguracao } from "@/components/financeiro/aviso-configuracao";
import { carregarFinanceiro, carregarTiposDespesaParticular } from "@/lib/financeiro/consultas";

export const metadata: Metadata = { title: "Contas a Pagar" };

// Dados reais e dependentes de sessão: nunca podem ser pré-renderizados.
export const dynamic = "force-dynamic";

export default async function ContasAPagarPage() {
  const dados = await carregarFinanceiro("empresa");
  // Buscado aqui também porque, se a gestora tiver permissão, o "Nova
  // conta" desta página permite escolher "Particular" e usar o tipo.
  const tiposDespesaParticular = dados.perfil?.pode_ver_particular
    ? await carregarTiposDespesaParticular()
    : [];

  if (!dados.configurado) {
    return (
      <div className="flex flex-col gap-4">
        <Cabecalho />
        <AvisoConfiguracao />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho />
      {dados.erro && (
        <p className="rounded-lg bg-destructive-soft px-3 py-2 text-[12.5px] text-destructive">
          Não foi possível carregar tudo: {dados.erro}
        </p>
      )}
      <ContasView
        linhas={dados.linhas}
        natureza="empresa"
        classificacoes={dados.classificacoes}
        estabelecimentos={dados.estabelecimentos}
        bancos={dados.bancos}
        fornecedores={dados.fornecedores}
        tiposDespesaParticular={tiposDespesaParticular}
        modelosHistorico={dados.modelosHistorico}
        podeParticular={dados.perfil?.pode_ver_particular ?? false}
      />
    </div>
  );
}

function Cabecalho() {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">O que a empresa tem a pagar?</h2>
      <p className="text-sm text-muted-foreground">
        Cadastre uma vez e o sistema cuida do resto: acompanha o vencimento, avisa na hora certa e deixa o
        fechamento pronto.
      </p>
    </div>
  );
}
