import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Rotas que continuam abertas sem sessão. Toda a plataforma exige login por
 * padrão (decisão registrada em D-042) — esta é a única exceção: a própria
 * tela de entrada e o fluxo de recuperação de senha, que por definição
 * precisam funcionar antes de existir uma sessão.
 */
const ROTAS_PUBLICAS = ["/login", "/recuperar-senha", "/atualizar-senha"];

function ehRotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((r) => caminho === r || caminho.startsWith(`${r}/`));
}

/**
 * Proxy (antigo middleware, renomeado no Next.js 16).
 *
 * Faz duas coisas: renova o cookie de sessão do Supabase a cada requisição
 * e aplica uma checagem otimista de acesso — **a plataforma inteira exige
 * sessão, exceto a lista pública acima**. Não é a fronteira de segurança
 * final: quem garante que ninguém lê dado alheio é o RLS no banco (Central
 * Financeira) e, para os demais módulos (ainda em demonstração, sem banco
 * próprio), o próprio login já barra o acesso à tela.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  // Sem banco configurado não há sessão para renovar nem para exigir: deixa
  // passar e a própria tela de login explica o que falta configurar.
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

  // Se o Supabase estiver fora do ar ou mal configurado, o proxy não pode
  // derrubar a plataforma inteira: trata como "sem sessão" e segue.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const caminho = request.nextUrl.pathname;
  const publica = ehRotaPublica(caminho);

  if (!publica && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (caminho === "/login" && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  // Roda em toda rota de página, exceto assets estáticos internos do Next
  // e o próprio ícone do site — nada disso serve HTML que precise de sessão.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
