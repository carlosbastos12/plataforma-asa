import type { Metadata } from "next";
import { RelatoriosView } from "@/components/financeiro/relatorios-view";
import { AvisoConfiguracao } from "@/components/financeiro/aviso-configuracao";
import { carregarFinanceiro } from "@/lib/financeiro/consultas";

export const metadata: Metadata = { title: "Relatórios Financeiros" };

export const dynamic = "force-dynamic";

export default async function RelatoriosFinanceirosPage() {
  // Sem filtro de natureza: a própria tela separa empresa de particular, e
  // o RLS já removeu as particulares para quem não tem permissão.
  const dados = await carregarFinanceiro();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          O que os números dizem sobre o período?
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha o período, confira e exporte em XLSX ou PDF — pronto para reunião ou para a contabilidade.
        </p>
      </div>

      {!dados.configurado ? (
        <AvisoConfiguracao />
      ) : (
        <RelatoriosView linhas={dados.linhas} podeParticular={dados.perfil?.pode_ver_particular ?? false} />
      )}
    </div>
  );
}
