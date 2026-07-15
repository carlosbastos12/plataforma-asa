"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Radio,
  Truck,
  Landmark,
  LayoutGrid,
  CircleCheckBig,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * "Conheça a Plataforma ASA" — apresentação em etapas na primeira visita,
 * reabrível a qualquer momento pelo topo. A plataforma se apresenta antes
 * de pedir qualquer coisa: o que cada setor faz, o problema que resolve e
 * o benefício que entrega — só então o usuário entra.
 */

const STORAGE_KEY = "asa-apresentacao-v1";

const ApresentacaoContext = createContext<{ abrir: () => void }>({ abrir: () => {} });

export function useApresentacao() {
  return useContext(ApresentacaoContext);
}

interface Setor {
  icon: LucideIcon;
  nome: string;
  oQueFaz: string;
  beneficio: string;
}

const SETORES: Setor[] = [
  {
    icon: Radio,
    nome: "Acionamento",
    oQueFaz: "Recebe cada chamado, mostra quem espera há mais tempo e despacha o motorista certo.",
    beneficio: "O cliente passa menos tempo parado na estrada — e ninguém fica esquecido na fila.",
  },
  {
    icon: Truck,
    nome: "Gestão da Frota",
    oQueFaz: "Acompanha veículos, documentos e multas, com todos os prazos em contagem regressiva.",
    beneficio: "Nenhum documento vence sem aviso e nenhuma multa dobra de valor por esquecimento.",
  },
  {
    icon: Landmark,
    nome: "Fechamento",
    oQueFaz: "Confere o caixa de cada dia e mostra exatamente o que falta para concluir.",
    beneficio: "O dia termina conferido — e o fim do mês chega sem surpresa acumulada.",
  },
];

const TRABALHA_ANTES = [
  "Prazos entram em contagem regressiva antes de vencer — o aviso chega a tempo de agir.",
  "Cada veículo tem um veredicto claro: pode operar hoje? Se não, o que o libera.",
  "Todo botão explica o que faz e o que evita — nada exige treinamento.",
  "A busca no topo encontra qualquer placa, motorista ou chamado em segundos.",
];

const AO_ENTRAR = [
  "Ver primeiro o que precisa de decisão — o resto fica sob controle",
  "Resolver cada pendência com uma ação direta",
  "Encerrar o dia com o caixa conferido e a frota pronta para amanhã",
];

const TITULOS = [
  "Bem-vindo à Plataforma do ASA Reboques",
  "O caminho de um atendimento",
  "O sistema trabalha antes de você",
  "Pronto para começar",
];

function Pontos({ etapa }: { etapa: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {TITULOS.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === etapa ? "w-6 bg-primary" : i < etapa ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"
          )}
        />
      ))}
    </div>
  );
}

function ConteudoEtapa({ etapa }: { etapa: number }) {
  // O componente é montado com `key={etapa}` — trocar de etapa zera a seleção
  // sem precisar de efeito.
  const [setorAtivo, setSetorAtivo] = useState<string | null>(null);

  if (etapa === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Uma plataforma feita sob medida para a operação do ASA Reboques: o acionamento, a frota e o
          fechamento do dia, finalmente no mesmo lugar.
        </p>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm font-medium text-foreground">
          <span>Menos retrabalho.</span>
          <span>Nada vence sem aviso.</span>
          <span>Decisões prontas — não relatórios para decifrar.</span>
        </div>
      </div>
    );
  }

  if (etapa === 1) {
    const ativo = SETORES.find((s) => s.nome === setorAtivo);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Todo atendimento percorre três setores. Toque em cada um para ver o que ele resolve:
        </p>
        <div className="flex flex-wrap gap-2">
          {SETORES.map((s) => (
            <button
              key={s.nome}
              onClick={() => setSetorAtivo(setorAtivo === s.nome ? null : s.nome)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                setorAtivo === s.nome
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              <s.icon className="size-3.5" strokeWidth={2.25} />
              {s.nome}
            </button>
          ))}
        </div>
        {ativo ? (
          <motion.div
            key={ativo.nome}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-sm text-foreground">{ativo.oQueFaz}</p>
            <p className="mt-1.5 text-[13px] font-medium text-primary">{ativo.beneficio}</p>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] text-muted-foreground">
            Escolha um setor acima para conhecê-lo.
          </div>
        )}
        <div className="flex justify-center text-muted-foreground/50" aria-hidden>
          <ArrowDown className="size-4" />
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <LayoutGrid className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.25} />
          <p className="text-[13px] leading-relaxed text-foreground">
            <span className="font-semibold">A Central de Operações reúne os três.</span>{" "}
            Ao abrir a plataforma, você já sabe como está a operação — sem percorrer tela por tela.
          </p>
        </div>
      </div>
    );
  }

  if (etapa === 2) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Você não precisa procurar problema: quando algo pede atenção, a plataforma avisa primeiro.
        </p>
        <ul className="flex flex-col gap-2.5">
          {TRABALHA_ANTES.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
              <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        A partir de agora, o seu dia na plataforma é assim:
      </p>
      <ul className="flex flex-col gap-2.5">
        {AO_ENTRAR.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
            <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium text-foreground">
        Qualquer dúvida no caminho, o botão de ajuda no topo reabre esta apresentação.
      </p>
    </div>
  );
}

export function ApresentacaoProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const tentouAutoAbrir = useRef(false);

  useEffect(() => {
    if (tentouAutoAbrir.current) return;
    tentouAutoAbrir.current = true;
    let jaViu = false;
    try {
      jaViu = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage indisponível — apresenta mesmo assim
    }
    if (!jaViu) {
      const t = setTimeout(() => setAberto(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  function abrir() {
    setEtapa(0);
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sem persistência — a apresentação volta na próxima visita
    }
  }

  const ultima = etapa === TITULOS.length - 1;

  return (
    <ApresentacaoContext.Provider value={{ abrir }}>
      {children}
      <Dialog open={aberto} onOpenChange={(open) => (open ? setAberto(true) : fechar())}>
        <DialogContent className="gap-5 p-6 sm:max-w-md" showCloseButton={false}>
          <div className="flex items-center justify-between gap-3">
            <Pontos etapa={etapa} />
            <button
              onClick={fechar}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pular apresentação
            </button>
          </div>

          <DialogTitle className="text-lg font-semibold tracking-tight">{TITULOS[etapa]}</DialogTitle>

          <ConteudoEtapa key={etapa} etapa={etapa} />

          <div className="flex items-center justify-between gap-2 pt-1">
            {etapa > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setEtapa((e) => e - 1)}>
                Voltar
              </Button>
            ) : (
              <span />
            )}
            {ultima ? (
              <Button size="sm" className="flex-1" onClick={fechar}>
                Entrar na Plataforma
              </Button>
            ) : (
              <Button size="sm" onClick={() => setEtapa((e) => e + 1)}>
                {etapa === 0 ? "Conhecer a plataforma" : "Avançar"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ApresentacaoContext.Provider>
  );
}
