"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Wrench, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FROTA,
  TODAY,
  ALMOXARIFADO,
  formatarMoeda,
  localizacaoCompacta,
  type Manutencao,
  type PecaManutencao,
  type ServicoManutencao,
  type OrigemPeca,
  type OrigemServico,
  type TipoManutencao,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function hojeISO() {
  return TODAY.toISOString().slice(0, 10);
}

function totalPecasLocal(pecas: PecaManutencao[]): number {
  return pecas.reduce((s, p) => s + p.qtd * p.valorUnitario, 0);
}

function totalServicosLocal(servicos: ServicoManutencao[]): number {
  return servicos.filter((s) => s.origem === "terceirizada").reduce((s, sv) => s + sv.valor, 0);
}

export function ManutencaoFormDialog({ onRegistrar }: { onRegistrar: (m: Manutencao) => void }) {
  const [aberto, setAberto] = useState(false);
  const [placa, setPlaca] = useState(FROTA[0].placa);
  const [data, setData] = useState(hojeISO());
  const [km, setKm] = useState(String(FROTA[0].km));
  const [tipo, setTipo] = useState<TipoManutencao>("preventiva");
  const [descricao, setDescricao] = useState("");
  const [pecas, setPecas] = useState<PecaManutencao[]>([]);
  const [servicos, setServicos] = useState<ServicoManutencao[]>([]);
  const proximoId = useRef(10);

  // sub-formulário: peça
  const [formPecaAberto, setFormPecaAberto] = useState(false);
  const [origemPeca, setOrigemPeca] = useState<OrigemPeca>("estoque_proprio");
  const [itemEstoqueId, setItemEstoqueId] = useState(ALMOXARIFADO[0].id);
  const [qtdPeca, setQtdPeca] = useState("1");
  const [nomePecaCompra, setNomePecaCompra] = useState("");
  const [codigoPecaCompra, setCodigoPecaCompra] = useState("");
  const [valorPecaCompra, setValorPecaCompra] = useState("");
  const [fornecedorPecaCompra, setFornecedorPecaCompra] = useState("");
  const [obsPecaCompra, setObsPecaCompra] = useState("");

  // sub-formulário: serviço
  const [formServicoAberto, setFormServicoAberto] = useState(false);
  const [descricaoServico, setDescricaoServico] = useState("");
  const [origemServico, setOrigemServico] = useState<OrigemServico>("propria");
  const [prestadorServico, setPrestadorServico] = useState("");
  const [valorServico, setValorServico] = useState("");

  const itemSelecionado = ALMOXARIFADO.find((i) => i.id === itemEstoqueId) ?? ALMOXARIFADO[0];
  const qtdPecaNum = Number(qtdPeca) || 0;

  function adicionarPeca() {
    if (origemPeca === "estoque_proprio") {
      if (qtdPecaNum <= 0) return;
      setPecas((atual) => [
        ...atual,
        {
          nome: itemSelecionado.nome,
          codigo: itemSelecionado.id,
          qtd: qtdPecaNum,
          valorUnitario: itemSelecionado.valorUnitario,
          origem: "estoque_proprio",
        },
      ]);
    } else {
      if (!nomePecaCompra.trim() || qtdPecaNum <= 0) return;
      setPecas((atual) => [
        ...atual,
        {
          nome: nomePecaCompra,
          codigo: codigoPecaCompra || undefined,
          qtd: qtdPecaNum,
          valorUnitario: Number(valorPecaCompra) || 0,
          origem: "compra_manutencao",
          fornecedor: fornecedorPecaCompra || undefined,
          observacao: obsPecaCompra || undefined,
        },
      ]);
    }
    setQtdPeca("1");
    setNomePecaCompra("");
    setCodigoPecaCompra("");
    setValorPecaCompra("");
    setFornecedorPecaCompra("");
    setObsPecaCompra("");
    setFormPecaAberto(false);
  }

  function adicionarServico() {
    if (!descricaoServico.trim()) return;
    setServicos((atual) => [
      ...atual,
      {
        descricao: descricaoServico,
        origem: origemServico,
        valor: origemServico === "propria" ? 0 : Number(valorServico) || 0,
        prestador: origemServico === "terceirizada" ? prestadorServico || undefined : undefined,
      },
    ]);
    setDescricaoServico("");
    setPrestadorServico("");
    setValorServico("");
    setOrigemServico("propria");
    setFormServicoAberto(false);
  }

  function salvar() {
    const nova: Manutencao = {
      id: `MN-${String(proximoId.current++).padStart(3, "0")}`,
      placa,
      data,
      km: Number(km) || 0,
      tipo,
      descricao: descricao.trim() || (tipo === "preventiva" ? "Manutenção preventiva" : "Manutenção corretiva"),
      status: "concluida",
      pecas,
      servicos,
    };
    onRegistrar(nova);
    toast.success("Manutenção registrada.", {
      description: "Demonstração — fica visível nesta sessão, sem gravar em banco de dados.",
    });
    setAberto(false);
    setDescricao("");
    setPecas([]);
    setServicos([]);
  }

  const totalGeral = totalPecasLocal(pecas) + totalServicosLocal(servicos);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button className="gap-1.5" onClick={() => setAberto(true)}>
        <Plus className="size-4" /> Adicionar manutenção
      </Button>

      <DialogContent className="gap-4 p-6 sm:max-w-xl">
        <DialogTitle>Nova manutenção</DialogTitle>
        <DialogDescription>
          Veículo → peças utilizadas + serviços realizados → total da manutenção.
        </DialogDescription>

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Veículo</label>
              <Select
                value={placa}
                onValueChange={(v) => {
                  if (!v) return;
                  setPlaca(v);
                  const veiculo = FROTA.find((f) => f.placa === v);
                  if (veiculo) setKm(String(veiculo.km));
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FROTA.map((v) => (
                    <SelectItem key={v.placa} value={v.placa}>{v.placa} · {v.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quilometragem</label>
              <Input type="number" value={km} onChange={(e) => setKm(e.target.value)} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(["preventiva", "corretiva"] as TipoManutencao[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                      tipo === t ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "preventiva" ? "Preventiva" : "Corretiva"}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição / observação</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Ex.: revisão de 80.000 km, ruído na frenagem…"
              />
            </div>
          </div>

          {/* Peças utilizadas */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-foreground">Peças utilizadas</p>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setFormPecaAberto((v) => !v)}>
                <Plus className="size-3.5" /> Adicionar peça
              </Button>
            </div>

            {pecas.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {pecas.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">{p.qtd}x {p.nome}</span>{" "}
                      <span className="text-muted-foreground">
                        · {p.origem === "estoque_proprio" ? "Estoque próprio" : "Compra"} · {formatarMoeda(p.valorUnitario)}/un.
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatarMoeda(p.qtd * p.valorUnitario)}</span>
                    <button type="button" onClick={() => setPecas((atual) => atual.filter((_, idx) => idx !== i))} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {formPecaAberto && (
              <div className="flex flex-col gap-2.5 rounded-lg bg-secondary/30 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {(["estoque_proprio", "compra_manutencao"] as OrigemPeca[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOrigemPeca(o)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        origemPeca === o ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o === "estoque_proprio" ? "Estoque próprio" : "Compra para esta manutenção"}
                    </button>
                  ))}
                </div>

                {origemPeca === "estoque_proprio" ? (
                  <>
                    <Select value={itemEstoqueId} onValueChange={(v) => v && setItemEstoqueId(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALMOXARIFADO.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.nome} — {i.id} — {i.quantidade} un. disponíveis
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-[13px]">
                      <p className="font-medium text-foreground">
                        {itemSelecionado.nome} <span className="font-normal text-muted-foreground">— {itemSelecionado.id}</span>
                      </p>
                      <div className="mt-1.5 flex flex-col gap-0.5 text-muted-foreground">
                        <span>Estoque disponível: {itemSelecionado.quantidade} un.</span>
                        <span>Localização: {localizacaoCompacta(itemSelecionado)}</span>
                        <span>Custo unitário: {formatarMoeda(itemSelecionado.valorUnitario)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Quantidade utilizada</label>
                      <Input type="number" value={qtdPeca} onChange={(e) => setQtdPeca(e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-info-soft px-2.5 py-2 text-xs text-info">
                      <Info className="size-3.5 shrink-0" strokeWidth={2.25} />
                      Estoque antes: {itemSelecionado.quantidade} un. · Utilização: {qtdPecaNum} un. · Estoque após:{" "}
                      {Math.max(itemSelecionado.quantidade - qtdPecaNum, 0)} un. (conceitual)
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="font-semibold tabular-nums text-foreground">{formatarMoeda(qtdPecaNum * itemSelecionado.valorUnitario)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Nome da peça</label>
                        <Input value={nomePecaCompra} onChange={(e) => setNomePecaCompra(e.target.value)} placeholder="Ex.: Correia do alternador" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Referência/código (opcional)</label>
                        <Input value={codigoPecaCompra} onChange={(e) => setCodigoPecaCompra(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                        <Input type="number" value={qtdPeca} onChange={(e) => setQtdPeca(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Custo unitário</label>
                        <Input type="number" value={valorPecaCompra} onChange={(e) => setValorPecaCompra(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Fornecedor (opcional)</label>
                        <Input value={fornecedorPecaCompra} onChange={(e) => setFornecedorPecaCompra(e.target.value)} />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Observação (opcional)</label>
                        <Input value={obsPecaCompra} onChange={(e) => setObsPecaCompra(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatarMoeda((Number(valorPecaCompra) || 0) * qtdPecaNum)}
                      </span>
                    </div>
                  </>
                )}

                <Button type="button" size="sm" onClick={adicionarPeca}>Adicionar à manutenção</Button>
              </div>
            )}
          </div>

          {/* Serviços realizados */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-foreground">Serviços realizados</p>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setFormServicoAberto((v) => !v)}>
                <Plus className="size-3.5" /> Adicionar serviço
              </Button>
            </div>

            {servicos.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {servicos.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">{s.descricao}</span>{" "}
                      <span className="text-muted-foreground">
                        · {s.origem === "propria" ? "Serviço próprio" : `Terceirizado${s.prestador ? ` — ${s.prestador}` : ""}`}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatarMoeda(s.valor)}</span>
                    <button type="button" onClick={() => setServicos((atual) => atual.filter((_, idx) => idx !== i))} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {formServicoAberto && (
              <div className="flex flex-col gap-2.5 rounded-lg bg-secondary/30 p-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                  <Input value={descricaoServico} onChange={(e) => setDescricaoServico(e.target.value)} placeholder="Ex.: Troca de óleo" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["propria", "terceirizada"] as OrigemServico[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOrigemServico(o)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        origemServico === o ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o === "propria" ? "Serviço próprio" : "Serviço terceirizado"}
                    </button>
                  ))}
                </div>
                {origemServico === "propria" ? (
                  <div className="flex items-center gap-2 rounded-lg bg-info-soft px-2.5 py-2 text-xs text-info">
                    <Info className="size-3.5 shrink-0" strokeWidth={2.25} />
                    A ASA tem equipe mecânica própria — serviço próprio não entra como custo financeiro (R$ 0,00).
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Prestador</label>
                      <Input value={prestadorServico} onChange={(e) => setPrestadorServico(e.target.value)} placeholder="Ex.: Oficina Torque Certo" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Valor</label>
                      <Input type="number" value={valorServico} onChange={(e) => setValorServico(e.target.value)} />
                    </div>
                  </div>
                )}
                <Button type="button" size="sm" onClick={adicionarServico}>Adicionar à manutenção</Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Total da manutenção</p>
            <p className="text-base font-bold tabular-nums text-foreground">{formatarMoeda(totalGeral)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={salvar} className="gap-1.5"><Wrench className="size-4" /> Salvar manutenção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
