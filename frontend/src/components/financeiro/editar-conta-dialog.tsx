"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Loader2, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TiposDespesaParticularDialog } from "./tipos-despesa-particular-dialog";
import { atualizarConta, buscarConta, type ContaDetalhe } from "@/lib/financeiro/acoes";
import {
  FORMAS_PAGAMENTO,
  PERIODICIDADES,
  TIPOS_RECORRENCIA,
  type Classificacao,
  type Estabelecimento,
  type Fornecedor,
  type Periodicidade,
  type TipoDespesaParticular,
  type TipoRecorrencia,
} from "@/lib/financeiro/tipos";
import { cn } from "@/lib/utils";

interface Props {
  /** null = diálogo fechado. Ao mudar para um id, busca a conta e abre. */
  contaId: string | null;
  classificacoes: Classificacao[];
  estabelecimentos: Estabelecimento[];
  fornecedores: Fornecedor[];
  tiposDespesaParticular?: TipoDespesaParticular[];
  aoFechar: () => void;
}

const CAMPO = "text-xs font-medium text-muted-foreground";

export function EditarContaDialog({
  contaId,
  classificacoes,
  estabelecimentos,
  fornecedores,
  tiposDespesaParticular = [],
  aoFechar,
}: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvamento] = useTransition();
  const [conta, setConta] = useState<ContaDetalhe | null>(null);
  // Derivado, não um estado à parte: "carregando" é só "pedi uma conta e
  // o dado em mãos ainda não é dela" — evita setState síncrono no efeito.
  const carregando = contaId !== null && conta?.id !== contaId;

  const [fornecedorNome, setFornecedorNome] = useState("");
  const [fornecedorCnpj, setFornecedorCnpj] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [dataDocumento, setDataDocumento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [classificacaoId, setClassificacaoId] = useState("");
  const [estabelecimentoId, setEstabelecimentoId] = useState("");
  const [tipoDespesaParticularId, setTipoDespesaParticularId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<TipoRecorrencia | "">("");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade | "">("");
  const [ocorrencias, setOcorrencias] = useState("");

  // Busca a conta sempre que um id novo chega — o formulário só existe
  // depois de ter o dado real (nada de adivinhar estado inicial). O reset
  // para "sem conta" acontece no onOpenChange do Dialog (abaixo), não
  // aqui: chamar setState direto no corpo do efeito é o que o lint
  // considera anti-padrão, não a resposta assíncrona do fetch.
  useEffect(() => {
    if (!contaId) return;
    buscarConta(contaId).then((r) => {
      if (!("conta" in r) || !r.ok) {
        toast.error("Não foi possível abrir a conta.", { description: "erro" in r ? r.erro : undefined });
        aoFechar();
        return;
      }
      const c = r.conta;
      setConta(c);
      setFornecedorNome(c.fornecedorNome);
      setFornecedorCnpj(c.fornecedorCnpj);
      setNumeroDocumento(c.numeroDocumento);
      setDataDocumento(c.dataDocumento);
      setDescricao(c.descricao);
      setVencimento(c.vencimento);
      setClassificacaoId(c.classificacaoId);
      setEstabelecimentoId(c.estabelecimentoId);
      setTipoDespesaParticularId(c.tipoDespesaParticularId);
      setFormaPagamento(c.formaPagamento);
      setObservacoes(c.observacoes);
      setRecorrente(c.recorrente);
      setRecorrenciaTipo(c.recorrenciaTipo);
      setPeriodicidade(c.periodicidade);
      setOcorrencias(c.ocorrencias != null ? String(c.ocorrencias) : "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só depende do id; aoFechar é estável na prática
  }, [contaId]);

  const ehParticular = conta?.natureza === "particular";
  const gruposClassificacao = classificacoes.reduce((mapa, c) => {
    const lista = mapa.get(c.grupo) ?? [];
    lista.push(c);
    mapa.set(c.grupo, lista);
    return mapa;
  }, new Map<string, Classificacao[]>());
  const classificacaoEscolhida = classificacoes.find((c) => c.id === classificacaoId);
  const tiposAtivos = tiposDespesaParticular.filter((t) => t.ativo);

  function salvar() {
    if (!conta) return;
    if (!descricao.trim()) {
      toast.error("Descreva a conta para conseguir identificá-la depois.");
      return;
    }
    if (!vencimento) {
      toast.error("Informe o vencimento.");
      return;
    }
    if (recorrente && (!recorrenciaTipo || !periodicidade)) {
      toast.error("Para conta recorrente, informe o tipo e a periodicidade.");
      return;
    }

    iniciarSalvamento(async () => {
      const r = await atualizarConta({
        contaId: conta.id,
        descricao,
        vencimento,
        fornecedorNome,
        fornecedorCnpj: ehParticular ? "" : fornecedorCnpj,
        numeroDocumento: ehParticular ? "" : numeroDocumento,
        dataDocumento: ehParticular ? "" : dataDocumento,
        estabelecimentoId: ehParticular ? "" : estabelecimentoId,
        classificacaoId: ehParticular ? "" : classificacaoId,
        tipoDespesaParticularId: ehParticular ? tipoDespesaParticularId : "",
        formaPagamento,
        observacoes,
        recorrente,
        recorrenciaTipo: recorrente ? recorrenciaTipo : "",
        periodicidade: recorrente ? periodicidade : "",
        ocorrencias: recorrente && ocorrencias ? Number(ocorrencias) : null,
      });

      if (!r.ok) {
        toast.error("Não foi possível salvar.", { description: r.erro });
        return;
      }

      toast.success("Conta atualizada.");
      aoFechar();
      router.refresh();
    });
  }

  return (
    <Dialog open={contaId !== null} onOpenChange={(v) => !v && (setConta(null), aoFechar())}>
      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto p-6 sm:max-w-2xl">
        <DialogTitle>Editar conta</DialogTitle>
        <DialogDescription>
          Vencimento aqui é o dado geral da conta — as datas de cada parcela continuam individuais, na tabela.
        </DialogDescription>

        {carregando && <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Carregando…</div>}

        {!carregando && conta && (
          <>
            <div
              className={cn(
                "flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                ehParticular ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
              )}
            >
              {ehParticular ? <User className="size-3.5" /> : <Building2 className="size-3.5" />}
              {ehParticular ? "Conta particular" : "Conta da empresa"}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cn("flex flex-col gap-1.5", ehParticular && "sm:col-span-2")}>
                <label className={CAMPO}>{ehParticular ? "Favorecido" : "Fornecedor"}</label>
                {ehParticular ? (
                  <Input value={fornecedorNome} onChange={(e) => setFornecedorNome(e.target.value)} placeholder="Ex.: Enel, Cagece, Colégio..." />
                ) : (
                  <>
                    <Input
                      list="lista-fornecedores-editar"
                      value={fornecedorNome}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFornecedorNome(v);
                        const achado = fornecedores.find((f) => f.nome.toLowerCase() === v.toLowerCase());
                        if (achado?.cnpj) setFornecedorCnpj(achado.cnpj);
                      }}
                      placeholder="Digite ou escolha um já cadastrado"
                    />
                    <datalist id="lista-fornecedores-editar">
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.nome} />
                      ))}
                    </datalist>
                  </>
                )}
              </div>

              {!ehParticular && (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>CNPJ</label>
                  <Input value={fornecedorCnpj} onChange={(e) => setFornecedorCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
              )}
              {!ehParticular && (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>Nº do documento / NF</label>
                  <Input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="Ex.: 4587" />
                </div>
              )}
              {!ehParticular && (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>Data do documento</label>
                  <Input type="date" value={dataDocumento} onChange={(e) => setDataDocumento(e.target.value)} />
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={CAMPO}>Descrição *</label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={CAMPO}>Vencimento *</label>
                <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ehParticular ? (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>Tipo de despesa particular</label>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Select value={tipoDespesaParticularId} onValueChange={(v) => setTipoDespesaParticularId(v ?? "")}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha o tipo">
                            {() => tiposAtivos.find((t) => t.id === tipoDespesaParticularId)?.nome ?? "Escolha o tipo"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {tiposAtivos.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <TiposDespesaParticularDialog tipos={tiposDespesaParticular} rotulo="Gerenciar tipos" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>Classificação</label>
                  <Select value={classificacaoId} onValueChange={(v) => setClassificacaoId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha a classificação">
                        {() => {
                          if (!classificacaoEscolhida) return "Escolha a classificação";
                          return (
                            classificacaoEscolhida.nome + (classificacaoEscolhida.confirmacao_pendente ? " (a confirmar)" : "")
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {Array.from(gruposClassificacao.entries()).map(([grupo, itens]) => (
                        <SelectGroup key={grupo}>
                          <SelectLabel>{grupo}</SelectLabel>
                          {itens.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                              {c.confirmacao_pendente ? " (a confirmar)" : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!ehParticular && (
                <div className="flex flex-col gap-1.5">
                  <label className={CAMPO}>Estabelecimento</label>
                  <Select value={estabelecimentoId} onValueChange={(v) => setEstabelecimentoId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Onde a despesa pertence">
                        {() => estabelecimentos.find((e) => e.id === estabelecimentoId)?.nome ?? "Onde a despesa pertence"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {estabelecimentos.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={CAMPO}>Forma de pagamento prevista</label>
                <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Como pretende pagar" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={CAMPO}>Observações</label>
                <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                É uma conta que se repete (água, aluguel, internet…)
              </label>

              {recorrente && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={CAMPO}>Tipo</label>
                    <Select value={recorrenciaTipo} onValueChange={(v) => setRecorrenciaTipo((v as TipoRecorrencia) ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha">
                          {() => TIPOS_RECORRENCIA.find((t) => t.valor === recorrenciaTipo)?.label ?? "Escolha"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_RECORRENCIA.map((t) => (
                          <SelectItem key={t.valor} value={t.valor}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={CAMPO}>Periodicidade</label>
                    <Select value={periodicidade} onValueChange={(v) => setPeriodicidade((v as Periodicidade) ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha">
                          {() => PERIODICIDADES.find((p) => p.valor === periodicidade)?.label ?? "Escolha"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODICIDADES.map((p) => (
                          <SelectItem key={p.valor} value={p.valor}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={CAMPO}>Nº de ocorrências</label>
                    <Input
                      type="number"
                      min={1}
                      value={ocorrencias}
                      onChange={(e) => setOcorrencias(e.target.value)}
                      placeholder="Deixe vazio se não tem fim"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={aoFechar} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando} className="gap-1.5">
                {salvando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
