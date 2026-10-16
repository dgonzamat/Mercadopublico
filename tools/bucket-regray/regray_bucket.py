"""Recomprime en gris los PDF del bucket Supabase `pursue` y los vuelve a subir
con el mismo nombre (la URL pública no cambia, así que las fichas y el
manifiesto siguen valiendo).

Por qué existe: el bucket ocupa el 91 % del gigabyte del plan free (E38). La
mayoría de sus PDF son JPEG en color de documentos en blanco y negro; pasarlos a
gris a ~115 ppp (150 si el escaneo es de 600) con desenfoque 0,6 y JPEG q50 los deja en la mitad, con las
mismas páginas y la misma capa de texto (prueba del 16 oct 2026: 15,7 → 7,7 MB).
Mismo método que el `regray` de /pursue descrito en CLAUDE.md (Deploy).

Uso (en la máquina del dueño; la subida exige la clave de servicio):
    pip install pymupdf pillow
    export SUPABASE_URL=https://hgbvdqckoosxesixhepr.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=...        # Settings → API; no la commitees
    python regray_bucket.py --dry-run           # descarga, recomprime y mide; no sube nada
    python regray_bucket.py                     # además sube los que mejoran

Comprobaciones antes de subir cada fichero: mismo nº de páginas, misma capa de
texto carácter a carácter y al menos un 10 % de ahorro; si algo falla, no se toca.
Los nombres de FLIP están escaneados en espejo y se voltean al recomprimir.
Al terminar, regenera el manifiesto (`data/pursue-bucket-manifest.json`) para que
E38 lea el peso nuevo.
"""
import io, json, os, sys, tempfile, urllib.request
import pymupdf
from PIL import Image, ImageFilter, ImageOps

BUCKET = "pursue"
PPI, BLUR, Q = 115, 0.6, 50
# Los escaneos de 600 ppp van a 150 y no a 115: la letra pequeña de un
# formulario se vuelve ilegible (CLAUDE.md, Deploy).
PPI_HIRES, HIRES_FROM = 150, 500
# Escaneos en espejo (texto y sellos invertidos), comprobados a ojo.
FLIP = {"65_hs1-834228961_62-hq-83894_section_10__part2of2.pdf"}

URL = os.environ.get("SUPABASE_URL", "https://hgbvdqckoosxesixhepr.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DRY = "--dry-run" in sys.argv


def api(method, path, body=None, ctype="application/json"):
    req = urllib.request.Request(URL + path, data=body, method=method)
    req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("apikey", KEY)
    if body is not None:
        req.add_header("Content-Type", ctype)
    if method == "PUT":
        req.add_header("x-upsert", "true")
    with urllib.request.urlopen(req) as r:
        return r.read()


def list_objects():
    if KEY:
        body = json.dumps({"prefix": "", "limit": 1000}).encode()
        return [o["name"] for o in json.loads(api("POST", f"/storage/v1/object/list/{BUCKET}", body))]
    # Sin clave (solo --dry-run): la lista del manifiesto del repo.
    here = os.path.dirname(os.path.abspath(__file__))
    m = json.load(open(os.path.join(here, "..", "..", "web", "data", "pursue-bucket-manifest.json")))
    return [o if isinstance(o, str) else o["name"] for o in m["objects"]]


def regray(src, dst, flip):
    doc = pymupdf.open(src)
    seen = set()
    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen or img[1]:
                continue
            seen.add(xref)
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            r = max(rects, key=lambda r: r.width * r.height)
            w, h = img[2], img[3]
            cur = w / (r.width / 72) if r.width else 0
            ppi = PPI_HIRES if cur >= HIRES_FROM else PPI
            pix = pymupdf.Pixmap(doc, xref)
            if pix.alpha:
                pix = pymupdf.Pixmap(pix, 0)
            if pix.n > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
            if cur > ppi:
                f = ppi / cur
                im = im.resize((max(1, round(w * f)), max(1, round(h * f))), Image.LANCZOS)
            if flip:
                im = ImageOps.mirror(im)
            im = im.filter(ImageFilter.GaussianBlur(BLUR))
            b = io.BytesIO()
            im.save(b, "JPEG", quality=Q, optimize=True)
            page.replace_image(xref, stream=b.getvalue())
    doc.save(dst, garbage=4, deflate=True)


def text_of(p):
    return "".join(pg.get_text() for pg in pymupdf.open(p))


def main():
    names = [n for n in list_objects() if n.endswith(".pdf")]
    before = after = 0
    with tempfile.TemporaryDirectory() as tmp:
        for n in names:
            src, dst = os.path.join(tmp, "in.pdf"), os.path.join(tmp, "out.pdf")
            urllib.request.urlretrieve(f"{URL}/storage/v1/object/public/{BUCKET}/{n}", src)
            regray(src, dst, n in FLIP)
            a, b = os.path.getsize(src), os.path.getsize(dst)
            ok = (pymupdf.open(src).page_count == pymupdf.open(dst).page_count
                  and text_of(src) == text_of(dst) and b < a * 0.9)
            before += a
            after += b if ok else a
            state = "ok" if ok else "SIN CAMBIO"
            if ok and not DRY:
                api("PUT", f"/storage/v1/object/{BUCKET}/{n}", open(dst, "rb").read(), "application/pdf")
                state = "subido"
            print(f"{a/1e6:7.1f} → {b/1e6:7.1f} MB  {state:10}  {n}", flush=True)
    print(f"\nTotal: {before/1e6:.1f} → {after/1e6:.1f} MB ({'simulación' if DRY else 'subido'})")


if __name__ == "__main__":
    if not KEY and not DRY:
        sys.exit("Falta SUPABASE_SERVICE_ROLE_KEY (o usa --dry-run).")
    main()
