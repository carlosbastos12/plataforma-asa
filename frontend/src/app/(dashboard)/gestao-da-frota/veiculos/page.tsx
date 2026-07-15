import { FrotaGrid } from "@/components/frota/frota-grid";

export default function FrotaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Sua frota, em um só lugar</h2>
        <p className="text-sm text-muted-foreground">
          Toque em qualquer veículo para ver documentos, multas, manutenções e histórico.
        </p>
      </div>
      <FrotaGrid />
    </div>
  );
}
