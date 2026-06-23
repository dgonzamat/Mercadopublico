/**
 * Exportar un nodo del DOM (un gráfico o el tablero completo) a PNG o PDF.
 * Las librerías se cargan con import dinámico → solo en cliente, fuera del
 * bundle inicial y sin romper el export estático.
 */

const BG = "#f7f2e8"; // token `bg` del tema

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

async function renderPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, { pixelRatio: 2, backgroundColor: BG, cacheBust: true });
}

export async function exportNodePng(node: HTMLElement, filename: string) {
  triggerDownload(await renderPng(node), filename);
}

export async function exportNodePdf(node: HTMLElement, filename: string) {
  const dataUrl = await renderPng(node);
  const { default: jsPDF } = await import("jspdf");
  const w = node.scrollWidth;
  const h = node.scrollHeight;
  const pdf = new jsPDF({
    orientation: w >= h ? "landscape" : "portrait",
    unit: "px",
    format: [w, h],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
  pdf.save(filename);
}
