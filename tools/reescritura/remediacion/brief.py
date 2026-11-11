"""Arma el brief de un agente del lote a partir de plantillas/, sin copiar el del lote anterior.

uso: brief.py <tipo> <L> [--atencion "…"] [--nt 2] [--c <dir>]
  tipo: corrector | verificador | lector | fuente | verif-fuente | integra-propia | clasificacion
  L: carpeta absoluta del lote (en el scratchpad de la sesión)
Escribe L/brief-<tipo>.md (el del lector, en L/reaud/brief.md; el de clasificación, en <c>/brief.md)
e imprime la ruta. Las preguntas de fuente salen de L/parche.json (requiere_fuente) y de los
defectos ALTA de los lectores (L/reaud/lector/*.md).
"""
import argparse, datetime, glob, json, os, re

R = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("tipo")
ap.add_argument("L")
ap.add_argument("--atencion", default="ninguna en particular.")
ap.add_argument("--nt", default="dos")
ap.add_argument("--c")
ap.add_argument("--tandas", nargs="*", default=[],
                help="verificador y verif-fuente: otras carpetas L del mismo lote; un solo agente las verifica todas")
a = ap.parse_args()
L = a.L.rstrip("/")
TODAS = [L] + [x.rstrip("/") for x in a.tandas]
t = open(f"{R}/plantillas/{a.tipo}.md").read()
out = f"{L}/brief-{a.tipo}.md"


def fichas(p):
    return json.load(open(p))["fichas"]


if a.tipo == "corrector":
    paq = sorted(glob.glob(f"{L}/paquete-*.txt"))
    t = t.replace("{NF}", str(len(fichas(f"{L}/paquete.json")) if os.path.exists(f"{L}/paquete.json") else "?"))
    t = t.replace("{PAQUETES}", "\n".join("  " + os.path.basename(p) for p in paq))
elif a.tipo == "verificador":
    t = t.replace("{NF}", str(sum(len(fichas(f"{x}/parche.json")) for x in TODAS)))
    if a.tandas:
        vs = [p for x in TODAS for p in sorted(glob.glob(f"{x}/verif-*.txt"))]
        t = t.replace("{L}/verif-N.txt (solo los que existan en la carpeta)", "de esta lista: " + ", ".join(vs))
        t = t.replace("Como mucho 9 llamadas", f"Como mucho {len(vs) + 6} llamadas")
elif a.tipo == "lector":
    os.makedirs(f"{L}/reaud/lector", exist_ok=True)
    t = t.replace("{NT}", a.nt)
    out = f"{L}/reaud/brief.md"
elif a.tipo == "fuente":
    qs = [f"- {f['id']}: {q}" for f in fichas(f"{L}/parche.json") for q in f.get("requiere_fuente", [])]
    for p in sorted(glob.glob(f"{L}/reaud/lector/*.md")):
        i = os.path.basename(p)[:-3]
        for tipo, txt in re.findall(r"DEFECTO: ALTA \| ([^|\n]+)\| ([^\n]+)", open(p).read()):
            qs.append(f"- {i}: [defecto ALTA de la prueba de lectura, tipo {tipo.strip()}] {txt.strip()} "
                      "Resuélvelo en la prosa con lo que diga la fuente.")
    t = t.replace("{N}", str(len(qs))).replace("{PREGUNTAS}", "\n".join(qs))
elif a.tipo == "verif-fuente":
    rs = [r for x in TODAS for r in json.load(open(f"{x}/fuente.json"))["respuestas"]]
    t = t.replace("{N}", str(len(rs))).replace("{NF}", str(len({r["id"] for r in rs})))
    if a.tandas:
        t = t.replace("Lee {L}/fuente.json:", "Lee cada uno de estos archivos (uno por tanda del lote): "
                      + ", ".join(f"{x}/fuente.json" for x in TODAS) + ":")
        t = t.replace("las descargas del agente, en {L}/fuente/", "las descargas de los agentes, en "
                      + ", ".join(f"{x}/fuente/" for x in TODAS))
        t = t.replace("como mucho 12 consultas", f"como mucho {8 * len(TODAS)} consultas")
elif a.tipo == "clasificacion":
    if not a.c:
        raise SystemExit("clasificacion exige --c <dir> (con orig/ dentro)")
    os.makedirs(f"{a.c}/posterior", exist_ok=True)
    t = t.replace("{C}", a.c.rstrip("/")).replace("{FECHA}", datetime.date.today().isoformat())
    out = f"{a.c.rstrip('/')}/brief.md"
t = t.replace("{L}", L).replace("{ATENCION}", a.atencion)
left = re.findall(r"\{[A-Z]+\}", t)
if left:
    raise SystemExit(f"marcadores sin rellenar: {left}")
open(out, "w").write(t)
print(out)
