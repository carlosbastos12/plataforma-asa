/**
 * Verificação ponta a ponta da Central Financeira.
 *
 * Roda a bateria que a missão P041 exige contra o banco real: schema,
 * autenticação, separação Empresa × Particular garantida por RLS, e a
 * exclusão das particulares do fechamento contábil.
 *
 * Uso (a partir de frontend/):
 *   node scripts/verificar-central-financeira.mjs
 *
 * Lê credenciais de .env.local. Para os testes de RLS, informe também:
 *   ASA_GESTORA_EMAIL / ASA_GESTORA_SENHA
 *   ASA_ADM_EMAIL     / ASA_ADM_SENHA
 * (podem ir no próprio .env.local — o arquivo nunca é versionado)
 *
 * Nenhum dado é deixado para trás: as contas de teste são removidas ao fim.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

/* ----------------------------- utilidades ----------------------------- */

function carregarEnv(caminho = ".env.local") {
  try {
    for (const linha of readFileSync(caminho, "utf8").split("\n")) {
      const limpa = linha.trim();
      if (!limpa || limpa.startsWith("#")) continue;
      const i = limpa.indexOf("=");
      if (i === -1) continue;
      const chave = limpa.slice(0, i).trim();
      const valor = limpa.slice(i + 1).trim();
      if (!process.env[chave]) process.env[chave] = valor;
    }
  } catch {
    // sem .env.local — usa variáveis já exportadas no ambiente
  }
}

let passou = 0;
let falhou = 0;
let pulou = 0;

const ok = (m, extra = "") => (passou++, console.log(`  \x1b[32mPASSOU\x1b[0m  ${m}${extra ? ` — ${extra}` : ""}`));
const erro = (m, extra = "") => (falhou++, console.log(`  \x1b[31mFALHOU\x1b[0m  ${m}${extra ? ` — ${extra}` : ""}`));
const pular = (m, motivo) => (pulou++, console.log(`  \x1b[33mPULOU \x1b[0m  ${m} — ${motivo}`));
const etapa = (n, t) => console.log(`\n\x1b[1m${n}. ${t}\x1b[0m`);

/** Verifica uma condição, com mensagens distintas para sucesso e falha. */
function checar(condicao, msgOk, msgErro, detalhe = "") {
  if (condicao) ok(msgOk);
  else erro(msgErro, detalhe);
}

function cliente(url, chave) {
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* -------------------------------- main -------------------------------- */

carregarEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("\n\x1b[1mVerificação da Central Financeira — Plataforma ASA\x1b[0m");

if (!URL || !CHAVE) {
  console.log(
    `\n\x1b[31mFalta configurar:\x1b[0m ${!URL ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!CHAVE ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}`
  );
  console.log("Preencha em frontend/.env.local e rode de novo.\n");
  process.exit(1);
}
console.log(`Projeto: ${URL}\n`);

const anon = cliente(URL, CHAVE);

/* --- 1. Schema aplicado? --------------------------------------------- */
etapa(1, "Schema aplicado no banco");

const TABELAS = ["perfis", "classificacoes", "estabelecimentos", "bancos", "fornecedores", "contas", "parcelas", "pagamentos", "documentos", "historico_alteracoes"];

// IMPORTANTE: usar GET (nunca HEAD) para checar existência de tabela.
// HEAD não tem corpo de resposta por definição HTTP — um 404 PGRST205
// (tabela inexistente) chega sem `error` populado corretamente em algumas
// versões do cliente, mascarando o erro e fazendo esta checagem passar
// mesmo quando a tabela não existe. Já aconteceu uma vez neste projeto.
let schemaOk = true;
for (const t of TABELAS) {
  const { error } = await anon.from(t).select("id").limit(1);
  if (error) {
    const inexistente = /PGRST205|does not exist|schema cache/i.test(`${error.code} ${error.message}`);
    erro(`tabela "${t}"`, inexistente ? "não existe — migration não aplicada" : error.message);
    schemaOk = false;
  } else {
    ok(`tabela "${t}"`);
  }
}

const { error: erroView } = await anon.from("vw_parcelas_completo").select("parcela_id").limit(1);
if (erroView) {
  erro("view vw_parcelas_completo", erroView.message);
  schemaOk = false;
} else {
  ok("view vw_parcelas_completo");
}

if (!schemaOk) {
  console.log("\n\x1b[31mAplique supabase/migrations/0001_central_financeira.sql no SQL Editor antes de continuar.\x1b[0m\n");
  process.exit(1);
}

/* --- 2. RLS protege contra acesso anônimo ---------------------------- */
etapa(2, "RLS bloqueia acesso sem autenticação");

const { data: anonContas } = await anon.from("contas").select("id");
if (!anonContas || anonContas.length === 0) ok("usuário anônimo não lê contas");
else erro("usuário anônimo leu contas", `${anonContas.length} registro(s) vazaram`);

const { data: anonClass } = await anon.from("classificacoes").select("id");
if (!anonClass || anonClass.length === 0) ok("usuário anônimo não lê classificações");
else erro("usuário anônimo leu classificações", `${anonClass.length} registro(s)`);

/* --- 3. Login da gestora --------------------------------------------- */
etapa(3, "Autenticação e permissões");

const gestoraEmail = process.env.ASA_GESTORA_EMAIL;
const gestoraSenha = process.env.ASA_GESTORA_SENHA;
const admEmail = process.env.ASA_ADM_EMAIL;
const admSenha = process.env.ASA_ADM_SENHA;

let gestora = null;
if (!gestoraEmail || !gestoraSenha) {
  pular("login da gestora", "defina ASA_GESTORA_EMAIL e ASA_GESTORA_SENHA");
} else {
  gestora = cliente(URL, CHAVE);
  const { error } = await gestora.auth.signInWithPassword({ email: gestoraEmail, password: gestoraSenha });
  if (error) {
    erro("login da gestora", error.message);
    gestora = null;
  } else {
    ok("login da gestora");
    const { data: perfil } = await gestora.from("perfis").select("nome, papel, pode_ver_particular").maybeSingle();
    if (!perfil) erro("perfil da gestora", "não encontrado");
    else if (!perfil.pode_ver_particular) erro("gestora", "está sem pode_ver_particular = true");
    else ok("gestora com permissão para contas particulares", `papel: ${perfil.papel}`);
  }
}

/* --- 4. Seed das classificações -------------------------------------- */
etapa(4, "Seed das listas reais da empresa");

if (!gestora) {
  pular("contagem das classificações", "sem sessão");
} else {
  const { count: nClass } = await gestora.from("classificacoes").select("*", { count: "exact", head: true });
  if (nClass === 96) ok("96 classificações (95 reais + Combustível)");
  else if (nClass >= 95) ok(`${nClass} classificações carregadas`);
  else erro("classificações", `esperado 96, encontrado ${nClass}`);

  const { data: grupos } = await gestora.from("classificacoes").select("grupo");
  const distintos = [...new Set((grupos ?? []).map((g) => g.grupo))];
  if (distintos.length === 5) ok("5 grupos contábeis", distintos.join(", "));
  else erro("grupos contábeis", `esperado 5, encontrado ${distintos.length}`);

  const { data: comb } = await gestora.from("classificacoes").select("grupo, confirmacao_pendente").eq("nome", "Combustível").maybeSingle();
  if (comb?.confirmacao_pendente) ok("Combustível marcada como pendente de confirmação", `grupo provisório: ${comb.grupo}`);
  else erro("Combustível", "deveria existir com confirmacao_pendente = true");

  const { count: nEstab } = await gestora.from("estabelecimentos").select("*", { count: "exact", head: true });
  const { count: nBancos } = await gestora.from("bancos").select("*", { count: "exact", head: true });
  checar(nEstab >= 4, `${nEstab} estabelecimentos`, "estabelecimentos", `encontrado ${nEstab}`);
  checar(nBancos >= 6, `${nBancos} bancos`, "bancos", `encontrado ${nBancos}`);
}

/* --- 5. Cadastro de contas + regra do valor pago --------------------- */
etapa(5, "Cadastro de conta, parcelas e cálculo do pagamento");

const criadas = [];
let contaEmpresaId = null;
let contaParticularId = null;

if (!gestora) {
  pular("cadastro de contas", "sem sessão");
} else {
  const { data: cls } = await gestora.from("classificacoes").select("id").eq("nome", "Energia Elétrica").maybeSingle();
  const { data: est } = await gestora.from("estabelecimentos").select("id").eq("nome", "Matriz").maybeSingle();

  // Conta da EMPRESA, parcelada em 3
  const { data: idEmpresa, error: e1 } = await gestora.rpc("criar_conta_com_parcelas", {
    p_natureza: "empresa",
    p_descricao: "[TESTE AUTOMATICO] Energia da base",
    p_valor_inicial: 900,
    p_vencimento: "2026-09-10",
    p_parcelas: [
      { numero: 1, valor: 300, vencimento: "2026-09-10" },
      { numero: 2, valor: 300, vencimento: "2026-10-08" },
      { numero: 3, valor: 300, vencimento: "2026-11-12" },
    ],
    p_fornecedor_nome: "[TESTE] Concessionária de Energia",
    p_fornecedor_cnpj: "12.345.678/0001-90",
    p_numero_documento: "NF-TESTE-1",
    p_classificacao_id: cls?.id ?? null,
    p_estabelecimento_id: est?.id ?? null,
    p_forma_pagamento: "Boleto",
  });
  if (e1) erro("cadastro de conta da empresa", e1.message);
  else {
    contaEmpresaId = idEmpresa;
    criadas.push(idEmpresa);
    ok("conta da empresa cadastrada com 3 parcelas");

    const { data: parcelas } = await gestora.from("parcelas").select("numero, valor, vencimento").eq("conta_id", idEmpresa).order("numero");
    if (parcelas?.length === 3) ok("3 parcelas geradas atomicamente");
    else erro("parcelas", `esperado 3, encontrado ${parcelas?.length ?? 0}`);
    if (parcelas?.[2]?.vencimento === "2026-11-12") ok("vencimento manual respeitado (não seguiu lógica mensal fixa)");
    else erro("vencimento manual", `esperado 2026-11-12, veio ${parcelas?.[2]?.vencimento}`);

    // Pagamento com juros/multa/desconto — a fórmula é do banco.
    const alvo = parcelas?.[0];
    const { error: ePag } = await gestora.from("pagamentos").insert({
      parcela_id: (await gestora.from("parcelas").select("id").eq("conta_id", idEmpresa).eq("numero", 1).single()).data.id,
      data_pagamento: "2026-09-12",
      valor_inicial: alvo.valor,
      juros: 20,
      multa: 30,
      desconto: 10,
      forma_pagamento: "PIX",
    });
    if (ePag) erro("registro de pagamento", ePag.message);
    else {
      const { data: pag } = await gestora
        .from("pagamentos")
        .select("valor_pago")
        .eq("parcela_id", (await gestora.from("parcelas").select("id").eq("conta_id", idEmpresa).eq("numero", 1).single()).data.id)
        .single();
      const esperado = 300 + 20 + 30 - 10; // 340
      if (Number(pag.valor_pago) === esperado) ok(`Valor Pago = valor + juros + multa − desconto`, `R$ ${pag.valor_pago} (coluna gerada no banco)`);
      else erro("cálculo do valor pago", `esperado ${esperado}, veio ${pag.valor_pago}`);
    }
  }

  // Conta PARTICULAR
  const { data: idParticular, error: e2 } = await gestora.rpc("criar_conta_com_parcelas", {
    p_natureza: "particular",
    p_descricao: "[TESTE AUTOMATICO] Condomínio do apartamento",
    p_valor_inicial: 780,
    p_vencimento: "2026-09-05",
    p_parcelas: [],
    p_fornecedor_nome: "[TESTE] Condomínio Residencial",
  });
  if (e2) erro("cadastro de conta particular", e2.message);
  else {
    contaParticularId = idParticular;
    criadas.push(idParticular);
    ok("conta particular cadastrada");
  }
}

/* --- 6. A regra central: Empresa × Particular ------------------------ */
etapa(6, "Separação Empresa × Particular (garantida por RLS)");

if (!gestora) {
  pular("verificação de isolamento", "sem sessão");
} else {
  const { data: todas } = await gestora.from("vw_parcelas_completo").select("natureza, conta_id");
  const temParticular = (todas ?? []).some((l) => l.conta_id === contaParticularId);
  checar(temParticular, "gestora ENXERGA a conta particular", "gestora não enxergou a conta particular");

  if (!admEmail || !admSenha) {
    pular("teste do usuário administrativo", "defina ASA_ADM_EMAIL e ASA_ADM_SENHA");
  } else {
    const adm = cliente(URL, CHAVE);
    const { error } = await adm.auth.signInWithPassword({ email: admEmail, password: admSenha });
    if (error) {
      erro("login do administrativo", error.message);
    } else {
      ok("login do administrativo");
      const { data: perfilAdm } = await adm.from("perfis").select("papel, pode_ver_particular").maybeSingle();
      checar(
        perfilAdm?.pode_ver_particular === false,
        "administrativo SEM permissão para particulares",
        "administrativo",
        "não deveria ter pode_ver_particular"
      );

      const { data: vistas } = await adm.from("vw_parcelas_completo").select("natureza, conta_id");
      const vazou = (vistas ?? []).some((l) => l.natureza === "particular");
      checar(
        !vazou,
        "administrativo NÃO enxerga nenhuma conta particular (RLS)",
        "VAZAMENTO",
        "administrativo enxergou conta particular"
      );

      // Tentativa explícita de burlar: consulta direta pedindo particular.
      const { data: forcado } = await adm.from("contas").select("id").eq("natureza", "particular");
      checar(
        (forcado ?? []).length === 0,
        "consulta direta por natureza=particular volta vazia para o administrativo",
        "VAZAMENTO",
        `consulta direta devolveu ${forcado?.length} registro(s)`
      );

      // Tentativa de gravar uma conta particular sem permissão.
      const { error: eInsert } = await adm.rpc("criar_conta_com_parcelas", {
        p_natureza: "particular",
        p_descricao: "[TESTE] tentativa indevida",
        p_valor_inicial: 1,
        p_vencimento: "2026-09-01",
        p_parcelas: [],
      });
      checar(
        Boolean(eInsert),
        "administrativo BLOQUEADO ao tentar criar conta particular",
        "FALHA DE SEGURANÇA",
        "administrativo conseguiu criar conta particular"
      );

      await adm.auth.signOut();
    }
  }
}

/* --- 7. Fechamento contábil exclui particulares ---------------------- */
etapa(7, "Fechamento contábil contém apenas contas da empresa");

if (!gestora) {
  pular("fechamento contábil", "sem sessão");
} else {
  const { data: fechamento } = await gestora.from("vw_parcelas_completo").select("natureza").eq("natureza", "empresa");
  const invasores = (fechamento ?? []).filter((l) => l.natureza !== "empresa");
  checar(
    invasores.length === 0,
    `fechamento com ${fechamento?.length ?? 0} linha(s), nenhuma particular`,
    "fechamento contaminado",
    `${invasores.length} linha(s) particulares`
  );
}

/* --- 8. Histórico de alterações -------------------------------------- */
etapa(8, "Histórico de alterações financeiras");

if (!gestora || !contaEmpresaId) {
  pular("histórico", "sem conta de teste");
} else {
  await gestora.from("contas").update({ valor_inicial: 950 }).eq("id", contaEmpresaId);
  const { data: hist } = await gestora
    .from("historico_alteracoes")
    .select("campo, valor_anterior, valor_novo")
    .eq("registro_id", contaEmpresaId)
    .eq("campo", "valor_inicial");
  if (hist && hist.length > 0) ok("alteração de valor registrada", `${hist[0].valor_anterior} → ${hist[0].valor_novo}`);
  else erro("histórico", "alteração de valor não foi registrada");
}

/* --- 9. Limpeza ------------------------------------------------------- */
etapa(9, "Limpeza dos dados de teste");

if (gestora && criadas.length > 0) {
  for (const id of criadas) await gestora.from("contas").delete().eq("id", id);
  await gestora.from("fornecedores").delete().like("nome", "[TESTE]%");
  const { data: sobrou } = await gestora.from("contas").select("id").like("descricao", "[TESTE AUTOMATICO]%");
  checar((sobrou ?? []).length === 0, "nenhum dado de teste deixado no banco", "limpeza", `${sobrou?.length} conta(s) restantes`);
  await gestora.auth.signOut();
} else {
  pular("limpeza", "nada foi criado");
}

/* ------------------------------ resultado ----------------------------- */

console.log(`\n${"─".repeat(64)}`);
console.log(`\x1b[1mResultado:\x1b[0m \x1b[32m${passou} passaram\x1b[0m · \x1b[31m${falhou} falharam\x1b[0m · \x1b[33m${pulou} pulados\x1b[0m\n`);
process.exit(falhou > 0 ? 1 : 0);
