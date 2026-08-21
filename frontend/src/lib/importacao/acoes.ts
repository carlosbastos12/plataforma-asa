"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { lerXlsx } from "./xlsx-leitor";
import {
  analisar,
  apenasDigitos,
  chaveDocumento,
  chaveFraca,
  montarChave,
  type ExistentesConhecidos,
} from "./analise";
import type { FalhaAnalise, LinhaAnalisada, ResultadoAnalise, ResultadoImportacao } from "./tipos";

/** Mesmo teto do envio de documentos — o `bodySizeLimit` já cobre em `next.config.ts`. */
const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024;

/** Trava de sanidade: uma exportação de despesas não tem dezenas de milhares de linhas. */
const MAXIMO_LINHAS = 5000;

const SEM_BANCO: FalhaAnalise = {
  ok: false,
  erro: "O banco de dados ainda não está configurado nesta instalação.",
};

const MIGRATION_PENDENTE =
  "A importação ainda não foi liberada nesta instalação: falta aplicar a migration 0005 no banco. " +
  "Sem ela não há onde registrar de onde cada conta veio, e importar sem esse registro impediria " +
  "reconhecer o que já foi importado numa próxima vez.";

/**
 * A coluna `origem` só existe depois da migration 0005. Sem ela o
 * importador **para** — de propósito.
 *
 * É diferente da tolerância usada em D-044/D-047, onde um campo novo
 * ausente só deixava um recurso vazio. Aqui, gravar sem o rastro de
 * origem criaria contas que uma reimportação não teria como reconhecer,
 * gerando duplicidade silenciosa. Recusar e explicar é mais seguro do
 * que importar pela metade.
 */
async function origemDisponivel(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>
): Promise<boolean> {
  const { error } = await supabase.from("contas").select("origem").limit(1);
  return !(error?.code === "42703" || error?.code === "PGRST204" || error?.code === "PGRST205");
}

async function lerArquivo(formData: FormData): Promise<
  { ok: true; bytes: Uint8Array; nome: string } | FalhaAnalise
> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha um arquivo para importar." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "Arquivo maior que 15 MB. Exporte um período menor e tente novamente." };
  }
  if (!/\.xlsx$/i.test(arquivo.name)) {
    return {
      ok: false,
      erro: "Envie um arquivo .xlsx. Se o seu arquivo for .xls ou .csv, abra no Excel e salve como .xlsx.",
    };
  }
  return { ok: true, bytes: new Uint8Array(await arquivo.arrayBuffer()), nome: arquivo.name };
}

/**
 * Monta o retrato do que já existe na Plataforma ASA, para a conferência
 * de duplicidade.
 *
 * São três consultas, e apenas três — **nunca uma por linha** (§16).
 * Todas delimitadas pelo conteúdo do próprio arquivo: só busca contas
 * que tenham chance de casar com alguma linha, em vez de trazer a tabela
 * inteira. O RLS continua valendo em cada uma; nada aqui enxerga conta
 * que o usuário já não pudesse ver.
 */
async function levantarExistentes(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  linhas: LinhaAnalisada[]
): Promise<ExistentesConhecidos> {
  const refs = new Set<string>();
  const chaves = new Set<string>();
  const documentos = new Set<string>();
  const fracas = new Set<string>();

  const refsDoArquivo = [...new Set(linhas.map((l) => l.dados.idExterno).filter((v): v is string => !!v))];
  const chavesDoArquivo = [
    ...new Set(linhas.map((l) => montarChave(l.dados)).filter((v): v is string => !!v)),
  ];
  const docsDoArquivo = [
    ...new Set(linhas.map((l) => l.dados.numeroDocumento).filter((v): v is string => !!v)),
  ];
  const vencimentosDoArquivo = [
    ...new Set(linhas.map((l) => l.dados.vencimento).filter((v): v is string => !!v)),
  ];

  const consultas: PromiseLike<unknown>[] = [];

  if (refsDoArquivo.length > 0) {
    consultas.push(
      supabase
        .from("contas")
        .select("origem_ref")
        .in("origem_ref", refsDoArquivo)
        .then(({ data }) => {
          for (const linha of data ?? []) if (linha.origem_ref) refs.add(String(linha.origem_ref));
        })
    );
  }

  // Identidade mais confiável para reimportação: a chave gravada na
  // importação anterior foi calculada pela MESMA função, a partir da
  // mesma linha — se o arquivo é o mesmo, ela bate exatamente.
  if (chavesDoArquivo.length > 0) {
    consultas.push(
      supabase
        .from("contas")
        .select("origem_chave")
        .in("origem_chave", chavesDoArquivo)
        .then(({ data }) => {
          for (const linha of data ?? []) if (linha.origem_chave) chaves.add(String(linha.origem_chave));
        })
    );
  }

  // Para contas que NÃO vieram de importação (cadastradas à mão), a
  // identidade possível é CNPJ + documento + vencimento — as três coisas
  // que existem dos dois lados. Ver `chaveDocumento`.
  if (docsDoArquivo.length > 0) {
    consultas.push(
      supabase
        .from("contas")
        .select("numero_documento, vencimento, fornecedores(cnpj)")
        .in("numero_documento", docsDoArquivo)
        .then(({ data }) => {
          for (const linha of data ?? []) {
            const bruto = linha.fornecedores as { cnpj: string | null } | { cnpj: string | null }[] | null;
            const fornecedor = Array.isArray(bruto) ? bruto[0] : bruto;
            const chave = chaveDocumento(
              fornecedor?.cnpj ?? null,
              String(linha.numero_documento),
              String(linha.vencimento)
            );
            if (chave) documentos.add(chave);
          }
        })
    );
  }

  if (vencimentosDoArquivo.length > 0) {
    consultas.push(
      supabase
        .from("contas")
        .select("valor_inicial, vencimento, fornecedores(nome)")
        .in("vencimento", vencimentosDoArquivo)
        .then(({ data }) => {
          for (const linha of data ?? []) {
            const bruto = linha.fornecedores as { nome: string } | { nome: string }[] | null;
            const fornecedor = Array.isArray(bruto) ? bruto[0] : bruto;
            const chave = chaveFraca(
              fornecedor?.nome ?? null,
              Number(linha.valor_inicial ?? 0),
              String(linha.vencimento)
            );
            if (chave) fracas.add(chave);
          }
        })
    );
  }

  await Promise.all(consultas);
  return { refs, chaves, documentos, fracas };
}

/**
 * Passo 1 — LER e CONFERIR. Não grava absolutamente nada.
 *
 * Devolve o que aconteceria com cada linha, para a pessoa olhar antes de
 * decidir. É o passo que torna a importação segura: nenhuma conta entra
 * no banco sem alguém ter visto a prévia e confirmado.
 */
export async function analisarPlanilha(formData: FormData): Promise<ResultadoAnalise | FalhaAnalise> {
  if (!SUPABASE_CONFIGURADO) return SEM_BANCO;

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  if (!(await origemDisponivel(supabase))) return { ok: false, erro: MIGRATION_PENDENTE };

  const arquivo = await lerArquivo(formData);
  if (!arquivo.ok) return arquivo;

  let abas;
  try {
    abas = lerXlsx(arquivo.bytes);
  } catch {
    return {
      ok: false,
      erro: "Não foi possível abrir este arquivo. Confira se é mesmo uma planilha .xlsx e se ela não está protegida por senha.",
    };
  }

  // Primeira passada só para descobrir as chaves que precisamos procurar
  // no banco — é o que permite as consultas do passo seguinte serem
  // delimitadas pelo conteúdo do arquivo.
  const previa = analisar(abas, arquivo.nome);
  if (!previa.ok) return previa;

  if (previa.linhas.length > MAXIMO_LINHAS) {
    return {
      ok: false,
      erro: `Esta planilha tem ${previa.linhas.length} linhas — acima do limite de ${MAXIMO_LINHAS} por importação. Exporte por período.`,
    };
  }
  if (previa.linhas.length === 0) {
    return { ok: false, erro: "A planilha não tem nenhuma linha de despesa abaixo do cabeçalho." };
  }

  const existentes = await levantarExistentes(supabase, previa.linhas);
  const resultado = analisar(abas, arquivo.nome, existentes);
  return resultado;
}

/**
 * Passo 2 — GRAVAR o que a pessoa confirmou.
 *
 * Recebe o MESMO arquivo de novo e refaz a análise do zero, com o estado
 * atual do banco. Isso é de propósito: nada do que o navegador diz sobre
 * valores, datas ou situação é aceito como verdade. A única coisa que
 * vem do cliente é a ESCOLHA de quais linhas importar — e mesmo essa
 * escolha só é respeitada para linhas que, relidas aqui, continuam
 * elegíveis. Linha com erro ou já existente não entra de jeito nenhum,
 * mande o navegador o que mandar.
 */
export async function importarPlanilha(formData: FormData): Promise<ResultadoImportacao> {
  const vazio: ResultadoImportacao = {
    ok: false,
    importados: 0,
    jaExistentes: 0,
    duplicadosIgnorados: 0,
    naoImportados: 0,
    falhas: [],
  };

  if (!SUPABASE_CONFIGURADO) return { ...vazio, erro: SEM_BANCO.erro };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...vazio, erro: "Sessão expirada. Entre novamente." };

  if (!(await origemDisponivel(supabase))) return { ...vazio, erro: MIGRATION_PENDENTE };

  const arquivo = await lerArquivo(formData);
  if (!arquivo.ok) return { ...vazio, erro: arquivo.erro };

  let abas;
  try {
    abas = lerXlsx(arquivo.bytes);
  } catch {
    return { ...vazio, erro: "Não foi possível abrir este arquivo." };
  }

  const previa = analisar(abas, arquivo.nome);
  if (!previa.ok) return { ...vazio, erro: previa.erro };
  if (previa.linhas.length > MAXIMO_LINHAS) return { ...vazio, erro: "Planilha acima do limite por importação." };

  const existentes = await levantarExistentes(supabase, previa.linhas);
  const analise = analisar(abas, arquivo.nome, existentes);
  if (!analise.ok) return { ...vazio, erro: analise.erro };

  // Escolha da pessoa. Ausente = importar tudo que estiver como "novo".
  const bruto = formData.get("linhas");
  let escolhidas: Set<number> | null = null;
  if (typeof bruto === "string" && bruto.trim() !== "") {
    try {
      const lista = JSON.parse(bruto);
      if (Array.isArray(lista)) escolhidas = new Set(lista.map(Number).filter(Number.isFinite));
    } catch {
      return { ...vazio, erro: "Não foi possível entender quais linhas você escolheu. Refaça a conferência." };
    }
  }

  const aImportar = analise.linhas.filter((l) => {
    // Barreira do servidor: só estas duas situações podem virar conta.
    if (l.situacao !== "novo" && l.situacao !== "duplicado_possivel") return false;
    if (escolhidas) return escolhidas.has(l.numeroLinha);
    // Sem escolha explícita, possível duplicidade NÃO entra sozinha.
    return l.situacao === "novo";
  });

  const jaExistentes = analise.resumo.existentes;
  const comProblema = analise.resumo.comProblema;
  const duplicadosIgnorados = analise.linhas.filter(
    (l) => l.situacao === "duplicado_possivel" && !aImportar.includes(l)
  ).length;

  if (aImportar.length === 0) {
    return {
      ok: true,
      importados: 0,
      jaExistentes,
      duplicadosIgnorados,
      naoImportados: comProblema,
      falhas: [],
    };
  }

  /* ---- Fornecedores: duas consultas para o lote inteiro, não por linha ---- */

  const nomesFornecedor = [
    ...new Map(
      aImportar
        .map((l) => l.dados.fornecedor?.trim())
        .filter((n): n is string => !!n)
        .map((n) => [n.toLowerCase(), n])
    ).values(),
  ];

  const idPorFornecedor = new Map<string, string>();

  if (nomesFornecedor.length > 0) {
    const { data: existentesForn } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .in("nome", nomesFornecedor);

    for (const f of existentesForn ?? []) idPorFornecedor.set(String(f.nome).toLowerCase(), String(f.id));

    const faltando = nomesFornecedor.filter((n) => !idPorFornecedor.has(n.toLowerCase()));
    if (faltando.length > 0) {
      const novos = faltando.map((nome) => {
        const cnpj = aImportar.find(
          (l) => l.dados.fornecedor?.trim().toLowerCase() === nome.toLowerCase() && l.dados.cnpj
        )?.dados.cnpj;
        return { nome, cnpj: apenasDigitos(cnpj ?? null) };
      });

      const { data: criados, error: erroForn } = await supabase
        .from("fornecedores")
        .insert(novos)
        .select("id, nome");

      if (erroForn) return { ...vazio, erro: `Não foi possível cadastrar os fornecedores: ${erroForn.message}` };
      for (const f of criados ?? []) idPorFornecedor.set(String(f.nome).toLowerCase(), String(f.id));
    }
  }

  /* ---- Bancos: casamento por nome exato. Sem correspondência = fica em branco (§10) ---- */

  const idPorBanco = new Map<string, string>();
  const { data: bancos } = await supabase.from("bancos").select("id, nome");
  for (const b of bancos ?? []) idPorBanco.set(String(b.nome).trim().toLowerCase(), String(b.id));

  /* ---- Gravação em lote: contas, depois parcelas, depois pagamentos ---- */

  // Os ids são gerados aqui para não depender da ORDEM em que o banco
  // devolve as linhas inseridas — a ligação conta → parcela fica
  // determinística.
  const preparadas = aImportar.map((linha) => ({
    linha,
    contaId: randomUUID(),
    parcelaId: randomUUID(),
  }));

  const contas = preparadas.map(({ linha, contaId }) => {
    const d = linha.dados;
    return {
      id: contaId,
      // Importação cria SOMENTE conta da empresa. A exportação é do
      // sistema da empresa; conta particular é registro pessoal, digitado
      // por quem é dono dele. Mantém o isolamento sem regra nova.
      natureza: "empresa" as const,
      fornecedor_id: d.fornecedor ? (idPorFornecedor.get(d.fornecedor.trim().toLowerCase()) ?? null) : null,
      numero_documento: d.numeroDocumento,
      descricao: d.descricao,
      valor_inicial: d.valor,
      data_documento: d.dataLancamento,
      competencia: d.competencia,
      vencimento: d.vencimento,
      forma_pagamento: d.formaPagamento,
      observacoes: d.observacao,
      total_parcelas: 1,
      criado_por: user.id,
      origem: "planilha" as const,
      origem_ref: d.idExterno,
      origem_chave: montarChave(d),
      // A linha como veio, inclusive o que o ASA ainda não sabe usar.
      // Nenhuma classificação é inventada a partir daqui (§10).
      origem_dados: {
        arquivo: analise.arquivo,
        aba: analise.aba,
        linha: linha.numeroLinha,
        importado_em: new Date().toISOString(),
        tipo: d.tipo,
        categoria: d.categoria,
        centro_custo: d.centroCusto,
        conta_bancaria: d.contaBancaria,
        recorrencia: d.recorrencia,
        parcela: d.parcela,
        liquidacao: d.liquidacao,
        valor_pago: d.valorPago,
        colunas_sem_correspondencia: d.extras,
      },
      // Nada de classificacao_id, estabelecimento_id, historico ou
      // recorrência: são campos do trabalho feito dentro do ASA, e a
      // importação não os preenche nem os apaga (ver COLUNAS_DO_ASA).
    };
  });

  const { error: erroContas } = await supabase.from("contas").insert(contas);
  if (erroContas) {
    return { ...vazio, erro: `Não foi possível gravar as contas: ${erroContas.message}` };
  }

  const idsGravados = preparadas.map((p) => p.contaId);

  const parcelas = preparadas.map(({ linha, contaId, parcelaId }) => ({
    id: parcelaId,
    conta_id: contaId,
    numero: 1,
    total: 1,
    valor: linha.dados.valor,
    vencimento: linha.dados.vencimento,
  }));

  const { error: erroParcelas } = await supabase.from("parcelas").insert(parcelas);
  if (erroParcelas) {
    // Conta sem parcela não aparece em tela nenhuma e não teria como ser
    // paga — melhor desfazer o lote do que deixar registro pela metade.
    await supabase.from("contas").delete().in("id", idsGravados);
    return { ...vazio, erro: `Não foi possível gravar as parcelas: ${erroParcelas.message}` };
  }

  // Pagamento só quando a origem informou as DUAS coisas: a data em que
  // foi liquidado e quanto foi pago. Sem isso a conta entra em aberto,
  // que é a verdade do que sabemos.
  const pagamentos = preparadas
    .filter(({ linha }) => linha.dados.liquidacao && (linha.dados.valorPago ?? 0) > 0)
    .map(({ linha, parcelaId }) => ({
      parcela_id: parcelaId,
      data_pagamento: linha.dados.liquidacao,
      valor_inicial: linha.dados.valorPago,
      banco_id: linha.dados.contaBancaria
        ? (idPorBanco.get(linha.dados.contaBancaria.trim().toLowerCase()) ?? null)
        : null,
      forma_pagamento: linha.dados.formaPagamento,
      criado_por: user.id,
    }));

  const falhas: ResultadoImportacao["falhas"] = [];

  if (pagamentos.length > 0) {
    const { error: erroPagamentos } = await supabase.from("pagamentos").insert(pagamentos);
    if (erroPagamentos) {
      // As contas ficam — elas estão corretas. Só a baixa não entrou, e
      // a pessoa é avisada para registrar o pagamento à mão.
      falhas.push({
        numeroLinha: 0,
        motivo: `As contas foram importadas, mas os ${pagamentos.length} pagamentos já liquidados não puderam ser registrados: ${erroPagamentos.message}. Registre-os pela tela de Contas a Pagar.`,
      });
    }
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/relatorios");
  revalidatePath("/");

  return {
    ok: true,
    importados: preparadas.length,
    jaExistentes,
    duplicadosIgnorados,
    naoImportados: comProblema,
    falhas,
  };
}
