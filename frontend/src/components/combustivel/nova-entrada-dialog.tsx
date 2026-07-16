"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FORNECEDORES_DIESEL, TIPO_ENTRADA_LABEL, type TipoEntrada, type MovimentacaoTanque } from "@/lib/combustivel";
import { TODAY } from "@/lib/mock-data";

function hojeISO() {
  return TODAY.toISOString().slice(0, 10);
}

/**
 * Registra a entrada de combustível na base — a partir desse lançamento o
 * sistema atualiza automaticamente o estoque disponível para abastecimentos
 * internos (P036).
 */
export function NovaEntradaDialog({ onRegistrar }: { onRegistrar: (m: MovimentacaoTanque) => void }) {
  const [aberto, setAberto] = useState(false);
  const [fornecedor, setFornecedor] = useState(FORNECEDORES_DIESEL[0]);
  const [notaFiscal, setNotaFiscal] = useState("");
  const [data, setData] = useState(hojeISO());
  const [litros, setLitros] = useState("2000");
  const [valorTotal, setValorTotal] = useState("12300");
  const [tipo, setTipo] = useState<TipoEntrada>("compra");
  const [observacoes, setObservacoes] = useState("");

  const litrosNum = Number(litros) || 0;
  const valorNum = Number(valorTotal) || 0;
  const valorPorLitro = litrosNum > 0 ? valorNum / litrosNum : 0;

  function registrar() {
    onRegistrar({
      data,
      hora: "09:00",
      tipo: "entrada",
      litros: litrosNum,
      descricao: `Recebimento de carga — NF ${notaFiscal || "s/n"}`,
      responsavel: fornecedor,
      fornecedor,
      notaFiscal,
      tipoEntrada: tipo,
    });
    toast.success("Entrada registrada.", {
      description: "O estoque disponível foi atualizado automaticamente.",
    });
    setAberto(false);
    setNotaFiscal("");
    setObservacoes("");
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Tooltip>
        <TooltipTrigger render={<Button className="gap-1.5" onClick={() => setAberto(true)} />}>
          <Plus className="size-4" /> Registrar Entrada de Combustível
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          Registra a entrada de combustível na base. A partir desse lançamento o sistema atualiza automaticamente o
          estoque disponível para abastecimentos internos.
        </TooltipContent>
      </Tooltip>

      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>Nova Entrada de Combustível</DialogTitle>
        <DialogDescription>
          Toda compra, complemento ou ajuste de estoque começa aqui — o saldo da base é recalculado na hora.
        </DialogDescription>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
            <Select value={fornecedor} onValueChange={(v) => v && setFornecedor(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORNECEDORES_DIESEL.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Número da Nota Fiscal</label>
            <Input value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} placeholder="Ex.: 18421" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Quantidade (litros)</label>
            <Input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Valor total</label>
            <Input type="number" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-[13px] text-muted-foreground">
            Valor por litro
            <strong className="text-foreground">{valorPorLitro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v as TipoEntrada)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_ENTRADA_LABEL) as TipoEntrada[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_ENTRADA_LABEL[t]}</SelectItem>
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={registrar} disabled={litrosNum <= 0}>Registrar Entrada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
