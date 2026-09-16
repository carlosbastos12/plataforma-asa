"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UNIDADES_MEDIDA, type ItemAlmoxarifado, type UnidadeMedida } from "@/lib/mock-data";

/**
 * Cadastro de peça no Estoque — mesmo padrão dos demais formulários da
 * plataforma (Dialog + estado local). "Salvar peça" só existe na sessão
 * atual (P0xx): não grava em banco, some ao recarregar a página.
 */
export function PecaFormDialog({ onCadastrar }: { onCadastrar: (item: ItemAlmoxarifado) => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidade, setUnidade] = useState<UnidadeMedida>("unidade");
  const [quantidade, setQuantidade] = useState("0");
  const [quantidadeMinima, setQuantidadeMinima] = useState("0");
  const [armario, setArmario] = useState("");
  const [prateleira, setPrateleira] = useState("");
  const [caixa, setCaixa] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const proximoCodigo = useRef(1);

  function reset() {
    setNome("");
    setCodigo("");
    setCategoria("");
    setUnidade("unidade");
    setQuantidade("0");
    setQuantidadeMinima("0");
    setArmario("");
    setPrateleira("");
    setCaixa("");
    setValorUnitario("");
  }

  function salvar() {
    if (!nome.trim()) return;
    const item: ItemAlmoxarifado = {
      id: codigo.trim() || `NOVA-${String(proximoCodigo.current++).padStart(3, "0")}`,
      nome: nome.trim(),
      categoria: categoria.trim() || "Sem categoria",
      unidade,
      quantidade: Number(quantidade) || 0,
      quantidadeMinima: Number(quantidadeMinima) || 0,
      valorUnitario: Number(valorUnitario) || 0,
      armario: armario.trim() || "-",
      prateleira: prateleira.trim() || "-",
      caixa: caixa.trim() || "-",
      localizacaoDescricao: [armario, prateleira, caixa].some(Boolean)
        ? `Armário ${armario || "-"} — ${categoria.trim() || "Estoque"}`
        : "Localização não informada",
    };
    onCadastrar(item);
    toast.success("Peça cadastrada.", {
      description: "Demonstração — fica visível nesta sessão, sem gravar em banco de dados.",
    });
    setAberto(false);
    reset();
  }

  const localizacaoPreview = `${armario || "-"} / ${prateleira || "-"} / ${caixa || "-"}`;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button className="gap-1.5" onClick={() => setAberto(true)}>
        <Plus className="size-4" /> Cadastrar peça
      </Button>

      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>Cadastrar peça</DialogTitle>
        <DialogDescription>Dados da peça, estoque, localização física e custo — tudo num só lugar.</DialogDescription>

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-foreground">Dados da peça</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome da peça *</label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pastilha de freio dianteira" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código/Referência</label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: FRE-003" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Freios" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Unidade de medida</label>
                <Select value={unidade} onValueChange={(v) => v && setUnidade(v as UnidadeMedida)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((u) => (
                      <SelectItem key={u.valor} value={u.valor}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-foreground">Estoque</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Quantidade inicial</label>
                <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Estoque mínimo</label>
                <Input type="number" value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-foreground">Localização física</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Armário</label>
                <Input value={armario} onChange={(e) => setArmario(e.target.value)} placeholder="A1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prateleira</label>
                <Input value={prateleira} onChange={(e) => setPrateleira(e.target.value)} placeholder="P03" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Caixa</label>
                <Input value={caixa} onChange={(e) => setCaixa(e.target.value)} placeholder="C05" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-info-soft px-2.5 py-2 text-xs text-info">
              <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} />
              Localização: {localizacaoPreview}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-semibold text-foreground">Custo</p>
            <label className="text-xs font-medium text-muted-foreground">Custo unitário</label>
            <Input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} placeholder="Ex.: 28,00" />
            <p className="text-xs text-muted-foreground">
              Valor de custo utilizado para calcular o consumo da peça nas manutenções — não é preço de venda.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={!nome.trim()}>Salvar peça</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
