"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  carregarDocumentos,
  enviarDocumento,
  excluirDocumento,
  obterUrlDocumento,
  type ModoDocumento,
} from "@/lib/financeiro/acoes";
import { formatarData, formatarTamanho } from "@/lib/financeiro/formato";
import { TIPO_DOCUMENTO_LABEL, type Documento, type TipoDocumento } from "@/lib/financeiro/tipos";

interface Props {
  /** null = diálogo fechado. Ao mudar para um id, busca os documentos da conta e abre. */
  contaId: string | null;
  aoFechar: () => void;
}

const TIPOS = Object.keys(TIPO_DOCUMENTO_LABEL) as TipoDocumento[];

/**
 * NF, boleto, comprovante e outros arquivos de uma conta — ativa a
 * tabela `documentos` (existia desde a 0001, sem uso pela aplicação) com
 * Storage real (D-047, Etapa 4). O comprovante de pagamento é só mais um
 * `tipo` desta mesma lista, não uma estrutura separada — como pedido.
 */
export function DocumentosContaDialog({ contaId, aoFechar }: Props) {
  // Guarda junto de que conta é a lista — evita setState síncrono no
  // efeito (mesmo padrão de `carregando` em EditarContaDialog): "ainda
  // carregando" é só "a lista em mãos não é desta conta".
  const [carregados, setCarregados] = useState<{ contaId: string; lista: Documento[] } | null>(null);
  const documentos = carregados?.contaId === contaId ? carregados.lista : null;

  const [tipo, setTipo] = useState<TipoDocumento>("nf");
  const [enviando, iniciarEnvio] = useTransition();
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contaId) return;
    carregarDocumentos(contaId).then((lista) => setCarregados({ contaId, lista }));
  }, [contaId]);

  function recarregar() {
    if (contaId) carregarDocumentos(contaId).then((lista) => setCarregados({ contaId, lista }));
  }

  function enviar() {
    const arquivo = inputRef.current?.files?.[0];
    if (!contaId) return;
    if (!arquivo) {
      toast.error("Escolha um arquivo antes de enviar.");
      return;
    }
    const fd = new FormData();
    fd.set("contaId", contaId);
    fd.set("tipo", tipo);
    fd.set("arquivo", arquivo);

    iniciarEnvio(async () => {
      const r = await enviarDocumento(fd);
      if (!r.ok) {
        toast.error("Não foi possível enviar o documento.", { description: r.erro });
        return;
      }
      toast.success("Documento enviado.");
      if (inputRef.current) inputRef.current.value = "";
      recarregar();
    });
  }

  /**
   * Abre ou baixa o arquivo por link assinado de curta duração — o bucket
   * é privado e continua sendo. `visualizar` faz o navegador exibir o PDF
   * ou a imagem; `baixar` é que salva no computador.
   *
   * Visualizar abre a aba JÁ no clique, antes de esperar o link: o link
   * assinado só chega depois de uma ida ao servidor, e abrir a aba depois
   * disso pode ser barrado como pop-up. (Sem "noopener" na abertura de
   * propósito — com ele o navegador devolve `null` e não sobraria janela
   * para apontar; a referência é anulada na linha seguinte.)
   *
   * Baixar não abre aba nenhuma: o link já vem com o cabeçalho de anexo,
   * então o navegador salva o arquivo e a página continua exatamente onde
   * está.
   */
  function acessar(doc: Documento, modo: ModoDocumento) {
    const janela = modo === "visualizar" ? window.open("about:blank", "_blank") : null;
    if (janela) janela.opener = null;

    setProcessandoId(doc.id);

    obterUrlDocumento(doc.id, modo).then((r) => {
      setProcessandoId(null);
      if (!("url" in r) || !r.ok) {
        janela?.close();
        toast.error("Não foi possível abrir o documento.", { description: "erro" in r ? r.erro : undefined });
        return;
      }

      if (modo === "visualizar") {
        if (janela) janela.location.replace(r.url);
        // Pop-up bloqueado: tenta do jeito direto, que costuma passar.
        else window.open(r.url, "_blank", "noopener,noreferrer");
        return;
      }

      const link = document.createElement("a");
      link.href = r.url;
      link.rel = "noopener";
      link.download = doc.nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  function excluir(doc: Documento) {
    setProcessandoId(doc.id);
    excluirDocumento(doc.id).then((r) => {
      setProcessandoId(null);
      if (!r.ok) {
        toast.error("Não foi possível excluir o documento.", { description: r.erro });
        return;
      }
      toast.success("Documento removido.");
      recarregar();
    });
  }

  return (
    <Dialog open={contaId !== null} onOpenChange={(v) => !v && aoFechar()}>
      {/* Largura ampla e altura limitada: a rolagem que existe é só a
          VERTICAL da lista de documentos (abaixo). Nenhum campo fica
          escondido atrás de rolagem horizontal. */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 p-6 sm:max-w-3xl lg:max-w-4xl">
        <DialogTitle>Documentos da conta</DialogTitle>
        <DialogDescription>
          Nota fiscal, boleto e comprovante de pagamento — anexados aqui, sem precisar procurar em outro lugar
          na hora do fechamento.
        </DialogDescription>

        <div className="flex flex-col gap-2.5 rounded-xl border border-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 sm:w-48">
              <Select value={tipo} onValueChange={(v) => setTipo((v as TipoDocumento) ?? "outro")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => TIPO_DOCUMENTO_LABEL[tipo]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_DOCUMENTO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="min-w-0 flex-1 text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">PDF ou imagem, até 15 MB.</p>
            <Button size="sm" className="shrink-0 gap-1.5" disabled={enviando} onClick={enviar}>
              {enviando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Enviar
            </Button>
          </div>
        </div>

        {documentos === null ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : documentos.length === 0 ? (
          <p className="rounded-lg bg-secondary/40 px-3 py-4 text-center text-[12.5px] text-muted-foreground">
            Nenhum documento anexado ainda.
          </p>
        ) : (
          // Só esta parte rola, e só na vertical: o cabeçalho e o envio
          // ficam sempre visíveis, por mais documentos que existam.
          <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
            {documentos.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />

                {/* Em tela larga cada informação tem sua própria coluna;
                    em tela estreita elas empilham, sem rolagem lateral. */}
                <p className="min-w-0 flex-1 truncate text-sm text-foreground" title={d.nome}>
                  {d.nome}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground sm:w-52">{TIPO_DOCUMENTO_LABEL[d.tipo]}</p>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground sm:w-24">
                  {formatarData(d.criado_em)}
                </p>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground sm:w-20 sm:text-right">
                  {d.tamanho_bytes ? formatarTamanho(d.tamanho_bytes) : "—"}
                </p>

                <div className="flex shrink-0 items-center gap-1 sm:ml-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={`Visualizar ${d.nome}`}
                    title="Visualizar"
                    disabled={processandoId === d.id}
                    onClick={() => acessar(d, "visualizar")}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={`Baixar ${d.nome}`}
                    title="Baixar"
                    disabled={processandoId === d.id}
                    onClick={() => acessar(d, "baixar")}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive"
                    aria-label={`Excluir ${d.nome}`}
                    title="Excluir"
                    disabled={processandoId === d.id}
                    onClick={() => excluir(d)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
