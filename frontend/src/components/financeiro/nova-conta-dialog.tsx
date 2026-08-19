"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Building2, User, Loader2, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { criarConta } from "@/lib/financeiro/acoes";
import { hojeISO, formatarMoeda } from "@/lib/financeiro/formato";
import {
  FORMAS_PAGAMENTO,
  PERIODICIDADES,
  TIPOS_RECORRENCIA,
  type Banco,
  type Classificacao,
  type Estabelecimento,
  type Fornecedor,
  type NaturezaConta,
  type Periodicidade,
  type TipoRecorrencia,
} from "@/lib/financeiro/tipos";
import { cn } from "@/lib/utils";

interface Props {
  classificacoes: Classificacao[];
  estabelecimentos: Estabelecimento[];
  fornecedores: Fornecedor[];
  bancos?: Banco[];
  /** Só quem tem permissão vê a opção "Particular". */
  podeParticular: boolean;
  /** Pré-seleciona a natureza (usado na aba de particulares). */
  naturezaInicial?: NaturezaConta;
  rotulo?: string;
}

interface LinhaParcelaForm {
  numero: number;
  valor: string;
  vencimento: string;
}

/** Soma meses preservando o fim de mês (31/01 + 1 mês = 28/02, não 03/03). */
function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return iso;
  const alvo = new Date(a, m - 1 + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  const dia = Math.min(d, ultimoDia);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${alvo.getFullYear()}-${p(alvo.getMonth() + 1)}-${p(dia)}`;
}

export function NovaContaDialog({
  classificacoes,
  estabelecimentos,
  fornecedores,
  podeParticular,
  naturezaInicial,
  rotulo = "Nova conta",
}: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salvando, iniciarSalvamento] = useTransition();

  const [natureza, setNatureza] = useState<NaturezaConta | "">(naturezaInicial ?? "");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [fornecedorCnpj, setFornecedorCnpj] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(hojeISO());
  const [dataDocumento, setDataDocumento] = useState("");
  const [classificacaoId, setClassificacaoId] = useState("");
  const [estabelecimentoId, setEstabelecimentoId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [parcelas, setParcelas] = useState<LinhaParcelaForm[]>([]);

  const [recorrente, setRecorrente] = useState(false);
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<TipoRecorrencia | "">("");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade | "">("");
  const [ocorrencias, setOcorrencias] = useState("");

  const valorNum = Number(valor.replace(",", ".")) || 0;
  const nParcelas = Math.max(Number(qtdParcelas) || 1, 1);

  const gruposClassificacao = useMemo(() => {
    const mapa = new Map<string, Classificacao[]>();
    for (const c of classificacoes) {
      const lista = mapa.get(c.grupo) ?? [];
      lista.push(c);
      mapa.set(c.grupo, lista);
    }
    return Array.from(mapa.entries());
  }, [classificacoes]);

  const classificacaoEscolhida = classificacoes.find((c) => c.id === classificacaoId);

  /**
   * Ao mudar a quantidade de parcelas, o sistema *sugere* datas mensais e
   * divide o valor — mas cada linha continua editável, porque os
   * vencimentos reais não seguem uma lógica fixa (regra do cliente).
   */
  function regerarParcelas(quantidade: number) {
    if (quantidade <= 1) {
      setParcelas([]);
      return;
    }
    const base = Math.floor((valorNum / quantidade) * 100) / 100;
    const resto = Number((valorNum - base * quantidade).toFixed(2));
    setParcelas(
      Array.from({ length: quantidade }, (_, i) => ({
        numero: i + 1,
        // A diferença de arredondamento vai toda na primeira parcela.
        valor: String((i === 0 ? base + resto : base).toFixed(2)),
        vencimento: somarMeses(vencimento, i),
      }))
    );
  }

  const somaParcelas = parcelas.reduce((a, p) => a + (Number(p.valor.replace(",", ".")) || 0), 0);
  const divergenciaParcelas = parcelas.length > 0 && Math.abs(somaParcelas - valorNum) > 0.01;

  function limpar() {
    setNatureza(naturezaInicial ?? "");
    setFornecedorNome("");
    setFornecedorCnpj("");
    setNumeroDocumento("");
    setDescricao("");
    setValor("");
    setVencimento(hojeISO());
    setDataDocumento("");
    setClassificacaoId("");
    setEstabelecimentoId("");
    setFormaPagamento("");
    setObservacoes("");
    setQtdParcelas("1");
    setParcelas([]);
    setRecorrente(false);
    setRecorrenciaTipo("");
    setPeriodicidade("");
    setOcorrencias("");
  }

  function salvar() {
    if (!natureza) {
      toast.error("Escolha se a conta é da empresa ou particular.");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Descreva a conta para conseguir identificá-la depois.");
      return;
    }
    if (valorNum <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (recorrente && (!recorrenciaTipo || !periodicidade)) {
      toast.error("Para conta recorrente, informe o tipo e a periodicidade.");
      return;
    }

    iniciarSalvamento(async () => {
      const resultado = await criarConta({
        natureza,
        descricao,
        valorInicial: valorNum,
        vencimento,
        fornecedorNome,
        fornecedorCnpj,
        numeroDocumento,
        dataDocumento,
        estabelecimentoId,
        classificacaoId,
        formaPagamento,
        observacoes,
        recorrente,
        recorrenciaTipo: recorrente ? recorrenciaTipo : "",
        periodicidade: recorrente ? periodicidade : "",
        ocorrencias: recorrente && ocorrencias ? Number(ocorrencias) : null,
        parcelas: parcelas.map((p) => ({
          numero: p.numero,
          valor: Number(p.valor.replace(",", ".")) || 0,
          vencimento: p.vencimento,
        })),
      });

      if (!resultado.ok) {
        toast.error("Não foi possível salvar.", { description: resultado.erro });
        return;
      }

      toast.success("Conta cadastrada.", {
        description:
          nParcelas > 1
            ? `${nParcelas} parcelas geradas. O sistema já acompanha cada vencimento.`
            : "O sistema já acompanha o vencimento desta conta.",
      });
      setAberto(false);
      limpar();
      router.refresh();
    });
  }

  const rotuloCampo = "text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : (setAberto(false), limpar()))}>
      <Tooltip>
        <TooltipTrigger render={<Button className="gap-1.5" onClick={() => setAberto(true)} />}>
          <Plus className="size-4" /> {rotulo}
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          Cadastre a conta uma única vez: o sistema passa a acompanhar o vencimento, alertar quando chegar a
          hora e reaproveitar os dados nos relatórios e no fechamento.
        </TooltipContent>
      </Tooltip>

      <DialogContent className="max-h-[88vh] gap-4 overflow-y-auto p-6 sm:max-w-2xl">
        <DialogTitle>Nova conta a pagar</DialogTitle>
        <DialogDescription>
          Cadastre uma vez — vencimento, relatórios e fechamento passam a se alimentar sozinhos daqui.
        </DialogDescription>

        {/* ---- Natureza: a decisão que separa empresa de pessoal ---- */}
        <div className="flex flex-col gap-2">
          <label className={rotuloCampo}>Esta conta é da empresa ou particular? *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNatureza("empresa")}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                natureza === "empresa"
                  ? "border-primary bg-primary/8 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <Building2 className="size-4 shrink-0" strokeWidth={2.25} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">Empresa</span>
                <span className="block text-[11px] leading-tight">Entra no fechamento contábil</span>
              </span>
            </button>

            <button
              type="button"
              disabled={!podeParticular}
              onClick={() => setNatureza("particular")}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                natureza === "particular"
                  ? "border-primary bg-primary/8 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
                !podeParticular && "cursor-not-allowed opacity-50 hover:border-border"
              )}
            >
              <User className="size-4 shrink-0" strokeWidth={2.25} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">Particular</span>
                <span className="block text-[11px] leading-tight">Fica fora da contabilidade</span>
              </span>
            </button>
          </div>
          {natureza === "particular" && (
            <p className="flex items-start gap-1.5 rounded-lg bg-info-soft px-3 py-2 text-[12px] text-info">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Esta conta fica no seu controle pessoal e é excluída automaticamente de tudo que vai para a
              contabilidade.
            </p>
          )}
        </div>

        {/* ---- Identificação ---- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Fornecedor</label>
            <Input
              list="lista-fornecedores"
              value={fornecedorNome}
              onChange={(e) => {
                const v = e.target.value;
                setFornecedorNome(v);
                const achado = fornecedores.find((f) => f.nome.toLowerCase() === v.toLowerCase());
                if (achado?.cnpj) setFornecedorCnpj(achado.cnpj);
              }}
              placeholder="Digite ou escolha um já cadastrado"
            />
            <datalist id="lista-fornecedores">
              {fornecedores.map((f) => (
                <option key={f.id} value={f.nome} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>CNPJ</label>
            <Input value={fornecedorCnpj} onChange={(e) => setFornecedorCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Nº do documento / NF</label>
            <Input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="Ex.: 4587" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Data do documento</label>
            <Input type="date" value={dataDocumento} onChange={(e) => setDataDocumento(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={rotuloCampo}>Descrição *</label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Diesel S10 — carga semanal"
            />
          </div>
        </div>

        {/* ---- Valores e prazo ---- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Valor total (R$) *</label>
            <Input
              inputMode="decimal"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                if (parcelas.length > 0) setParcelas([]);
                setQtdParcelas("1");
              }}
              placeholder="0,00"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Vencimento *</label>
            <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Parcelas</label>
            <Input
              type="number"
              min={1}
              max={60}
              value={qtdParcelas}
              onChange={(e) => {
                setQtdParcelas(e.target.value);
                regerarParcelas(Math.max(Number(e.target.value) || 1, 1));
              }}
            />
          </div>
        </div>

        {parcelas.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Parcelas</p>
              <p className={cn("text-[11px]", divergenciaParcelas ? "text-destructive" : "text-muted-foreground")}>
                Soma: {formatarMoeda(somaParcelas)}
                {divergenciaParcelas && ` · difere do total (${formatarMoeda(valorNum)})`}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              As datas abaixo são uma sugestão mensal — ajuste cada uma conforme o boleto real.
            </p>
            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
              {parcelas.map((p, i) => (
                <div key={p.numero} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
                  <span className="w-10 text-xs font-medium text-muted-foreground tabular-nums">
                    {p.numero}/{parcelas.length}
                  </span>
                  <Input
                    inputMode="decimal"
                    value={p.valor}
                    onChange={(e) => {
                      const copia = [...parcelas];
                      copia[i] = { ...copia[i], valor: e.target.value };
                      setParcelas(copia);
                    }}
                  />
                  <Input
                    type="date"
                    value={p.vencimento}
                    onChange={(e) => {
                      const copia = [...parcelas];
                      copia[i] = { ...copia[i], vencimento: e.target.value };
                      setParcelas(copia);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Classificação e origem ---- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Classificação</label>
            <Select value={classificacaoId} onValueChange={(v) => setClassificacaoId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha a classificação" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {gruposClassificacao.map(([grupo, itens]) => (
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
            {classificacaoEscolhida?.confirmacao_pendente && (
              <p className="text-[11px] leading-snug text-warning">
                O enquadramento contábil desta classificação ainda será confirmado com a contabilidade.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Estabelecimento</label>
            <Select value={estabelecimentoId} onValueChange={(v) => setEstabelecimentoId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Onde a despesa pertence" />
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

          <div className="flex flex-col gap-1.5">
            <label className={rotuloCampo}>Forma de pagamento prevista</label>
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
            <label className={rotuloCampo}>Observações</label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        {/* ---- Recorrência ---- */}
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
                <label className={rotuloCampo}>Tipo</label>
                <Select value={recorrenciaTipo} onValueChange={(v) => setRecorrenciaTipo((v as TipoRecorrencia) ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha" />
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
                <label className={rotuloCampo}>Periodicidade</label>
                <Select value={periodicidade} onValueChange={(v) => setPeriodicidade((v as Periodicidade) ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha" />
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
                <label className={rotuloCampo}>Nº de ocorrências</label>
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
          <Button variant="ghost" onClick={() => setAberto(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="gap-1.5">
            {salvando && <Loader2 className="size-4 animate-spin" />}
            Cadastrar conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
