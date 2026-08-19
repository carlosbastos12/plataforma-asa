"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { registrarPagamento } from "@/lib/financeiro/acoes";
import { calcularValorPago, formatarMoeda, hojeISO } from "@/lib/financeiro/formato";
import { FORMAS_PAGAMENTO, type Banco, type LinhaParcela } from "@/lib/financeiro/tipos";

interface Props {
  parcela: LinhaParcela | null;
  bancos: Banco[];
  aoFechar: () => void;
}

export function RegistrarPagamentoDialog({ parcela, bancos, aoFechar }: Props) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();

  const saldo = parcela ? Math.max(parcela.parcela_valor - parcela.total_pago, 0) : 0;

  const [dataPagamento, setDataPagamento] = useState(hojeISO());
  const [valorInicial, setValorInicial] = useState("");
  const [juros, setJuros] = useState("");
  const [multa, setMulta] = useState("");
  const [desconto, setDesconto] = useState("");
  const [bancoId, setBancoId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const n = (v: string) => Number(v.replace(",", ".")) || 0;
  const base = valorInicial === "" ? saldo : n(valorInicial);
  const valorPago = calcularValorPago(base, n(juros), n(multa), n(desconto));

  const emAtraso = (parcela?.dias_em_atraso ?? 0) > 0;

  function limpar() {
    setDataPagamento(hojeISO());
    setValorInicial("");
    setJuros("");
    setMulta("");
    setDesconto("");
    setBancoId("");
    setFormaPagamento("");
    setObservacoes("");
  }

  function salvar() {
    if (!parcela) return;
    iniciar(async () => {
      const r = await registrarPagamento({
        parcelaId: parcela.parcela_id,
        dataPagamento,
        valorInicial: base,
        juros: n(juros),
        multa: n(multa),
        desconto: n(desconto),
        bancoId,
        formaPagamento,
        observacoes,
      });
      if (!r.ok) {
        toast.error("Não foi possível registrar o pagamento.", { description: r.erro });
        return;
      }
      toast.success("Pagamento registrado.", {
        description: `${formatarMoeda(valorPago)} baixados. A conta já aparece atualizada nos relatórios.`,
      });
      limpar();
      aoFechar();
      router.refresh();
    });
  }

  const rotuloCampo = "text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={parcela !== null} onOpenChange={(v) => !v && (limpar(), aoFechar())}>
      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto p-6 sm:max-w-lg">
        <DialogTitle>Registrar pagamento</DialogTitle>
        <DialogDescription>
          {parcela
            ? `${parcela.descricao} · parcela ${parcela.parcela_numero}/${parcela.parcela_total}`
            : ""}
        </DialogDescription>

        {parcela && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saldo a pagar</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatarMoeda(saldo)}</p>
              </div>
              {emAtraso && (
                <span className="rounded-full bg-destructive-soft px-2.5 py-1 text-xs font-medium text-destructive">
                  {parcela.dias_em_atraso} dia(s) em atraso
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Data do pagamento *</label>
                <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Valor inicial (R$)</label>
                <Input
                  inputMode="decimal"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  placeholder={saldo.toFixed(2)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Juros (R$)</label>
                <Input inputMode="decimal" value={juros} onChange={(e) => setJuros(e.target.value)} placeholder="0,00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Multa (R$)</label>
                <Input inputMode="decimal" value={multa} onChange={(e) => setMulta(e.target.value)} placeholder="0,00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Desconto (R$)</label>
                <Input inputMode="decimal" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0,00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Banco</label>
                <Select value={bancoId} onValueChange={(v) => setBancoId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="De onde saiu">
                      {() => bancos.find((b) => b.id === bancoId)?.nome ?? "De onde saiu"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Forma de pagamento</label>
                <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Como foi pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={rotuloCampo}>Observações</label>
                <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            {/* A fórmula do cliente, visível enquanto digita. */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/6 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Valor pago</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  valor + juros + multa − desconto
                </p>
              </div>
              <p className="shrink-0 text-xl font-extrabold text-foreground tabular-nums">{formatarMoeda(valorPago)}</p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => (limpar(), aoFechar())} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando} className="gap-1.5">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <CircleCheckBig className="size-4" />}
                Registrar pagamento
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
