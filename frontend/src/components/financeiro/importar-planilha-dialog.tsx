"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CircleAlert,
  CircleCheckBig,
  FileSpreadsheet,
  Loader2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ComoFunciona, type TopicoAjuda } from "@/components/ajuda/como-funciona";
import { analisarPlanilha, importarPlanilha } from "@/lib/importacao/acoes";
import { formatarData, formatarMoeda } from "@/lib/financeiro/formato";
import type { LinhaAnalisada, ResultadoAnalise, ResultadoImportacao, SituacaoLinha } from "@/lib/importacao/tipos";
import { cn } from "@/lib/utils";

const AJUDA: TopicoAjuda[] = [
  {
    titulo: "O que esta tela faz",
    texto:
      "Traz para o sistema as despesas que você já cadastrou na AutEM, a partir do arquivo exportado de lá — sem precisar digitar tudo de novo.",
  },
  {
    titulo: "Nada é gravado antes de você ver",
    texto:
      "Ao escolher o arquivo, o sistema apenas lê e mostra o que encontrou. Só depois que você confirmar é que as contas passam a existir aqui.",
  },
  {
    titulo: "Se você importar o mesmo arquivo duas vezes",
    texto:
      "O que já entrou não entra de novo. O sistema reconhece o que já está cadastrado e marca como “já existente”, sem duplicar.",
  },
  {
    titulo: "O que você preencheu aqui não se perde",
    texto:
      "Classificação, estabelecimento, histórico e anexos que você completou continuam como estão. Uma nova importação nunca apaga esse trabalho.",
  },
  {
    titulo: "Linhas com problema",
    texto:
      "Quando falta o valor ou o vencimento, ou uma data não dá para entender, a linha aparece em vermelho e não é importada. Corrija na planilha e importe de novo.",
  },
];

const CORES: Record<SituacaoLinha, string> = {
  novo: "text-success",
  existente: "text-muted-foreground",
  duplicado_possivel: "text-warning",
  erro: "text-destructive",
};

const ROTULOS: Record<SituacaoLinha, string> = {
  novo: "Novo",
  existente: "Já existente",
  duplicado_possivel: "Verificar",
  erro: "Problema",
};

type Etapa = "escolher" | "previa" | "resultado";

export function ImportarPlanilhaDialog() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("escolher");
  const [analise, setAnalise] = useState<ResultadoAnalise | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [duplicadosAceitos, setDuplicadosAceitos] = useState<Set<number>>(new Set());
  const [ocupado, iniciar] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  // O arquivo é guardado para ser reenviado na confirmação: o servidor
  // relê tudo do zero em vez de confiar no que a tela calculou.
  const arquivoRef = useRef<File | null>(null);

  function reiniciar() {
    setEtapa("escolher");
    setAnalise(null);
    setResultado(null);
    setDuplicadosAceitos(new Set());
    arquivoRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }

  function conferir() {
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) {
      toast.error("Escolha o arquivo antes de continuar.");
      return;
    }
    arquivoRef.current = arquivo;

    const fd = new FormData();
    fd.set("arquivo", arquivo);

    iniciar(async () => {
      const r = await analisarPlanilha(fd);
      if (!r.ok) {
        toast.error("Não foi possível ler a planilha.", { description: r.erro });
        return;
      }
      setAnalise(r);
      setEtapa("previa");
    });
  }

  function confirmar() {
    const arquivo = arquivoRef.current;
    if (!arquivo || !analise) return;

    const linhas = [
      ...analise.linhas.filter((l) => l.situacao === "novo").map((l) => l.numeroLinha),
      ...duplicadosAceitos,
    ];

    const fd = new FormData();
    fd.set("arquivo", arquivo);
    fd.set("linhas", JSON.stringify(linhas));

    iniciar(async () => {
      const r = await importarPlanilha(fd);
      if (!r.ok) {
        toast.error("A importação não foi concluída.", { description: r.erro });
        return;
      }
      setResultado(r);
      setEtapa("resultado");
      router.refresh();
    });
  }

  const totalAImportar =
    (analise?.resumo.novos ?? 0) + duplicadosAceitos.size;

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) reiniciar();
      }}
    >
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAberto(true)}>
        <Upload className="size-3.5" /> Importar AutEM
      </Button>

      <DialogContent className="flex max-h-[88vh] flex-col gap-4 p-6 sm:max-w-3xl lg:max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle>Importar despesas da AutEM</DialogTitle>
            <DialogDescription className="mt-1">
              Traga as despesas já cadastradas na AutEM. Você confere tudo antes de qualquer coisa ser
              gravada.
            </DialogDescription>
          </div>
          <ComoFunciona
            titulo="Importar despesas da AutEM"
            resumo="Traz para cá as despesas já cadastradas na AutEM, a partir do arquivo exportado de lá."
            topicos={AJUDA}
          />
        </div>

        {etapa === "escolher" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 rounded-xl border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground">Arquivo exportado da AutEM (.xlsx)</label>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
              />
              <p className="text-[11px] text-muted-foreground">
                O sistema reconhece as colunas pelo nome — não importa a ordem em que elas aparecem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setAberto(false)} disabled={ocupado}>
                Cancelar
              </Button>
              <Button className="gap-1.5" onClick={conferir} disabled={ocupado}>
                {ocupado ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                Ler e conferir
              </Button>
            </div>
          </div>
        )}

        {etapa === "previa" && analise && (
          <Previa
            analise={analise}
            duplicadosAceitos={duplicadosAceitos}
            alternarDuplicado={(numero) =>
              setDuplicadosAceitos((atual) => {
                const proximo = new Set(atual);
                if (proximo.has(numero)) proximo.delete(numero);
                else proximo.add(numero);
                return proximo;
              })
            }
            totalAImportar={totalAImportar}
            ocupado={ocupado}
            aoVoltar={reiniciar}
            aoConfirmar={confirmar}
          />
        )}

        {etapa === "resultado" && resultado && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-success/25 bg-success-soft px-4 py-3">
              <CircleCheckBig className="size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold text-success">Importação concluída</p>
                <p className="text-[12.5px] text-muted-foreground">
                  As contas importadas já aparecem em Contas a Pagar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Numero rotulo="Importados" valor={resultado.importados} tom="text-success" />
              <Numero rotulo="Já existentes" valor={resultado.jaExistentes} />
              <Numero rotulo="Duplicidade ignorada" valor={resultado.duplicadosIgnorados} tom="text-warning" />
              <Numero rotulo="Não importados" valor={resultado.naoImportados} tom="text-destructive" />
            </div>

            {resultado.falhas.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-xl border border-warning/30 bg-warning-soft/60 p-3.5">
                {resultado.falhas.map((f, i) => (
                  <p key={i} className="text-[12.5px] leading-relaxed text-foreground">
                    {f.numeroLinha > 0 ? `Linha ${f.numeroLinha}: ` : ""}
                    {f.motivo}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
                Importar outro arquivo
              </Button>
              <Button onClick={() => setAberto(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------------- */

function Numero({ rotulo, valor, tom }: { rotulo: string; valor: number; tom?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className={cn("mt-0.5 text-[19px] font-bold tabular-nums", tom ?? "text-foreground")}>{valor}</p>
    </div>
  );
}

function Previa({
  analise,
  duplicadosAceitos,
  alternarDuplicado,
  totalAImportar,
  ocupado,
  aoVoltar,
  aoConfirmar,
}: {
  analise: ResultadoAnalise;
  duplicadosAceitos: Set<number>;
  alternarDuplicado: (numero: number) => void;
  totalAImportar: number;
  ocupado: boolean;
  aoVoltar: () => void;
  aoConfirmar: () => void;
}) {
  const { resumo } = analise;

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-muted-foreground">
          Arquivo: <span className="font-medium text-foreground">{analise.arquivo}</span> · aba{" "}
          <span className="font-medium text-foreground">{analise.aba}</span> · {resumo.total} linha(s)
        </p>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Numero rotulo="Novos" valor={resumo.novos} tom="text-success" />
          <Numero rotulo="Já existentes" valor={resumo.existentes} />
          <Numero rotulo="Verificar" valor={resumo.duplicadosPossiveis} tom="text-warning" />
          <Numero rotulo="Com problema" valor={resumo.comProblema} tom="text-destructive" />
        </div>

        {analise.colunasSemCorrespondencia.length > 0 && (
          <p className="rounded-lg bg-info-soft px-3 py-2 text-[12px] leading-relaxed text-info">
            Colunas que o sistema ainda não sabe aproveitar:{" "}
            <strong>{analise.colunasSemCorrespondencia.join(", ")}</strong>. Elas não são perdidas — ficam
            guardadas junto de cada conta, e nada é classificado por conta própria.
          </p>
        )}
      </div>

      {/* Só a tabela rola, e só na vertical. */}
      <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
        <table className="w-full text-left text-[12.5px]">
          <thead className="sticky top-0 bg-popover">
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-2">Linha</th>
              <th className="py-2 pr-2">Situação</th>
              <th className="py-2 pr-2">Fornecedor / Descrição</th>
              <th className="py-2 pr-2">Documento</th>
              <th className="py-2 pr-2">Vencimento</th>
              <th className="py-2 pr-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {analise.linhas.map((l) => (
              <LinhaPrevia
                key={l.numeroLinha}
                linha={l}
                aceito={duplicadosAceitos.has(l.numeroLinha)}
                aoAlternar={() => alternarDuplicado(l.numeroLinha)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] text-muted-foreground">
          Você está prestes a importar{" "}
          <strong className="text-foreground">{totalAImportar} lançamento(s)</strong>.
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={aoVoltar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button className="gap-1.5" onClick={aoConfirmar} disabled={ocupado || totalAImportar === 0}>
            {ocupado ? <Loader2 className="size-4 animate-spin" /> : <CircleCheckBig className="size-4" />}
            Confirmar importação
          </Button>
        </div>
      </div>
    </>
  );
}

function LinhaPrevia({
  linha,
  aceito,
  aoAlternar,
}: {
  linha: LinhaAnalisada;
  aceito: boolean;
  aoAlternar: () => void;
}) {
  const d = linha.dados;
  const detalhes = [...linha.problemas, ...linha.avisos];

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="py-2 pr-2 tabular-nums text-muted-foreground">{linha.numeroLinha}</td>
      <td className="py-2 pr-2">
        <span className={cn("font-semibold", CORES[linha.situacao])}>{ROTULOS[linha.situacao]}</span>
        <p className="text-[11px] leading-snug text-muted-foreground">{linha.motivo}</p>

        {linha.situacao === "duplicado_possivel" && (
          <label className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <input
              type="checkbox"
              checked={aceito}
              onChange={aoAlternar}
              className="size-3.5 accent-[var(--primary)]"
            />
            Importar mesmo assim
          </label>
        )}

        {detalhes.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {detalhes.map((t, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-1 text-[11px] leading-snug",
                  linha.problemas.includes(t) ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {linha.problemas.includes(t) ? (
                  <CircleAlert className="mt-px size-3 shrink-0" />
                ) : (
                  <TriangleAlert className="mt-px size-3 shrink-0" />
                )}
                {t}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="py-2 pr-2">
        <p className="font-medium text-foreground">{d.fornecedor ?? "—"}</p>
        <p className="text-[11px] text-muted-foreground">{d.descricao ?? "—"}</p>
      </td>
      <td className="py-2 pr-2 text-muted-foreground">{d.numeroDocumento ?? "—"}</td>
      <td className="py-2 pr-2 tabular-nums">{d.vencimento ? formatarData(d.vencimento) : "—"}</td>
      <td className="py-2 pr-2 text-right font-semibold tabular-nums">
        {d.valor != null ? formatarMoeda(d.valor) : "—"}
      </td>
    </tr>
  );
}
