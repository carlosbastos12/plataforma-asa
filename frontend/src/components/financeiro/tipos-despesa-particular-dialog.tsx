"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, ListTree, Loader2, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  criarTipoDespesaParticular,
  atualizarTipoDespesaParticular,
  excluirTipoDespesaParticular,
} from "@/lib/financeiro/acoes";
import type { TipoDespesaParticular } from "@/lib/financeiro/tipos";
import { cn } from "@/lib/utils";

interface Props {
  tipos: TipoDespesaParticular[];
  /** Texto do botão-gatilho — muda conforme onde o diálogo é aberto (cabeçalho da lista vs. dentro do cadastro de conta). */
  rotulo?: string;
}

/** Sugestões prontas para o primeiro uso — um clique cadastra, nada é criado sem ação da pessoa. */
const SUGESTOES = ["Água", "Energia", "Aluguel", "Internet", "Escola", "Cartão", "Outros"];

export function TiposDespesaParticularDialog({ tipos, rotulo = "Meus tipos de despesa" }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const nomesExistentes = new Set(tipos.map((t) => t.nome.toLowerCase()));
  const sugestoesDisponiveis = SUGESTOES.filter((s) => !nomesExistentes.has(s.toLowerCase()));

  function criar(nome: string) {
    const alvo = nome.trim();
    if (!alvo) return;
    iniciar(async () => {
      const r = await criarTipoDespesaParticular(alvo);
      if (!r.ok) {
        toast.error("Não foi possível cadastrar.", { description: r.erro });
        return;
      }
      toast.success(`"${alvo}" cadastrado.`);
      setNovoNome("");
      router.refresh();
    });
  }

  function salvarEdicao(id: string) {
    const alvo = nomeEditado.trim();
    if (!alvo) return;
    iniciar(async () => {
      const r = await atualizarTipoDespesaParticular(id, { nome: alvo });
      if (!r.ok) {
        toast.error("Não foi possível renomear.", { description: r.erro });
        return;
      }
      setEditandoId(null);
      router.refresh();
    });
  }

  function alternarAtivo(t: TipoDespesaParticular) {
    iniciar(async () => {
      const r = await atualizarTipoDespesaParticular(t.id, { ativo: !t.ativo });
      if (!r.ok) {
        toast.error("Não foi possível atualizar.", { description: r.erro });
        return;
      }
      router.refresh();
    });
  }

  function excluir(t: TipoDespesaParticular) {
    if (confirmandoExclusaoId !== t.id) {
      // Primeiro clique só arma a confirmação — excluir é definitivo,
      // diferente de desativar, então não pode disparar num único clique.
      setConfirmandoExclusaoId(t.id);
      return;
    }
    iniciar(async () => {
      const r = await excluirTipoDespesaParticular(t.id);
      setConfirmandoExclusaoId(null);
      if (!r.ok) {
        toast.error("Não foi possível excluir.", { description: r.erro });
        return;
      }
      toast.success(`"${t.nome}" excluído.`);
      router.refresh();
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setAberto(true)}>
        <ListTree className="size-3.5" /> {rotulo}
      </Button>

      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto p-6 sm:max-w-md">
        <DialogTitle>Meus tipos de despesa particular</DialogTitle>
        <DialogDescription>
          Sua própria lista, separada da classificação contábil da empresa — só você enxerga e altera estes tipos.
        </DialogDescription>

        <div className="flex gap-2">
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                criar(novoNome);
              }
            }}
            placeholder="Ex.: Plano de saúde"
            className="h-9"
          />
          <Button size="sm" className="h-9 shrink-0 gap-1.5" disabled={pendente || !novoNome.trim()} onClick={() => criar(novoNome)}>
            {pendente ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar
          </Button>
        </div>

        {sugestoesDisponiveis.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sugestoesDisponiveis.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pendente}
                onClick={() => criar(s)}
                className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {tipos.length === 0 ? (
            <p className="rounded-lg bg-secondary/40 px-3 py-4 text-center text-[12.5px] text-muted-foreground">
              Nenhum tipo cadastrado ainda. Use as sugestões acima ou digite o seu.
            </p>
          ) : (
            tipos.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border px-2.5 py-2",
                  !t.ativo && "opacity-50"
                )}
              >
                {editandoId === t.id ? (
                  <>
                    <Input
                      autoFocus
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && salvarEdicao(t.id)}
                      className="h-8 flex-1"
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2" disabled={pendente} onClick={() => salvarEdicao(t.id)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {t.nome}
                      {confirmandoExclusaoId === t.id && (
                        <span className="ml-2 text-[11px] font-medium text-destructive">Clique de novo para excluir</span>
                      )}
                    </span>
                    {!t.ativo && <span className="text-[11px] text-muted-foreground">inativo</span>}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Renomear ${t.nome}`}
                      onClick={() => {
                        setEditandoId(t.id);
                        setNomeEditado(t.nome);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={t.ativo ? `Desativar ${t.nome}` : `Reativar ${t.nome}`}
                      disabled={pendente}
                      onClick={() => alternarAtivo(t)}
                    >
                      {t.ativo ? <EyeOff className="size-3.5" /> : <Undo2 className="size-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn("size-7", confirmandoExclusaoId === t.id && "text-destructive")}
                      aria-label={confirmandoExclusaoId === t.id ? `Confirmar exclusão de ${t.nome}` : `Excluir ${t.nome}`}
                      disabled={pendente}
                      onClick={() => excluir(t)}
                      onBlur={() => setConfirmandoExclusaoId((atual) => (atual === t.id ? null : atual))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Desativar tira o tipo da lista de novas contas, sem apagar o histórico das contas já cadastradas com ele.
          Excluir remove de vez — as contas antigas continuam existindo, só perdem essa etiqueta.
        </p>
      </DialogContent>
    </Dialog>
  );
}
