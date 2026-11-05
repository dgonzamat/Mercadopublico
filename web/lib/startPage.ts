/** Página en la que abre el visor: la que declara el documento (`page`), o la 1
 *  si no declara ninguna, si es inválida o si el PDF tiene menos páginas.
 *  Nace de la auditoría de página (nov 2026): en ~15 fichas el visor abría en
 *  la portada de documentos de cientos de páginas y no en la del caso. */
export function startPage(page: number | undefined, numPages?: number): number {
  if (!Number.isInteger(page) || (page as number) < 1) return 1;
  if (numPages !== undefined && numPages > 0 && (page as number) > numPages) return 1;
  return page as number;
}
