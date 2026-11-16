import { T } from "@/components/T";
import type { Location } from "@/lib/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * «Dónde ocurrió»: mapa de la región del suceso, un SVG estático que genera
 * scripts/build-maps.mjs (16 nov 2026). Va al cierre de «Qué pasó», cuando el
 * lector ya sabe qué pasó, para no retrasar «Qué fue» ni el relato. Respeta
 * `location.precision`: punto si es exacto, zona si es aproximado y nada si la
 * fuente no revela el lugar o el suceso no fue en tierra.
 */
export function RegionMap({ id, location, locale }: { id: string; location: Location; locale: "es" | "en" }) {
  if (location.precision === "none") return null;
  const place = locale === "es" ? location.place : location.place_en ?? location.place;
  const exact = location.precision === "exact";
  return (
    <figure className="space-y-3">
      <p className="text-sm font-semibold text-muted">
        <T locale={locale} es="Dónde ocurrió" en="Where it happened" />
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/maps/${locale}/${id}.svg`}
        alt={locale === "es" ? `Mapa de la región: ${place ?? ""}` : `Map of the region: ${place ?? ""}`}
        width={640}
        height={360}
        loading="lazy"
        className="block h-auto w-full border border-border"
      />
      <figcaption className="text-xs leading-snug text-muted">
        {place && <>{place} · </>}
        {exact ? (
          <T locale={locale} es="el punto rojo marca el lugar del suceso; los grises, otros casos del archivo en la región." en="the red dot marks the place of the incident; the gray dots, other cases in the archive nearby." />
        ) : (
          <T locale={locale} es="la zona marca el área aproximada del suceso; la fuente no da un lugar exacto." en="the shaded zone marks the approximate area of the incident; the source gives no exact place." />
        )}
      </figcaption>
    </figure>
  );
}
