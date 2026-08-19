import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Cliente Supabase para Server Components e Server Actions.
 *
 * Toda leitura passa por aqui e, portanto, pelas políticas de RLS — é o
 * que garante que uma conta particular nunca chegue a um usuário sem
 * permissão, mesmo que a interface tenha um bug.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesParaGravar) => {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie — o proxy já renova a
          // sessão a cada requisição, então este caminho é seguro de ignorar.
        }
      },
    },
  });
}
