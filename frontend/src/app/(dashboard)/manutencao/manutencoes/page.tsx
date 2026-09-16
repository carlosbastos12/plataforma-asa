import type { Metadata } from "next";
import { ManutencoesView } from "@/components/manutencao/manutencoes-view";

export const metadata: Metadata = {
  title: "Manutenções",
};

export default function ManutencoesPage() {
  return <ManutencoesView />;
}
