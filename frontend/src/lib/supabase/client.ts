"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Cliente Supabase para componentes de navegador (login, formulários). */
export function criarClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
