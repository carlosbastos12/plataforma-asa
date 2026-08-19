import type { LinhaParcela, StatusParcela } from "./tipos";

export interface FiltrosContas {
  texto: string;
  status: StatusParcela | "todos";
  classificacao: string;
  estabelecimento: string;
  de: string;
  ate: string;
}

export const FILTROS_VAZIOS: FiltrosContas = {
  texto: "",
  status: "todos",
  classificacao: "todas",
  estabelecimento: "todos",
  de: "",
  ate: "",
};

/**
 * Filtro puro, aplicado sobre as linhas já carregadas.
 *
 * O recorte por natureza (empresa/particular) NÃO acontece aqui de
 * propósito: ele é feito no servidor e no RLS, para que um bug de
 * interface nunca consiga expor uma conta particular.
 */
export function aplicarFiltros(linhas: LinhaParcela[], f: FiltrosContas): LinhaParcela[] {
  const termo = f.texto.trim().toLowerCase();

  return linhas.filter((l) => {
    if (f.status !== "todos" && l.status !== f.status) return false;
    if (f.classificacao !== "todas" && (l.classificacao_nome ?? "Sem classificação") !== f.classificacao) return false;
    if (f.estabelecimento !== "todos" && (l.estabelecimento_nome ?? "Sem estabelecimento") !== f.estabelecimento)
      return false;
    if (f.de && l.parcela_vencimento < f.de) return false;
    if (f.ate && l.parcela_vencimento > f.ate) return false;

    if (termo) {
      const alvo = [
        l.fornecedor_nome,
        l.fornecedor_cnpj,
        l.numero_documento,
        l.descricao,
        l.classificacao_nome,
        l.estabelecimento_nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!alvo.includes(termo)) return false;
    }

    return true;
  });
}

export function filtrosAtivos(f: FiltrosContas): boolean {
  return (
    f.texto.trim() !== "" ||
    f.status !== "todos" ||
    f.classificacao !== "todas" ||
    f.estabelecimento !== "todos" ||
    f.de !== "" ||
    f.ate !== ""
  );
}
