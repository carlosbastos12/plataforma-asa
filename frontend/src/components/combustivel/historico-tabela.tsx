import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { formatarData, formatarMoeda } from "@/lib/mock-data";
import type { LinhaHistorico } from "@/lib/combustivel";

/** Últimos abastecimentos — base e externo, lado a lado, com quem registrou e o status de cada um (P036). */
export function HistoricoTabela({ linhas }: { linhas: LinhaHistorico[] }) {
  return (
    <Panel>
      <PanelHeader title="Últimos abastecimentos" subtitle="Base e posto externo, no mesmo histórico" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Motorista</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Litros</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Quem registrou</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-muted-foreground">{formatarData(l.data)}</TableCell>
              <TableCell>
                <Link href={`/gestao-da-frota/veiculos/${l.placa}`} className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">
                  {l.placa}
                </Link>
              </TableCell>
              <TableCell className="text-foreground">
                <span className="inline-flex items-center gap-2">
                  <PessoaAvatar nome={l.motorista} size="sm" /> {l.motorista}
                </span>
              </TableCell>
              <TableCell>
                <span className={l.origem === "Tanque da Base" ? "rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground" : "rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info"}>
                  {l.origem}
                </span>
              </TableCell>
              <TableCell className="font-bold">{l.litros.toLocaleString("pt-BR")} L</TableCell>
              <TableCell className="text-muted-foreground">{formatarMoeda(l.valor)}</TableCell>
              <TableCell className="text-muted-foreground">{l.quemRegistrou}</TableCell>
              <TableCell>
                <span className={l.status === "Confirmado" ? "rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success" : "rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning"}>
                  {l.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
