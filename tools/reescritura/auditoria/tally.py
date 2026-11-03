"""Cuenta los veredictos de una muestra (línea final «VEREDICTO: APROBADA|RETOCAR|REESCRIBIR»
de cada informe del lector) y la añade a historial.json. Uso: tally.py <dir_muestra>"""
import json, re, sys, os
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = sys.argv[1]; m = json.load(open(f"{d}/muestra.json"))
res = []
for t, i in m["fichas"]:
    f = f"{d}/lector/{i}.md"
    v = None
    if os.path.exists(f):
        r = re.findall(r"VEREDICTO:\s*\**\s*(APROBADA|RETOCAR|REESCRIBIR)", open(f).read(), re.I)
        v = r[-1].upper() if r else None
        txt = open(f).read()
    defs = [{"gravedad": g.upper(), "tipo": ty.strip().lower(), "detalle": de.strip()[:300]}
            for g, ty, de in re.findall(r"DEFECTO:\s*\**\s*(ALTA|MEDIA|BAJA)\s*\|\s*([^|\n]+?)\s*\|\s*([^\n]+)", txt if os.path.exists(f) else "", re.I)]
    grav = next((g for g in ("ALTA", "MEDIA", "BAJA") if any(d["gravedad"] == g for d in defs)), "NINGUNA")
    if v == "REESCRIBIR": grav = "ALTA"
    res.append({"id": i, "tier": t, "veredicto": v, "gravedad": grav, "defectos": defs})
falta = [r["id"] for r in res if not r["veredicto"]]
if falta: sys.exit(f"sin veredicto: {falta}")
h = f"{S}/muestras/historial.json"
hist = json.load(open(h)) if os.path.exists(h) else []
key = m.get("muestra", m["fecha"])
if any(x.get("muestra", x["fecha"]) != key and x["fecha"] == m["fecha"] and {f["id"] for f in x["fichas"]} & {r["id"] for r in res} for x in hist): sys.exit("fichas repetidas con otra muestra")
hist = sorted([x for x in hist if x.get("muestra", x["fecha"]) != key] + [{"fecha": m["fecha"], "muestra": key, "fichas": res}], key=lambda x: x.get("muestra", x["fecha"]))
json.dump(hist, open(h, "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(m["fecha"], Counter(r["veredicto"] for r in res), Counter(r["gravedad"] for r in res), Counter(d["tipo"] for r in res for d in r["defectos"]).most_common(6))
