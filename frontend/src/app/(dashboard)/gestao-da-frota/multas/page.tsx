import type { Metadata } from "next";
import { MultasCards } from "@/components/multas/multas-cards";
import { FROTA, formatarMoeda } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Multas da Frota",
};

export default function MultasPage() {
  const todas = FROTA.flatMap((v) => v.multas);
  const aguardando = todas.filter((m) => m.status === "aguardando_indicacao");
  const valorAberto = aguardando.reduce((acc, m) => acc + m.valor, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">O que pode gerar prejuízo?</h2>
        <p className="text-sm text-muted-foreground">
          {aguardando.length > 0
            ? `${formatarMoeda(valorAberto)} em multas com prazo de indicação correndo — indicar o condutor a tempo evita que o valor dobre.`
            : "Nenhuma multa com prazo correndo. Quando uma chegar, o prazo de indicação aparece aqui em contagem regressiva."}
        </p>
      </div>

      <MultasCards />
    </div>
  );
}
