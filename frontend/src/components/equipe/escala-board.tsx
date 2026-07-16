import { PessoaAvatar } from "@/components/pessoa-avatar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { STATUS_COLABORADOR_LABEL, efetivoDisponivel, type CartaoEscala, type Colaborador } from "@/lib/equipe";
import { cn } from "@/lib/utils";

const STATUS_CLASSE: Record<Colaborador["status"], string> = {
  disponivel: "bg-success-soft text-success",
  em_rota: "bg-info-soft text-info",
  ausente: "bg-destructive-soft text-destructive",
  folga: "bg-muted text-muted-foreground",
  ferias: "bg-warning-soft text-warning",
};

/**
 * O quadro do dia: uma coluna por turno, um cartão por equipe, cada membro
 * com seu status — quem está trabalhando, quem falta, quem pode ser
 * chamado, tudo numa olhada (P037).
 */
export function EscalaBoard({ cartoes, onSelecionar }: { cartoes: CartaoEscala[]; onSelecionar: (c: Colaborador) => void }) {
  return (
    <Panel>
      <PanelHeader title="Escala Operacional" subtitle="Equipe Manhã · Equipe Tarde · Equipe Noite" />
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
        {cartoes.map((cartao) => {
          const efetivo = efetivoDisponivel(cartao);
          return (
            <div key={cartao.equipe} className="rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                <div>
                  <p className="text-[13px] font-bold text-foreground">Equipe {cartao.equipe}</p>
                  <p className="text-[11px] text-muted-foreground">Turno da {cartao.turno}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    efetivo <= 1 ? "bg-destructive-soft text-destructive" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {efetivo} disponível
                </span>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {cartao.membros.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => onSelecionar(m)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-secondary/50"
                    >
                      <PessoaAvatar nome={m.nome} papel={m.funcao} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{m.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{m.funcao}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_CLASSE[m.status])}>
                        {STATUS_COLABORADOR_LABEL[m.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
