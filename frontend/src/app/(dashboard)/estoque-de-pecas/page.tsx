import type { Metadata } from "next";
import { EstoqueView } from "@/components/estoque/estoque-view";

export const metadata: Metadata = {
  title: "Estoque de Peças",
};

export default function EstoqueDePecasPage() {
  return <EstoqueView />;
}
