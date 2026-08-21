/**
 * Deixa o Node resolver `./modulo` como `./modulo.ts`.
 *
 * O TypeScript do projeto usa importação sem extensão (é o padrão do
 * Next.js), mas o Node exige o caminho completo. Este gancho fecha essa
 * diferença **só na execução dos testes** — nada aqui entra na aplicação
 * nem muda como o Next constrói o projeto.
 *
 * Uso: node --import ./scripts/registrar-resolucao-ts.mjs <script>
 */

import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXTENSOES = [".ts", ".tsx", "/index.ts"];

registerHooks({
  resolve(especificador, contexto, proximo) {
    try {
      return proximo(especificador, contexto);
    } catch (erro) {
      if (!especificador.startsWith(".") || !contexto.parentURL) throw erro;

      const base = new URL(especificador, contexto.parentURL).href;
      for (const extensao of EXTENSOES) {
        if (existsSync(fileURLToPath(base + extensao))) {
          return proximo(especificador + extensao, contexto);
        }
      }
      throw erro;
    }
  },
});
