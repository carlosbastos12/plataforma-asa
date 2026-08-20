"use client";

import { useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Um assunto explicado dentro da ajuda: o nome do campo/botão como ele
 * aparece na tela, a explicação em linguagem do dia a dia e, quando
 * ajudar mais que a explicação, um exemplo do texto real.
 */
export interface TopicoAjuda {
  titulo: string;
  texto: ReactNode;
  exemplo?: string;
}

interface Props {
  /** Título do pop-up. Normalmente o nome da tela. */
  titulo: string;
  /** Uma frase respondendo "para que serve esta tela?". */
  resumo: string;
  topicos: TopicoAjuda[];
  /** Texto do botão. O padrão serve para quase todo lugar. */
  rotulo?: string;
}

/**
 * Ajuda contextual reutilizável — o botão "Como funciona?".
 *
 * Existe porque a plataforma é usada por quem não é da área técnica: a
 * tela precisa se explicar sozinha, sem manual à parte. Discreto de
 * propósito (botão pequeno, ao lado do título), e some da frente assim
 * que a dúvida é resolvida.
 *
 * É genérico por construção: recebe o conteúdo por propriedade, sem nada
 * amarrado a uma tela específica. Qualquer módulo (Contas a Pagar, Frota,
 * Multas, Combustível, Caixa) pode usar o mesmo componente passando os
 * seus próprios tópicos.
 *
 * Acessibilidade e teclado vêm do `Dialog` já usado no resto do sistema:
 * abre no Enter/Espaço, fecha no Esc, e o foco fica preso no pop-up
 * enquanto ele estiver aberto. Como é um pop-up sobreposto, nada no
 * layout da página se desloca ao abrir.
 */
export function ComoFunciona({ titulo, resumo, topicos, rotulo = "Como funciona?" }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setAberto(true)}
      >
        <CircleHelp className="size-3.5" />
        {rotulo}
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-4 p-6 sm:max-w-xl">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{resumo}</DialogDescription>

          <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-2">
            {topicos.map((t) => (
              <div key={t.titulo} className="rounded-xl border border-border bg-secondary/25 px-3.5 py-3">
                <p className="text-[13px] font-semibold text-foreground">{t.titulo}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{t.texto}</p>
                {t.exemplo && (
                  <p className="mt-2 rounded-lg bg-card px-2.5 py-1.5 text-[12px] text-foreground ring-1 ring-border">
                    Exemplo: <span className="font-medium">{t.exemplo}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
