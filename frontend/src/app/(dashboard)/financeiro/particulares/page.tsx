import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { ContasView } from "@/components/financeiro/contas-view";
import { AvisoConfiguracao } from "@/components/financeiro/aviso-configuracao";
import { EmptyState } from "@/components/empty-state";
import { carregarFinanceiro, carregarTiposDespesaParticular } from "@/lib/financeiro/consultas";

export const metadata: Metadata = { title: "Contas Particulares" };

export const dynamic = "force-dynamic";

export default async function ContasParticularesPage() {
  const dados = await carregarFinanceiro("particular");

  if (!dados.configurado) {
    return (
      <div className="flex flex-col gap-4">
        <Cabecalho />
        <AvisoConfiguracao />
      </div>
    );
  }

  // Barreira de interface. A barreira que realmente vale é o RLS: sem
  // permissão, a consulta acima já volta vazia mesmo sem esta checagem.
  if (!dados.perfil?.pode_ver_particular) {
    return (
      <EmptyState
        icon={Lock}
        title="Área restrita"
        description="As contas particulares são visíveis apenas para a gestora e para quem ela autorizar."
      />
    );
  }

  const tiposDespesaParticular = await carregarTiposDespesaParticular();

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho />
      <ContasView
        linhas={dados.linhas}
        natureza="particular"
        classificacoes={dados.classificacoes}
        estabelecimentos={dados.estabelecimentos}
        bancos={dados.bancos}
        fornecedores={dados.fornecedores}
        tiposDespesaParticular={tiposDespesaParticular}
        modelosHistorico={dados.modelosHistorico}
        podeParticular
      />
    </div>
  );
}

function Cabecalho() {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Minhas contas particulares</h2>
      <p className="text-sm text-muted-foreground">
        Suas despesas pessoais, organizadas no mesmo lugar — e sempre fora do que vai para a contabilidade da
        empresa.
      </p>
    </div>
  );
}
