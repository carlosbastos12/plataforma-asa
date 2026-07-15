import type { Metadata } from "next";
import { RelatoriosGrid } from "@/components/relatorios/relatorio-card";

export const metadata: Metadata = {
  title: "Relatórios",
};

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          O que os números dizem sobre a operação?
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cada relatório responde uma pergunta do negócio e sai pronto para reunião. Toque em &quot;Ver exemplo&quot;
          para conhecer a leitura de cada um.
        </p>
      </div>

      <RelatoriosGrid />
    </div>
  );
}
