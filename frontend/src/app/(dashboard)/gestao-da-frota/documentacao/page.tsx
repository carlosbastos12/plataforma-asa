import { DocumentacaoTable } from "@/components/documentacao/documentacao-table";

export default function DocumentacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          AET, IPVA, licenciamento, seguro e tacógrafo — tudo em um lugar só
        </h2>
        <p className="text-sm text-muted-foreground">
          Vermelho é vencido, amarelo é atenção nos próximos 15 dias, verde está em dia.
        </p>
      </div>
      <DocumentacaoTable />
    </div>
  );
}
