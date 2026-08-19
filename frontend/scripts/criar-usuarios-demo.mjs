/**
 * Cria os dois usuários de demonstração via signUp público (chave anon).
 *
 * O que este script NÃO consegue fazer, por limitação de RLS/privilégio,
 * e por quê:
 *   - Promover o perfil recém-criado a "gestora" / pode_ver_particular=true.
 *     A política `perfis_update_gestora` só permite UPDATE em `perfis` para
 *     quem JÁ é gestora — bootstrap intencional de segurança. Com apenas a
 *     chave anon (sem service_role) não há como quebrar esse ciclo por API;
 *     é preciso rodar uma instrução SQL no SQL Editor (roda como owner do
 *     banco, ignora RLS) — ver o SQL impresso ao final deste script.
 *   - Confirmar o e-mail automaticamente ("Auto Confirm"), se o projeto
 *     tiver confirmação de e-mail habilitada — isso só é possível com
 *     service_role ou pelo painel (Authentication → Users).
 *
 * Usa e-mails no domínio reservado para documentação/teste (RFC 2606:
 * *.example) de propósito — nunca um endereço real da empresa.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function carregarEnv(caminho = ".env.local") {
  try {
    for (const linha of readFileSync(caminho, "utf8").split("\n")) {
      const l = linha.trim();
      if (!l || l.startsWith("#")) continue;
      const i = l.indexOf("=");
      if (i === -1) continue;
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* sem .env.local */
  }
}
carregarEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !CHAVE) {
  console.log("Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local");
  process.exit(1);
}

const USUARIOS = [
  {
    rotulo: "Gestora",
    email: process.env.ASA_GESTORA_EMAIL ?? "priscila@plataforma-asa.example",
    senha: process.env.ASA_GESTORA_SENHA ?? "AsaDemo#Gestora2026",
    nome: "Priscila",
    papel: "gestora",
    particular: true,
  },
  {
    rotulo: "Administrativo",
    email: process.env.ASA_ADM_EMAIL ?? "administrativo@plataforma-asa.example",
    senha: process.env.ASA_ADM_SENHA ?? "AsaDemo#Adm2026",
    nome: "Administrativo",
    papel: "administrativo",
    particular: false,
  },
];

console.log(`\n\x1b[1mCriando usuários de demonstração\x1b[0m — ${URL}\n`);

const sqlPromocao = [];

for (const u of USUARIOS) {
  const cliente = createClient(URL, CHAVE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await cliente.auth.signUp({
    email: u.email,
    password: u.senha,
    options: { data: { nome: u.nome } },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      console.log(`  \x1b[33mJÁ EXISTE\x1b[0m  ${u.rotulo} — ${u.email}`);
    } else {
      console.log(`  \x1b[31mFALHOU\x1b[0m  ${u.rotulo} — ${error.message}`);
      continue;
    }
  } else if (data.user && !data.session) {
    console.log(`  \x1b[33mCRIADO, PENDENTE DE CONFIRMAÇÃO\x1b[0m  ${u.rotulo} — ${u.email}`);
    console.log("    O projeto exige confirmação de e-mail. Confirme em Authentication → Users no painel.");
  } else {
    console.log(`  \x1b[32mCRIADO E CONFIRMADO\x1b[0m  ${u.rotulo} — ${u.email}`);
  }

  sqlPromocao.push(
    `update perfis set nome = '${u.nome}', papel = '${u.papel}', pode_ver_particular = ${u.particular}\n` +
      `where id = (select id from auth.users where email = '${u.email}');`
  );
}

console.log("\n\x1b[1mFalta um passo manual (bootstrap de segurança, não é falha):\x1b[0m");
console.log("Rode no SQL Editor do Supabase — só assim é possível definir o primeiro papel de gestora:\n");
console.log("\x1b[36m" + sqlPromocao.join("\n\n") + "\x1b[0m\n");
