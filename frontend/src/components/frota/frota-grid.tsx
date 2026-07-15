"use client";

import { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { VehicleCard } from "./vehicle-card";
import { FROTA, situacaoVeiculo } from "@/lib/mock-data";

export function FrotaGrid() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    // Quem impede a operação aparece primeiro — a tela responde a pergunta
    // antes de qualquer filtro ser tocado.
    const peso: Record<string, number> = { critico: 0, atencao: 1, regular: 2 };
    return FROTA.filter((v) => {
      const bateBusca =
        !termo || v.placa.toLowerCase().includes(termo) || v.motorista.toLowerCase().includes(termo);
      const bateCategoria = categoria === "todas" || v.categoria === categoria;
      const bateStatus = status === "todos" || situacaoVeiculo(v) === status;
      return bateBusca && bateCategoria && bateStatus;
    }).sort((a, b) => peso[situacaoVeiculo(a)] - peso[situacaoVeiculo(b)]);
  }, [busca, categoria, status]);

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
        <Select value={categoria} onValueChange={(v) => setCategoria(v ?? "todas")}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            <SelectItem value="Caminhão">Caminhão</SelectItem>
            <SelectItem value="Moto">Moto</SelectItem>
            <SelectItem value="Utilitário">Utilitário</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "todos")}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer situação</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="atencao">Atenção</SelectItem>
            <SelectItem value="regular">Em dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhum veículo encontrado"
          description="Tente ajustar a busca ou os filtros acima."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((v) => (
            <VehicleCard key={v.placa} veiculo={v} />
          ))}
        </div>
      )}
    </div>
  );
}
