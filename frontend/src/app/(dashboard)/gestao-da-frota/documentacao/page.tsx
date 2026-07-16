import type { Metadata } from "next";
import { DocumentacaoView } from "@/components/documentacao/documentacao-view";

export const metadata: Metadata = {
  title: "Documentação da Frota",
};

export default function DocumentacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          O que pode interromper a operação?
        </h2>
        <p className="text-sm text-muted-foreground">
          AET, IPVA, Licenciamento, Seguro e Tacógrafo — todos os vencimentos da frota em um só lugar.
        </p>
      </div>
      <DocumentacaoView />
    </div>
  );
}
