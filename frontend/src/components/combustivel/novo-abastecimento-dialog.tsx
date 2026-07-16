"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Fuel, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FROTA, TODAY } from "@/lib/mock-data";
import { POSTOS_EXTERNOS, FORMAS_PAGAMENTO, diasDeAutonomiaTanque, type MovimentacaoTanque, type AbastecimentoExterno } from "@/lib/combustivel";
import { cn } from "@/lib/utils";

function hojeISO() {
  return TODAY.toISOString().slice(0, 10);
}

type Origem = "base" | "externo";

interface Props {
  movimentacoesAtuais: MovimentacaoTanque[];
  onRegistrarBase: (m: MovimentacaoTanque) => void;
  onRegistrarExterno: (a: AbastecimentoExterno) => void;
}

/**
 * Registra um abastecimento realizado pela frota — desconta automaticamente
 * os litros do estoque quando o abastecimento é interno (P036).
 */
export function NovoAbastecimentoDialog({ movimentacoesAtuais, onRegistrarBase, onRegistrarExterno }: Props) {
  const [aberto, setAberto] = useState(false);
  const [placa, setPlaca] = useState(FROTA[0].placa);
  const [data, setData] = useState(hojeISO());
  const [odometro, setOdometro] = useState("");
  const [litros, setLitros] = useState("180");
  const [origem, setOrigem] = useState<Origem>("base");
  const [posto, setPosto] = useState(POSTOS_EXTERNOS[0]);
  const [cidade, setCidade] = useState("Fortaleza");
  const [valor, setValor] = useState("1080");
  const [formaPagamento, setFormaPagamento] = useState<string>(FORMAS_PAGAMENTO[0]);
  const [observacoes, setObservacoes] = useState("");
  const proximoId = useRef(4411);

  const veiculo = FROTA.find((v) => v.placa === placa) ?? FROTA[0];
  const litrosNum = Number(litros) || 0;

  function registrar() {
    if (origem === "base") {
      const novaMovs = [
        ...movimentacoesAtuais,
        { data, hora: "12:00", tipo: "saida" as const, litros: litrosNum, descricao: "Abastecimento antes da rota", placa, responsavel: veiculo.motorista },
      ];
      onRegistrarBase(novaMovs[novaMovs.length - 1]);
      const autonomia = diasDeAutonomiaTanque(novaMovs);
      toast.success("Estoque atualizado automaticamente.", {
        description: `Autonomia estimada recalculada para ${autonomia} dia(s).`,
      });
    } else {
      onRegistrarExterno({
        id: `AB-${proximoId.current++}`,
        data,
        posto,
        cidade,
        motorista: veiculo.motorista,
        placa,
        viagem: "Registrado agora",
        litros: litrosNum,
        valor: Number(valor) || 0,
        formaPagamento,
        quemRegistrou: veiculo.motorista,
        status: "confirmado",
        observacoes,
      });
      toast.success("Abastecimento externo registrado.", {
        description: "Já entra na prestação de contas do motorista — sem depender de recibo guardado.",
      });
    }
    setAberto(false);
    setOdometro("");
    setObservacoes("");
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" className="gap-1.5" onClick={() => setAberto(true)} />}>
          <Fuel className="size-4" /> Registrar Abastecimento
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          Registra um abastecimento realizado pela frota. O sistema desconta automaticamente os litros do estoque
          quando o abastecimento é interno.
        </TooltipContent>
      </Tooltip>

      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>Novo Abastecimento</DialogTitle>
        <DialogDescription>Vale para tanque da base ou posto externo — o histórico e o estoque se ajustam sozinhos.</DialogDescription>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Veículo</label>
            <Select value={placa} onValueChange={(v) => v && setPlaca(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FROTA.map((v) => (
                  <SelectItem key={v.placa} value={v.placa}>{v.placa} · {v.modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-[13px] text-muted-foreground">
            Motorista
            <strong className="text-foreground">{veiculo.motorista}</strong>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Odômetro (km)</label>
            <Input type="number" value={odometro} onChange={(e) => setOdometro(e.target.value)} placeholder={`${veiculo.km.toLocaleString("pt-BR")}`} />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Litros</label>
            <Input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Origem</label>
            <div className="grid grid-cols-2 gap-2">
              {(["base", "externo"] as Origem[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrigem(o)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                    origem === o ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {o === "base" ? "Tanque da Base" : "Posto Externo"}
                </button>
              ))}
            </div>
          </div>

          {origem === "base" ? (
            <div className="col-span-2 flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-[13px] text-info">
              <Info className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
              Este abastecimento reduzirá automaticamente o estoque da base.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fornecedor (posto)</label>
                <Select value={posto} onValueChange={(v) => v && setPosto(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSTOS_EXTERNOS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Valor</label>
                <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Forma de pagamento</label>
                <Select value={formaPagamento} onValueChange={(v) => v && setFormaPagamento(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Opcional"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={registrar} disabled={litrosNum <= 0}>Registrar Abastecimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
