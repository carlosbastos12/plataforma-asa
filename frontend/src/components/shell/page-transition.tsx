"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // Sem max-width aqui de propósito: quem decide a largura máxima do
    // conteúdo é o `<main>` do AppShell. Um max-w-6xl fixo já existiu
    // aqui e anulava silenciosamente qualquer ajuste de largura feito lá
    // (ex.: o respiro extra em telas 2xl) — a tela nunca passava de
    // 72rem por causa deste wrapper, não daquele.
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
