"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { FROTA, diasRestantes, formatarData, formatarMoeda, type Multa } from "@/lib/mock-data";

interface LinhaMulta extends Multa {
  placa: string;
  motorista: string;
}

const TODAS_MULTAS: LinhaMulta[] = FROTA.flatMap((v) =>
  v.multas.map((m) => ({ ...m, placa: v.placa, motorista: v.motorista }))
).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

const ORGAOS = Array.from(new Set(TODAS_MULTAS.map((m) => m.orgao)));

export function MultasTable() {
  const [busca, setBusca] = useState("");
  const [orgao, setOrgao] = useState("todos");
  const [status, setStatus] = useState("todos");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return TODAS_MULTAS.filter((m) => {
      const bateBusca = !termo || m.placa.toLowerCase().includes(termo) || m.motorista.toLowerCase().includes(termo);
      const bateOrgao = orgao === "todos" || m.orgao === orgao;
      const bateStatus = status === "todos" || m.status === status;
      return bateBusca && bateOrgao && bateStatus;
    });
  }, [busca, orgao, status]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa ou motorista..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={orgao} onValueChange={(v) => setOrgao(v ?? "todos")}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Órgão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os órgãos</SelectItem>
            {ORGAOS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="aguardando_indicacao">Aguardando indicação</SelectItem>
            <SelectItem value="paga">Paga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Órgão</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Prazo de indicação</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={ShieldAlert}
                    title="Nenhuma multa encontrada"
                    description="Tente ajustar a busca ou os filtros acima."
                    compact
                    className="rounded-none border-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((m) => {
                const prazo = m.prazoIndicacao ? diasRestantes(m.prazoIndicacao) : null;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link
                        href={`/gestao-da-frota/veiculos/${m.placa}`}
                        className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold text-secondary-foreground hover:underline"
                      >
                        {m.placa}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.motorista}</TableCell>
                    <TableCell className="font-medium">{m.orgao}</TableCell>
                    <TableCell className="text-muted-foreground">{formatarData(m.data)}</TableCell>
                    <TableCell className="font-medium">{formatarMoeda(m.valor)}</TableCell>
                    <TableCell className={prazo !== null && prazo <= 3 ? "font-medium text-destructive" : "text-muted-foreground"}>
                      {prazo === null ? "—" : prazo < 0 ? `venceu há ${Math.abs(prazo)}d` : `${prazo}d`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status === "paga" ? "regular" : "critico"} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
