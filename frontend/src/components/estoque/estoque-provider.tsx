"use client";

import { createContext, useContext, useState } from "react";
import { ALMOXARIFADO, type ItemAlmoxarifado } from "@/lib/mock-data";

/**
 * Estoque de peças compartilhado, na sessão, entre as telas Estoque de
 * Peças e Manutenção — mesmo padrão de Context já usado pela apresentação
 * da plataforma (`ApresentacaoProvider`), montado uma vez no layout do
 * dashboard para que as duas rotas leiam e escrevam o mesmo estado sem
 * precisar de banco, API ou uma lib de state management nova.
 *
 * Continua sendo mock: reinicia para ALMOXARIFADO a cada recarregamento
 * de página — não há persistência entre sessões.
 */
interface EstoqueContextValue {
  itens: ItemAlmoxarifado[];
  cadastrarPeca: (item: ItemAlmoxarifado) => void;
}

const EstoqueContext = createContext<EstoqueContextValue | null>(null);

export function useEstoque() {
  const ctx = useContext(EstoqueContext);
  if (!ctx) throw new Error("useEstoque precisa ser usado dentro de EstoqueProvider");
  return ctx;
}

export function EstoqueProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<ItemAlmoxarifado[]>(ALMOXARIFADO);

  function cadastrarPeca(item: ItemAlmoxarifado) {
    setItens((atual) => [item, ...atual]);
  }

  return <EstoqueContext.Provider value={{ itens, cadastrarPeca }}>{children}</EstoqueContext.Provider>;
}
