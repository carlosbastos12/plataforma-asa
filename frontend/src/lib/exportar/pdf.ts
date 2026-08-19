import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exportação em PDF dos relatórios financeiros.
 *
 * Layout pensado para impressão e para anexar em e-mail à contabilidade:
 * cabeçalho com identificação e período, totais em destaque, tabela
 * legível e rodapé paginado com data/hora de emissão.
 */

export interface SecaoResumo {
  rotulo: string;
  valor: string;
}

export interface OpcoesPdf {
  titulo: string;
  subtitulo?: string;
  periodo?: string;
  resumo?: SecaoResumo[];
  colunas: string[];
  linhas: (string | number)[][];
  /** Índices das colunas que devem ficar alinhadas à direita (valores). */
  colunasNumericas?: number[];
  nomeArquivo: string;
  /** Aviso destacado — usado para afirmar a exclusão das contas particulares. */
  aviso?: string;
  paisagem?: boolean;
}

const AZUL: [number, number, number] = [20, 93, 168]; // --primary institucional
const CINZA_TEXTO: [number, number, number] = [90, 100, 115];
const CINZA_CLARO: [number, number, number] = [244, 246, 249];

export function baixarPdf(opcoes: OpcoesPdf) {
  const doc = new jsPDF({
    orientation: opcoes.paisagem ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const margem = 36;
  let y = 44;

  // ---- Cabeçalho -----------------------------------------------------
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, larguraPagina, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(20, 30, 45);
  doc.text(opcoes.titulo, margem, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...CINZA_TEXTO);
  doc.text("ASA Reboques — Central de Gestão Administrativa e Financeira", margem, y);

  if (opcoes.subtitulo) {
    y += 12;
    doc.text(opcoes.subtitulo, margem, y);
  }
  if (opcoes.periodo) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text(`Período: ${opcoes.periodo}`, margem, y);
    doc.setFont("helvetica", "normal");
  }

  // ---- Aviso (ex.: particulares excluídas) ---------------------------
  if (opcoes.aviso) {
    y += 16;
    doc.setFillColor(...CINZA_CLARO);
    const altura = 20;
    doc.roundedRect(margem, y - 12, larguraPagina - margem * 2, altura, 3, 3, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(...AZUL);
    doc.text(opcoes.aviso, margem + 8, y + 1.5);
    doc.setTextColor(...CINZA_TEXTO);
    y += altura - 4;
  }

  // ---- Resumo em blocos ----------------------------------------------
  if (opcoes.resumo?.length) {
    y += 18;
    const colunas = Math.min(opcoes.resumo.length, 4);
    const larguraBloco = (larguraPagina - margem * 2) / colunas;

    opcoes.resumo.forEach((item, i) => {
      const linha = Math.floor(i / colunas);
      const coluna = i % colunas;
      const x = margem + coluna * larguraBloco;
      const yb = y + linha * 34;

      doc.setFontSize(7.5);
      doc.setTextColor(...CINZA_TEXTO);
      doc.text(item.rotulo.toUpperCase(), x, yb);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 30, 45);
      doc.text(item.valor, x, yb + 14);
      doc.setFont("helvetica", "normal");
    });

    y += Math.ceil(opcoes.resumo.length / colunas) * 34 + 4;
  }

  // ---- Tabela ---------------------------------------------------------
  const estilosColuna: Record<number, { halign: "right" }> = {};
  for (const i of opcoes.colunasNumericas ?? []) estilosColuna[i] = { halign: "right" };

  autoTable(doc, {
    startY: y + 6,
    head: [opcoes.colunas],
    body: opcoes.linhas.map((l) => l.map((c) => (c === null || c === undefined ? "" : String(c)))),
    margin: { left: margem, right: margem, bottom: 40 },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4.5, textColor: [35, 45, 60], lineColor: [225, 230, 238], lineWidth: 0.5 },
    headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.8 },
    alternateRowStyles: { fillColor: [249, 250, 252] },
    columnStyles: estilosColuna,
  });

  // ---- Rodapé paginado ------------------------------------------------
  const emitidoEm = new Date().toLocaleString("pt-BR");
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const alturaPagina = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA_TEXTO);
    doc.text(`Emitido em ${emitidoEm} · Plataforma ASA`, margem, alturaPagina - 20);
    doc.text(`Página ${p} de ${total}`, larguraPagina - margem, alturaPagina - 20, { align: "right" });
  }

  const nome = opcoes.nomeArquivo.endsWith(".pdf") ? opcoes.nomeArquivo : `${opcoes.nomeArquivo}.pdf`;
  doc.save(nome);
}
