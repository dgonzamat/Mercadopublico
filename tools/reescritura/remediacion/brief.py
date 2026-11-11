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
a = ap.parse_args()
L = a.L.rstrip("/")
t = open(f"{R}/plantillas/{a.tipo}.md").read()
out = f"{L}/brief-{a.tipo}.md"


def fichas(p):
    return json.load(open(p))["fichas"]


if a.tipo == "corrector":
    paq = sorted(glob.glob(f"{L}/paquete-*.txt"))
    t = t.replace("{NF}", str(len(fichas(f"{L}/paquete.json")) if os.path.exists(f"{L}/paquete.json") else "?"))
    t = t.replace("{PAQUETES}", "\n".join("  " + os.path.basename(p) for p in paq))
elif a.tipo == "verificador":
    t = t.replace("{NF}", str(len(fichas(f"{L}/parche.json"))))
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
    rs = json.load(open(f"{L}/fuente.json"))["respuestas"]
    t = t.replace("{N}", str(len(rs))).replace("{NF}", str(len({r["id"] for r in rs})))
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
