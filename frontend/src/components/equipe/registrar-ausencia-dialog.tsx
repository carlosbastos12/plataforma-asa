"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Stethoscope, UserX, Palmtree, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EQUIPE, TIPO_AUSENCIA_LABEL, type TipoAusencia, type Ausencia } from "@/lib/equipe";
import { TODAY } from "@/lib/mock-data";

function hojeISO() {
  return TODAY.toISOString().slice(0, 10);
}

const CONFIG: Record<TipoAusencia, { rotulo: string; icon: typeof Stethoscope; tooltip: string; toast: string; variant: "default" | "outline" }> = {
  atestado: {
    rotulo: "Registrar Atestado",
    icon: Stethoscope,
    tooltip: "Registra um afastamento médico. O sistema identifica automaticamente que o colaborador ficará indisponível durante o período informado.",
    toast: "Funcionário marcado como indisponível durante o período informado.",
    variant: "default",
  },
  falta: {
    rotulo: "Registrar Falta",
    icon: UserX,
    tooltip: "Registra uma ausência não programada. A equipe operacional será alertada caso a falta afete a escala do dia.",
    toast: "Falta registrada — a equipe foi avisada se isso afeta a escala do dia.",
    variant: "outline",
  },
  ferias: {
    rotulo: "Registrar Férias",
    icon: Palmtree,
    tooltip: "Programa férias do colaborador e bloqueia automaticamente sua participação nas escalas durante o período.",
    toast: "Férias programadas — o colaborador sai da escala automaticamente no período.",
    variant: "outline",
  },
};

/**
 * Um único componente para os três botões de ausência (Atestado/Falta/
 * Férias) — o formulário muda de acordo com o tipo, mas o princípio é o
 * mesmo: registrar uma vez, o sistema calcula sozinho o impacto (P037).
 */
export function RegistrarAusenciaDialog({ tipo, onRegistrar }: { tipo: TipoAusencia; onRegistrar: (a: Ausencia) => void }) {
  const [aberto, setAberto] = useState(false);
  const [colaborador, setColaborador] = useState(EQUIPE[0].nome);
  const [inicio, setInicio] = useState(hojeISO());
  const [fim, setFim] = useState(hojeISO());
  const [cid, setCid] = useState("");
  const [observacao, setObservacao] = useState("");
  const [anexo, setAnexo] = useState(false);
  const proximoId = useRef(119);

  const cfg = CONFIG[tipo];
  const Icon = cfg.icon;

  function registrar() {
    onRegistrar({
      id: `AU-${proximoId.current++}`,
      colaborador,
      tipo,
      dataInicio: inicio,
      dataFim: tipo === "falta" ? inicio : fim,
      motivo: observacao || TIPO_AUSENCIA_LABEL[tipo],
      cid: tipo === "atestado" ? cid || undefined : undefined,
      temAnexo: tipo === "atestado" ? anexo : undefined,
      impactaEscala: true,
    });
    toast.success(`${TIPO_AUSENCIA_LABEL[tipo]} registrado(a)`, { description: cfg.toast });
    setAberto(false);
    setCid("");
    setObservacao("");
    setAnexo(false);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Tooltip>
        <TooltipTrigger render={<Button variant={cfg.variant} className="gap-1.5" onClick={() => setAberto(true)} />}>
          <Icon className="size-4" /> {cfg.rotulo}
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">{cfg.tooltip}</TooltipContent>
      </Tooltip>

      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>{cfg.rotulo}</DialogTitle>
        <DialogDescription>{cfg.tooltip}</DialogDescription>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Funcionário</label>
            <Select value={colaborador} onValueChange={(v) => v && setColaborador(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EQUIPE.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>{c.nome} · {c.funcao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{tipo === "falta" ? "Data" : "Início do período"}</label>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          {tipo !== "falta" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fim do período</label>
              <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          )}

          {tipo === "atestado" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">CID (opcional)</label>
              <Input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="Ex.: M54.5" />
            </div>
          )}

          <div className={tipo === "atestado" ? "col-span-1 flex flex-col gap-1.5" : "col-span-2 flex flex-col gap-1.5"}>
            <label className="text-xs font-medium text-muted-foreground">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Opcional"
            />
          </div>

          {tipo === "atestado" && (
            <button
              type="button"
              onClick={() => setAnexo((v) => !v)}
              className={
                anexo
                  ? "col-span-2 flex items-center gap-2 rounded-lg border border-primary bg-primary-soft px-3 py-2 text-[13px] font-medium text-primary"
                  : "col-span-2 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground"
              }
            >
              <Paperclip className="size-4 shrink-0" />
              {anexo ? "Anexo do atestado adicionado (demonstração)" : "Anexar atestado (demonstração)"}
            </button>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={registrar}>{cfg.rotulo}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
