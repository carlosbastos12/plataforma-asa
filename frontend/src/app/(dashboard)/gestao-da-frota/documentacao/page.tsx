import type { Metadata } from "next";
import { DocumentacaoPorUrgencia } from "@/components/documentacao/documentacao-por-urgencia";

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
          O que já venceu aparece primeiro. O que está em dia sai da frente — mas continua vigiado.
        </p>
      </div>
      <DocumentacaoPorUrgencia />
    </div>
  );
}
