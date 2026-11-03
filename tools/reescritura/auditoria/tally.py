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
    fu = f"{d}/lector/{i}-ui.md"; ui = None
    if os.path.exists(fu):
        tu = open(fu).read()
        r = re.findall(r"VEREDICTO-UI:\s*\**\s*(BIEN|AJUSTAR|REHACER)", tu, re.I); ui = r[-1].upper() if r else None
        defs += [{"gravedad": g.upper(), "tipo": ty.strip().lower(), "detalle": de.strip()[:300]}
                 for g, ty, de in re.findall(r"DEFECTO:\s*\**\s*(ALTA|MEDIA|BAJA)\s*\|\s*(ui-[^|\n]+?)\s*\|\s*([^\n]+)", tu, re.I)]
    # Lo que se repite en todas las fichas se registra una vez como transversal (dash.py), no por ficha.
    TRANSV = re.compile(r"pie (del sitio |de página )?(sale |va |est[aá] )?(entero )?en inglés|footer|THE PROJECT|\bDEV\b|cookies|#418|hidrataci|Sin caus|r[oó]tulo[^|]{0,40}(barra|reparto)[^|]{0,40}cort|(barra|reparto)[^|]{0,60}cortad|fisionom|solo (el )?(icono|flecha|glifo)|«\(↗\)»|\(↗, ↗\)|«\(véase ↗\)»|comillas simples rectas|Actores asociados|tarjeta de actor|whatHappened|whyMatters|classBasis|(c[oó]digo|identificador) interno «(sin-forma|robotica|gris|humanoide|[a-z-]+)»", re.I)
    # Commons limita (429) al contenedor de captura: una imagen suya que no carga no prueba nada del sitio.
    ENTORNO = re.compile(r"(Commons|wikimedia|Halt_Memorandum|Nave_Espacial|memor[aá]ndum[^|]{0,40}Halt)[^|]{0,120}(no carga|rota|roto)|(no carga|rota|roto)[^|]{0,120}(Commons|wikimedia|Halt)", re.I)
    for d_ in defs:
        if d_["tipo"].startswith("ui-") and ENTORNO.search(d_["detalle"]): d_["tipo"] = "ui-entorno"
        elif d_["tipo"].startswith("ui-") and TRANSV.search(d_["detalle"]): d_["tipo"] = "ui-transversal"
    sev = lambda ds: next((g for g in ("ALTA", "MEDIA", "BAJA") if any(d["gravedad"] == g for d in ds)), "NINGUNA")
    grav = sev([d for d in defs if not d["tipo"].startswith("ui-")])  # prosa y página se miden aparte
    grav_ui = sev([d for d in defs if d["tipo"].startswith("ui-") and d["tipo"] not in ("ui-transversal", "ui-entorno")]) if ui else None
    if v == "REESCRIBIR": grav = "ALTA"
    res.append({"id": i, "tier": t, "veredicto": v, "veredicto_ui": ui, "gravedad": grav, "gravedad_ui": grav_ui, "defectos": defs})
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
