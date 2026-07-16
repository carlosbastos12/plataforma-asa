"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { Sigla } from "@/components/sigla";
import { DonutChart } from "@/components/charts/donut-chart";
import { NovaMultaButton } from "./nova-multa-button";
import { FROTA, diasRestantes, formatarData, formatarMoeda, type Multa } from "@/lib/mock-data";

interface LinhaMulta extends Multa {
  placa: string;
  motorista: string;
}

const TODAS: LinhaMulta[] = FROTA.flatMap((v) => v.multas.map((m) => ({ ...m, placa: v.placa, motorista: v.motorista }))).sort(
  (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
);

const ORGAOS = Array.from(new Set(TODAS.map((m) => m.orgao)));
const COR_ORGAO: Record<string, string> = {
  AMC: "var(--primary)",
  DETRAN: "var(--info)",
  DNIT: "var(--warning)",
  PRF: "var(--destructive)",
};

const STATUS_ROTULO: Record<Multa["status"], string> = {
  aguardando_indicacao: "Aguard. indicação",
  indicada: "Condutor indicado",
  paga: "Paga",
};

/**
 * Multas em tabela única com filtros e painéis laterais (Clone do Protótipo 1, clone do
 * Protótipo 1 `multas.html`) — substitui os ~30 mil VLOOKUPs da planilha
 * original por um cadastro real.
 */
export function MultasView() {
  const [busca, setBusca] = useState("");
  const [orgao, setOrgao] = useState("todos");
  const [status, setStatus] = useState("todos");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return TODAS.filter((m) => {
      const bateBusca = !termo || m.placa.toLowerCase().includes(termo) || m.motorista.toLowerCase().includes(termo);
      const bateOrgao = orgao === "todos" || m.orgao === orgao;
      const bateStatus = status === "todos" || m.status === status;
      return bateBusca && bateOrgao && bateStatus;
    });
  }, [busca, orgao, status]);

  const donut = ORGAOS.map((o) => ({
    label: o,
    value: TODAS.filter((m) => m.orgao === o).length,
    color: COR_ORGAO[o] ?? "var(--muted-foreground)",
  }));

  const porMotorista = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const m of TODAS) mapa.set(m.motorista, (mapa.get(m.motorista) ?? 0) + m.valor);
    const lista = Array.from(mapa.entries())
      .map(([motorista, valor]) => ({ motorista, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    const max = lista[0]?.valor || 1;
    return lista.map((l) => ({ ...l, pct: Math.round((l.valor / max) * 100) }));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por placa ou motorista..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
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
              <SelectItem value="indicada">Condutor indicado</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
            </SelectContent>
          </Select>
          <div className="sm:ml-auto">
            <NovaMultaButton />
          </div>
        </div>

        <Panel>
          {filtradas.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Nenhuma multa encontrada" description="Tente ajustar a busca ou os filtros acima." compact />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((m) => {
                  const prazo = m.prazoIndicacao ? diasRestantes(m.prazoIndicacao) : null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link href={`/gestao-da-frota/veiculos/${m.placa}`} className="placa-chip rounded-md px-2 py-0.5 font-mono text-xs">
                          {m.placa}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.motorista}</TableCell>
                      <TableCell className="font-medium">
                        <Sigla termo={m.orgao} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatarData(m.data)}</TableCell>
                      <TableCell className="font-bold">{formatarMoeda(m.valor)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            m.status === "paga"
                              ? "rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
                              : m.status === "indicada"
                                ? "rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-info"
                                : `rounded-full px-2.5 py-1 text-xs font-medium ${prazo !== null && prazo <= 3 ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning"}`
                          }
                        >
                          {STATUS_ROTULO[m.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel>
          <PanelHeader title="Multas por órgão" />
          <PanelBody>
            {donut.length > 0 ? <DonutChart data={donut} size={150} /> : <p className="text-sm text-muted-foreground">Sem dados.</p>}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Top motoristas por valor" />
          <PanelBody className="flex flex-col gap-3">
            {porMotorista.map((r) => (
              <div key={r.motorista}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <strong className="text-foreground">{r.motorista}</strong>
                  <span className="text-muted-foreground">{formatarMoeda(r.valor)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-border bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Fluxo de indicação de condutor" />
          <PanelBody className="flex flex-col divide-y divide-border py-0!">
            {[
              "Multa identificada na consulta mensal",
              "Motorista decide se indica o condutor",
              "Pagamento liberado só após indicação concluída",
            ].map((texto, i) => (
              <div key={texto} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-info-soft text-[11px] font-bold text-info">
                  {i + 1}
                </span>
                <p className="text-[13px] text-foreground">{texto}</p>
              </div>
            ))}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
