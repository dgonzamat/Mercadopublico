/**
 * Player de video de DVIDS (Defense Visual Information Distribution Service),
 * el mirror oficial del DoD para el material audiovisual de PURSUE.
 *
 * Es la ÚNICA excepción al invariante same-origin del visor, y es forzada: los
 * videos PURSUE pesan >150MB y DVIDS no publica renditions menores (medido en
 * PR051: 154MB, y los patrones de bitrate dan 404), así que no caben ni en
 * /pursue (30MB) ni en el bucket Supabase (30-50MB). El endpoint
 * `/video/embed/<id>` responde sin `x-frame-options` ni `frame-ancestors`
 * mientras el resto de dvidshub.net va con DENY — el embed es deliberado.
 *
 * Server component: es un iframe estático, no necesita JS de cliente. La
 * relación de aspecto se fija con `aspect-video` para que no haya salto de
 * layout mientras carga (CLS), y el `title` es lo que anuncian los lectores de
 * pantalla, así que recibe el del documento y no un genérico.
 */
export default function DvidsVideo({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  return (
    <div className="aspect-video w-full border border-text/15 bg-surface-2">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        // DVIDS sirve el player desde su propio origen; el sandbox permite lo
        // mínimo para que reproduzca (scripts + fullscreen) sin concederle
        // same-origin sobre uapcodex.org.
        allow="encrypted-media; fullscreen; picture-in-picture"
        className="h-full w-full"
      />
    </div>
  );
}
