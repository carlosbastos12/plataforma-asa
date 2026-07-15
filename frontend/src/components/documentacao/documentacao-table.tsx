"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileCheck2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { FROTA, statusVencimento, diasRestantes, formatarData, type DocStatus } from "@/lib/mock-data";

interface LinhaDocumento {
  placa: string;
  motorista: string;
  tipo: string;
  emissao: string;
  vencimento: string;
  dias: number;
  status: DocStatus;
}

const TODAS_LINHAS: LinhaDocumento[] = FROTA.flatMap((v) =>
  v.docs.map((d) => ({
    placa: v.placa,
    motorista: v.motorista,
    tipo: d.tipo,
    emissao: d.emissao,
    vencimento: d.vencimento,
    dias: diasRestantes(d.vencimento),
    status: statusVencimento(d.vencimento),
  }))
).sort((a, b) => a.dias - b.dias);

const TIPOS = Array.from(new Set(TODAS_LINHAS.map((l) => l.tipo)));

export function DocumentacaoTable() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return TODAS_LINHAS.filter((l) => {
      const bateBusca = !termo || l.placa.toLowerCase().includes(termo) || l.motorista.toLowerCase().includes(termo);
      const bateTipo = tipo === "todos" || l.tipo === tipo;
      const bateStatus = status === "todos" || l.status === status;
      return bateBusca && bateTipo && bateStatus;
    });
  }, [busca, tipo, status]);

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
        <Select value={tipo} onValueChange={(v) => setTipo(v ?? "todos")}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os documentos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer status</SelectItem>
            <SelectItem value="critico">Vencido</SelectItem>
            <SelectItem value="atencao">Vencendo</SelectItem>
            <SelectItem value="regular">Em dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Restam</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={FileCheck2}
                    title="Nenhum documento encontrado"
                    description="Tente ajustar a busca ou os filtros acima."
                    compact
                    className="rounded-none border-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Link
                      href={`/gestao-da-frota/veiculos/${l.placa}`}
                      className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold text-secondary-foreground hover:underline"
                    >
                      {l.placa}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.motorista}</TableCell>
                  <TableCell className="font-medium">{l.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{formatarData(l.emissao)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatarData(l.vencimento)}</TableCell>
                  <TableCell className="font-medium">
                    {l.dias < 0 ? `${Math.abs(l.dias)}d atrás` : `${l.dias}d`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
