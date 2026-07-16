"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Sigla } from "@/components/sigla";
import { FROTA, statusVencimento, diasRestantes, formatarData, type DocStatus } from "@/lib/mock-data";
import { responsavelDocumento } from "@/lib/insights";

interface Linha {
  placa: string;
  tipo: string;
  emissao: string;
  vencimento: string;
  dias: number;
  status: DocStatus;
  responsavel: string;
}

const TODAS: Linha[] = FROTA.flatMap((v) =>
  v.docs.map((d) => ({
    placa: v.placa,
    tipo: d.tipo,
    emissao: d.emissao,
    vencimento: d.vencimento,
    dias: diasRestantes(d.vencimento),
    status: statusVencimento(d.vencimento),
    responsavel: responsavelDocumento(d.tipo),
  }))
).sort((a, b) => a.dias - b.dias);

const GRUPOS = [
  { valor: "todos", rotulo: "Todos", teste: () => true },
  { valor: "aet", rotulo: "AET", teste: (t: string) => t.startsWith("AET") },
  { valor: "ipva", rotulo: "IPVA / Licenciamento", teste: (t: string) => t === "IPVA" || t === "Licenciamento" },
  { valor: "seguro", rotulo: "Seguro", teste: (t: string) => t === "Seguro" },
  { valor: "tacografo", rotulo: "Tacógrafo", teste: (t: string) => t === "Tacógrafo" },
];

/**
 * Documentação legal em tabela única e filtrável (Clone do Protótipo 1, clone do
 * Protótipo 1 `documentos.html`) — substitui as 6+ planilhas espalhadas
 * (e o layout por cards da P027) por uma central de vencimentos.
 */
export function DocumentacaoView() {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [status, setStatus] = useState("todos");

  const contagemPorGrupo = useMemo(
    () => Object.fromEntries(GRUPOS.map((g) => [g.valor, TODAS.filter((l) => g.teste(l.tipo)).length])),
    []
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const grupoAtivo = GRUPOS.find((g) => g.valor === grupo) ?? GRUPOS[0];
    return TODAS.filter((l) => {
      const bateBusca = !termo || l.placa.toLowerCase().includes(termo);
      const bateGrupo = grupoAtivo.teste(l.tipo);
      const bateStatus = status === "todos" || l.status === status;
      return bateBusca && bateGrupo && bateStatus;
    });
  }, [busca, grupo, status]);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={grupo} onValueChange={(v) => setGrupo(v ?? "todos")}>
        <TabsList variant="line" className="border-b border-border">
          {GRUPOS.map((g) => (
            <TabsTrigger key={g.valor} value={g.valor}>
              {g.rotulo} ({contagemPorGrupo[g.valor]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="atencao">Atenção</SelectItem>
            <SelectItem value="regular">Em dia</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="gap-1.5 sm:ml-auto"
          onClick={() =>
            toast.success("Vencimento pronto para ser lançado", {
              description: "Nesta demonstração o formulário é ilustrativo — na versão completa, o vencimento entra direto nesta tabela.",
            })
          }
        >
          <Plus className="size-4" /> Lançar vencimento
        </Button>
      </div>

      <Panel>
        {filtradas.length === 0 ? (
          <EmptyState icon={FileCheck2} title="Nenhum documento encontrado" description="Tente ajustar a busca ou os filtros acima." compact />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Última emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias restantes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Link href={`/gestao-da-frota/veiculos/${l.placa}`} className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">
                      {l.placa}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Sigla termo={l.tipo} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatarData(l.emissao)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatarData(l.vencimento)}</TableCell>
                  <TableCell className="font-bold">{l.dias < 0 ? `${Math.abs(l.dias)} dias atrás` : `${l.dias} dias`}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.responsavel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
