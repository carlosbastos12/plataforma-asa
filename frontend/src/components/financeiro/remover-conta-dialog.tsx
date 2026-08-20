"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { excluirConta, cancelarConta } from "@/lib/financeiro/acoes";
import type { LinhaParcela } from "@/lib/financeiro/tipos";

interface Alvo {
  linha: LinhaParcela;
  /** "remover" apaga de vez (só oferecido sem nenhum pagamento registrado); "cancelar" preserva o histórico. */
  modo: "remover" | "cancelar";
}

interface Props {
  alvo: Alvo | null;
  aoFechar: () => void;
}

export function RemoverContaDialog({ alvo, aoFechar }: Props) {
  const router = useRouter();
  const [processando, iniciar] = useTransition();

  function confirmar() {
    if (!alvo) return;
    iniciar(async () => {
      const acao = alvo.modo === "remover" ? excluirConta : cancelarConta;
      const r = await acao(alvo.linha.conta_id);
      if (!r.ok) {
        toast.error(alvo.modo === "remover" ? "Não foi possível remover." : "Não foi possível cancelar.", {
          description: r.erro,
        });
        return;
      }
      toast.success(alvo.modo === "remover" ? "Conta removida." : "Conta cancelada.", {
        description:
          alvo.modo === "remover"
            ? "A conta e suas parcelas foram apagadas."
            : "A conta fica marcada como cancelada — o histórico continua visível.",
      });
      aoFechar();
      router.refresh();
    });
  }

  const remover = alvo?.modo === "remover";

  return (
    <Dialog open={alvo !== null} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="gap-4 p-6 sm:max-w-md">
        <DialogTitle>{remover ? "Remover conta?" : "Cancelar conta?"}</DialogTitle>
        <DialogDescription>
          {alvo && (
            <>
              <span className="font-medium text-foreground">{alvo.linha.descricao}</span>
              {alvo.linha.parcela_total > 1 && ` — todas as ${alvo.linha.parcela_total} parcelas`}
              {remover ? (
                <>
                  {" "}
                  serão apagadas de vez, junto com as parcelas. Esta conta nunca recebeu pagamento, então nada de
                  histórico se perde — mas a ação não pode ser desfeita.
                </>
              ) : (
                <>
                  {" "}
                  já tem pagamento registrado, então não pode ser apagada sem perder esse histórico. Cancelar marca a
                  conta como <span className="font-medium text-foreground">cancelada</span> — ela some das cobranças
                  pendentes, mas o que já foi pago continua registrado.
                </>
              )}
            </>
          )}
        </DialogDescription>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={aoFechar} disabled={processando}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={processando} className="gap-1.5">
            {processando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : remover ? (
              <Trash2 className="size-4" />
            ) : (
              <Ban className="size-4" />
            )}
            {remover ? "Remover de vez" : "Cancelar conta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
