import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "@/lib/supabase/config";

/** Rotas da Central Financeira — exigem sessão. O resto da plataforma segue aberto. */
const ROTAS_PROTEGIDAS = ["/financeiro"];

/**
 * Proxy (antigo middleware, renomeado no Next.js 16).
 *
 * Faz duas coisas: renova o cookie de sessão do Supabase a cada requisição
 * e aplica uma checagem otimista de acesso. **Não é a fronteira de
 * segurança** — quem garante que ninguém lê dado alheio é o RLS no banco,
 * como recomenda a própria documentação do Next.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  // Sem banco configurado não há sessão para renovar: deixa passar e a
  // própria tela explica o que falta configurar.
  if (!SUPABASE_CONFIGURADO) return resposta;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesParaGravar) => {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const exigeSessao = ROTAS_PROTEGIDAS.some((r) => caminho.startsWith(r));

  if (exigeSessao && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (caminho === "/login" && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/financeiro";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: ["/financeiro/:path*", "/login"],
};
