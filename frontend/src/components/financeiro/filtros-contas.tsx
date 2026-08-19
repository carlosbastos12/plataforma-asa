"use client";

import { Search, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL, type StatusParcela } from "@/lib/financeiro/tipos";
import { FILTROS_VAZIOS, filtrosAtivos, type FiltrosContas } from "@/lib/financeiro/filtros";

interface Props {
  filtros: FiltrosContas;
  aoMudar: (f: FiltrosContas) => void;
  classificacoes: string[];
  estabelecimentos: string[];
  /** Contas particulares não pertencem a filial da empresa — o filtro não faz sentido lá. */
  mostrarEstabelecimento?: boolean;
}

const STATUS: (StatusParcela | "todos")[] = [
  "todos",
  "a_vencer",
  "vence_hoje",
  "vencida",
  "paga",
  "parcialmente_paga",
];

export function FiltrosContasBar({
  filtros,
  aoMudar,
  classificacoes,
  estabelecimentos,
  mostrarEstabelecimento = true,
}: Props) {
  const ativos = filtrosAtivos(filtros);
  const set = (parcial: Partial<FiltrosContas>) => aoMudar({ ...filtros, ...parcial });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.texto}
            onChange={(e) => set({ texto: e.target.value })}
            placeholder="Buscar por fornecedor, NF, CNPJ ou descrição..."
            className="pl-8"
          />
        </div>

        <Select value={filtros.status} onValueChange={(v) => set({ status: (v as StatusParcela) ?? "todos" })}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v: StatusParcela | "todos") => (v === "todos" || !v ? "Todos os status" : STATUS_LABEL[v])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "todos" ? "Todos os status" : STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtros.classificacao} onValueChange={(v) => set({ classificacao: v ?? "todas" })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="todas">Todas as classificações</SelectItem>
            {classificacoes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {mostrarEstabelecimento && (
          <Select value={filtros.estabelecimento} onValueChange={(v) => set({ estabelecimento: v ?? "todos" })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos estabelecimentos</SelectItem>
              {estabelecimentos.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Vencimento entre</span>
        <Input
          type="date"
          value={filtros.de}
          onChange={(e) => set({ de: e.target.value })}
          className="w-40"
          aria-label="Vencimento de"
        />
        <span className="text-xs text-muted-foreground">e</span>
        <Input
          type="date"
          value={filtros.ate}
          onChange={(e) => set({ ate: e.target.value })}
          className="w-40"
          aria-label="Vencimento até"
        />
        {ativos && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => aoMudar(FILTROS_VAZIOS)}>
            <FilterX className="size-3.5" /> Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
