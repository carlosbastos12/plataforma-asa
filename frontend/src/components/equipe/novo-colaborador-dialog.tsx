"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type Colaborador, type FuncaoColaborador, type StatusColaborador } from "@/lib/equipe";
import { TODAY } from "@/lib/mock-data";

const FUNCOES: FuncaoColaborador[] = ["Motorista", "Operador", "Apoio"];
const EQUIPES: Colaborador["equipe"][] = ["Alfa", "Bravo", "Charlie"];
const STATUS: StatusColaborador[] = ["disponivel", "em_rota", "folga"];
const STATUS_LABEL: Record<StatusColaborador, string> = {
  disponivel: "Disponível",
  em_rota: "Em viagem",
  ausente: "Atestado",
  folga: "Folga",
  ferias: "Férias",
};

function hojeISO() {
  return TODAY.toISOString().slice(0, 10);
}

/**
 * Cadastra um novo colaborador da operação. Após o cadastro ele poderá
 * participar das escalas, registrar ausências e ser vinculado às equipes
 * (P037).
 */
export function NovoColaboradorDialog({ onRegistrar }: { onRegistrar: (c: Colaborador) => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState<FuncaoColaborador>("Motorista");
  const [equipe, setEquipe] = useState<Colaborador["equipe"]>("Alfa");
  const [telefone, setTelefone] = useState("");
  const [cnh, setCnh] = useState("B");
  const [dataAdmissao, setDataAdmissao] = useState(hojeISO());
  const [status, setStatus] = useState<StatusColaborador>("disponivel");
  const proximoId = useRef(11);

  function registrar() {
    onRegistrar({
      id: `C-${proximoId.current++}`,
      nome: nome || "Novo colaborador",
      funcao,
      equipe,
      telefone: telefone || "(85) 99000-0000",
      cnhCategoria: cnh,
      dataAdmissao,
      status,
    });
    toast.success("Colaborador cadastrado.", {
      description: "Ele já pode participar das escalas, registrar ausências e ser vinculado a equipes.",
    });
    setAberto(false);
    setNome("");
    setTelefone("");
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Tooltip>
        <TooltipTrigger render={<Button className="gap-1.5" onClick={() => setAberto(true)} />}>
          <UserPlus className="size-4" /> Novo Colaborador
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          Cadastra um novo colaborador da operação. Após o cadastro ele poderá participar das escalas, registrar
          ausências e ser vinculado às equipes.
        </TooltipContent>
      </Tooltip>

      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>Novo Colaborador</DialogTitle>
        <DialogDescription>Cadastro simples — o essencial para ele já entrar na escala.</DialogDescription>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Função</label>
            <Select value={funcao} onValueChange={(v) => v && setFuncao(v as FuncaoColaborador)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUNCOES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Equipe</label>
            <Select value={equipe} onValueChange={(v) => v && setEquipe(v as Colaborador["equipe"])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EQUIPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Telefone</label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(85) 99000-0000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">CNH — Categoria</label>
            <Input value={cnh} onChange={(e) => setCnh(e.target.value)} placeholder="Ex.: E" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data admissão</label>
            <Input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as StatusColaborador)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button onClick={registrar} disabled={!nome.trim()}>Cadastrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
