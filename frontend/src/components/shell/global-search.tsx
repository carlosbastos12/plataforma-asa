"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Truck, Radio } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { FROTA, CHAMADOS_ATIVOS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Resultado {
  tipo: "veiculo" | "chamado";
  titulo: string;
  subtitulo: string;
  href: string;
}

// Pequeno atraso simulado — sem isso, a busca "acerta rápido demais" e não
// parece estar consultando nada de verdade. 220ms é suficiente para dar a
// sensação de consulta sem incomodar quem está digitando. `debouncedQuery`
// só é atualizado dentro do setTimeout (nunca de forma síncrona no efeito),
// e `buscando` é derivado da comparação entre os dois — não é estado
// próprio, evitando setState direto no corpo do efeito.
const ATRASO_SIMULADO_MS = 220;

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), query.trim() ? ATRASO_SIMULADO_MS : 0);
    return () => clearTimeout(t);
  }, [query]);

  // Atalho "/" foca a busca de qualquer lugar — padrão de produto rápido.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.tagName === "INPUT" || alvo?.tagName === "TEXTAREA" || alvo?.isContentEditable;
      if (e.key === "/" && !digitando) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const buscando = query.trim() !== "" && debouncedQuery !== query;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const resultados = useMemo<Resultado[]>(() => {
    const termo = debouncedQuery.trim().toLowerCase();
    if (!termo) return [];

    const veiculos: Resultado[] = FROTA.filter(
      (v) => v.placa.toLowerCase().includes(termo) || v.motorista.toLowerCase().includes(termo)
    ).map((v) => ({
      tipo: "veiculo",
      titulo: v.placa,
      subtitulo: `${v.modelo} · ${v.motorista}`,
      href: `/gestao-da-frota/veiculos/${v.placa}`,
    }));

    const chamados: Resultado[] = CHAMADOS_ATIVOS.filter(
      (c) => c.id.toLowerCase().includes(termo) || c.cliente.toLowerCase().includes(termo)
    ).map((c) => ({
      tipo: "chamado",
      titulo: c.id,
      subtitulo: `${c.tipoServico} · ${c.cliente}`,
      href: "/acionamento",
    }));

    return [...veiculos, ...chamados].slice(0, 6);
  }, [debouncedQuery]);

  function irPara(href: string) {
    router.push(href);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-xs md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar placa, motorista ou chamado..."
        className="h-9 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-card px-1.5 font-mono text-[11px] text-muted-foreground lg:block">
        /
      </kbd>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-11 left-0 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {buscando ? (
              <div className="flex flex-col gap-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : resultados.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nada encontrado para &quot;{query}&quot;.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {resultados.map((r) => (
                  <li key={r.tipo + r.titulo}>
                    <button
                      onClick={() => irPara(r.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/50"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          r.tipo === "veiculo" ? "bg-primary/12 text-primary" : "bg-[var(--chart-3)]/15 text-[var(--chart-3)]"
                        )}
                      >
                        {r.tipo === "veiculo" ? <Truck className="size-4" /> : <Radio className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{r.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.subtitulo}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
