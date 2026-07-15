import { CaixaView } from "@/components/caixa/caixa-view";

export default function CaixaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Caixa particular, sem planilha nova todo dia</h2>
        <p className="text-sm text-muted-foreground">
          Um lançamento por atendimento, fechamento com um toque.
        </p>
      </div>
      <CaixaView />
    </div>
  );
}
