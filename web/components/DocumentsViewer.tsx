import PdfDoc from "@/components/PdfDoc";
import DvidsVideo from "@/components/DvidsVideo";
import { T } from "@/components/T";
import { licenseLabel } from "@/lib/license";
import type { DocEmbed } from "@/lib/types";
import { splitLead } from "@/lib/splitLead";

/**
 * Visor de documentos primarios, compartido por la ficha de caso y el perfil de
 * actor. Un documento vive embebido en lo que respalda —un caso o un actor—, no
 * en una ficha propia (decisión del dueño, oct 2026): `description` dice qué es
 * y qué prueba.
 *
 * Auto-hospedados (PDF/imagen) inline. Same-origin porque war.gov bloquea el
 * framing/fetch de terceros; fallbackUrl deja siempre el original oficial
 * accesible. Los PDF se renderizan con un visor cliente (PdfDoc → react-pdf,
 * dynamic ssr:false) que funciona también en móvil; las imágenes siguen como
 * <img> server.
 *
 * VISOR · todo el video embebido; los PDF/imagen, con tope. Cada visor de PDF
 * ocupa 60-80vh, así que los casos agregadores se volvían inusables (39 PDF
 * medían ~30 pantallas de scroll en móvil). Los que pasan del tope van a un
 * índice compacto en un <details> nativo (sin JS, funciona igual en el export
 * estático). El tope NO aplica al video: es el asset más escaso del corpus y la
 * evidencia que la gente viene a ver. El sort es estable, así que el orden
 * autoral del JSON se conserva.
 */
const INLINE_NONVIDEO_MAX = 4;

// Una foto del lugar o del tipo de avión («Contexto · …») no es un documento
// del caso: si es lo único que hay, el rótulo no puede decir «Documentos
// primarios» (204 fichas lo decían de una foto de contexto).
const isContextDoc = (d: { title?: string }) => /^(Contexto|Context)\b/.test(d.title ?? "");

export function DocumentsViewer({ docs, locale }: { docs: DocEmbed[]; locale: "es" | "en" }) {
  if (docs.length === 0) return null;
  const docsVideo = docs.filter((d) => d.type === "video");
  const docsOther = docs.filter((d) => d.type !== "video" && d.type !== "link");
  const docsLink = docs.filter((d) => d.type === "link");
  const docsInline = [...docsVideo, ...docsOther.slice(0, INLINE_NONVIDEO_MAX)];
  const docsRest = docsOther.slice(INLINE_NONVIDEO_MAX);
  const onlyContext = docs.every(isContextDoc);
  const onlyLinks = docsLink.length === docs.length;
  return (
    <section className="space-y-6">
      <p className="text-sm font-semibold text-accent">
        {onlyLinks ? (
          <T locale={locale} es="Documentos" en="Documents" />
        ) : onlyContext ? (
          <T locale={locale} es="Imagen de contexto (no es un documento del caso)" en="Context image (not a document from the case)" />
        ) : (
          <T locale={locale} es="Documentos primarios" en="Primary documents" />
        )}
      </p>
      {docsInline
        .map((doc, i) => (
          <figure key={i} className="space-y-2">
            {doc.type === "pdf" ? (
              <PdfDoc src={doc.src} fallbackUrl={doc.fallbackUrl} />
            ) : doc.type === "video" ? (
              <DvidsVideo src={doc.src} title={doc.title_en ?? doc.title} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.src}
                alt={doc.title}
                loading="lazy"
                className="w-full border border-text/15 bg-surface-2"
              />
            )}
            <figcaption className="space-y-1">
              <p className="text-sm leading-snug text-text">
                <T locale={locale} es={doc.title} en={doc.title_en ?? doc.title} />
              </p>
              <DocDescription doc={doc} locale={locale} />
              <p className="font-mono text-[11px] text-muted">
                {[doc.source, licenseLabel(doc.license, locale)].filter(Boolean).join(" · ")}
                {doc.fallbackUrl && (
                  <>
                    {doc.source || doc.license ? " · " : ""}
                    <a
                      href={doc.fallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                    >
                      <T locale={locale} es="abrir original" en="open original" />
                    </a>
                  </>
                )}
              </p>
            </figcaption>
          </figure>
        ))}

      {/* Índice compacto del resto. <details> nativo: sin JS, así que
          funciona igual en el export estático y en móvil. Cada documento
          conserva su enlace directo, que es lo que un agregador necesita
          — un índice de 39 entradas se recorre; 39 visores de 80vh no. */}
      {docsRest.length > 0 && (
        <details className="border border-border bg-panel/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text marker:text-accent">
            <T
              locale={locale}
              es={`Ver los otros ${docsRest.length} documentos`}
              en={`Show the other ${docsRest.length} documents`}
            />
          </summary>
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {docsRest.map((doc, i) => (
              <li key={i} className="space-y-1">
                <p className="text-sm leading-snug text-text">
                  <T locale={locale} es={doc.title} en={doc.title_en ?? doc.title} />
                </p>
                <DocDescription doc={doc} locale={locale} />
                <p className="font-mono text-[11px] text-muted">
                  {[doc.source, licenseLabel(doc.license, locale)].filter(Boolean).join(" · ")}
                  {" · "}
                  <a
                    href={doc.fallbackUrl ?? doc.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                  >
                    <T locale={locale} es="abrir documento" en="open document" />
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {/* Documentos sin copia embebible: tarjeta con su descripción y el
          enlace a su mejor fuente (no siempre el original del emisor). */}
      {docsLink.map((doc, i) => (
        <div key={`l${i}`} className="space-y-2 border border-border bg-panel/50 p-4">
          <p className="text-sm font-semibold leading-snug text-text">
            <T locale={locale} es={doc.title} en={doc.title_en ?? doc.title} />
          </p>
          <DocDescription doc={doc} locale={locale} />
          <p className="font-mono text-[11px] text-muted">
            {doc.source && <>{doc.source} · </>}
            <a
              href={doc.src}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              <T locale={locale} es="ver fuente" en="view source" />
            </a>
          </p>
        </div>
      ))}
    </section>
  );
}

/** Descripción de un documento: la entrada a la vista y el resto plegado.
 *  157 fichas tenían alguna de más de 600 caracteres, y con cuatro visores
 *  seguidos las descripciones sumaban pantallas enteras (oct 2026). */
function DocDescription({ doc, locale }: { doc: DocEmbed; locale: "es" | "en" }) {
  if (!doc.description) return null;
  const w = splitLead(locale === "es" ? doc.description : doc.description_en ?? doc.description, 220);
  return (
    <div className="text-sm leading-relaxed text-muted">
      <p>{w.lead}</p>
      {w.rest && (
        <details className="mt-1">
          <summary className="cursor-pointer text-accent">
            <T locale={locale} es="Ver más" en="Read more" />
          </summary>
          <p className="mt-1">{w.rest}</p>
        </details>
      )}
    </div>
  );
}
