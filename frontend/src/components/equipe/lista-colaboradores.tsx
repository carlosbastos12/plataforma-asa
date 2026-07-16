"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/ui/panel";
import { PessoaAvatar } from "@/components/pessoa-avatar";
import { STATUS_COLABORADOR_LABEL, type Colaborador } from "@/lib/equipe";
import { cn } from "@/lib/utils";

const STATUS_CLASSE: Record<Colaborador["status"], string> = {
  disponivel: "bg-success-soft text-success",
  em_rota: "bg-info-soft text-info",
  ausente: "bg-destructive-soft text-destructive",
  folga: "bg-muted text-muted-foreground",
  ferias: "bg-warning-soft text-warning",
};

/** Todos os colaboradores num só lugar — toque em qualquer um para abrir a ficha completa (P037). */
export function ListaColaboradores({ colaboradores, onSelecionar }: { colaboradores: Colaborador[]; onSelecionar: (c: Colaborador) => void }) {
  const [busca, setBusca] = useState("");
  const [equipe, setEquipe] = useState("todas");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return colaboradores.filter((c) => {
      const bateBusca = !termo || c.nome.toLowerCase().includes(termo);
      const bateEquipe = equipe === "todas" || c.equipe === equipe;
      return bateBusca && bateEquipe;
    });
  }, [colaboradores, busca, equipe]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar colaborador..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={equipe} onValueChange={(v) => v && setEquipe(v)}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Equipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as equipes</SelectItem>
            <SelectItem value="Alfa">Equipe Alfa</SelectItem>
            <SelectItem value="Bravo">Equipe Bravo</SelectItem>
            <SelectItem value="Charlie">Equipe Charlie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Panel>
        <ul className="flex flex-col divide-y divide-border">
          {filtrados.map((c) => (
            <li key={c.id}>
              <button onClick={() => onSelecionar(c)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/50">
                <PessoaAvatar nome={c.nome} papel={c.funcao} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-[13px] text-muted-foreground">{c.funcao} · Equipe {c.equipe}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_CLASSE[c.status])}>
                  {STATUS_COLABORADOR_LABEL[c.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
