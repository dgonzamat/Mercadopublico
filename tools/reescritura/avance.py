"""Datos del panel «Avance de deuda UAP Codex» (https://claude.ai/artifact/6sozxb2TnQwbpFVfWVj71v).
Escribe <salida>/{categorias,fichas_tier,sondas,deuda_pendiente}.json midiendo en el momento: fichas remediadas
(tools/reescritura/remediacion/remediadas.json), hallazgos de página del tablero (dash.py →
auditdash/transversales.json), decisiones del dueño (deuda/deuda.json), las sondas E57, E59
y E60 de audit-consistency.mjs, y la deuda pendiente (avisos de la auditoría y partidas abiertas
de web/data/debt-manual.json). Uso: avance.py <salida>"""
import json, glob, collections, subprocess, re, sys, os, datetime
REPO = "/home/user/Mercadopublico"
D = "/home/user/Mercadopublico/tools/reescritura/datos"  # datos de la auditoría del 6 nov 2026, versionados
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
hoy = datetime.date.today().isoformat()

cs = {c["id"]: c for c in (json.load(open(f)) for f in glob.glob(f"{REPO}/web/data/cases/*.json"))}
reg = json.load(open(f"{REPO}/tools/reescritura/remediacion/remediadas.json"))
hechas = {i for v in reg["lotes"].values() for i in v}
ver = {f["ficha"]: f["veredicto"] for f in json.load(open(f"{D}/fichas.json"))}
defs = json.load(open(f"{D}/defectos.json"))
alta = collections.Counter(d["ficha"] for d in defs if d["factor"] == "prosa" and d["gravedad"] == "ALTA")

# Fichas por tier. Aplazado (decisión del dueño, 5 nov): Tier B sin ALTA ni veredicto APROBADA (las reescrituras Tier B se cerraron el 11 nov).
tiers = []
for t in "SAB":
    ids = [i for i in cs if cs[i]["tier"] == t]
    h = [i for i in ids if i in hechas]
    # Primero las aprobadas: una Tier B APROBADA no tiene ALTA y caía como aplazada (Vilas-Boas, Florencia, 11 nov 2026).
    ok = [i for i in ids if i not in hechas and ver.get(i) == "APROBADA"]
    ap = [i for i in ids if i not in hechas and i not in ok and t == "B" and (not alta[i] or ver.get(i) == "REESCRIBIR")]
    pend = [i for i in ids if i not in hechas and i not in ap and i not in ok]
    tiers.append({"tier": t, "fichas": len(ids), "remediadas": len(h), "aprobadas_sin_tocar": len(ok),
                  "pendientes": len(pend), "aplazadas": len(ap)})

# Hallazgos de página que se repiten en todo el sitio.
trans = json.load(open(f"{D}/transversales.json"))
cerrado = lambda e: e.startswith(("Hecho", "Descartado", "Decidido"))
t_hecho = sum(cerrado(x["estado"]) for x in trans)
t_curso = sum(x["estado"].startswith(("Parcial", "En el PR", "En curso")) for x in trans)

# Decisiones del dueño (panel de deuda).
deuda = json.load(open(f"{D}/deuda.json"))
dec = [r for r in deuda if r["categoria"] == "Decisiones del dueño" or r["estado"] == "Espera al dueño"]
d_pend = sum(r["estado"] == "Espera al dueño" for r in dec)

# Sondas: lo que miden hoy y lo que medían al nacer (5 nov 2026).
# El índice de búsqueda es gitignored: sin generarlo, E40 avisa de que está ciega y se contaría como deuda.
subprocess.run(["node", "scripts/build-search-index.mjs"], cwd=f"{REPO}/web", capture_output=True)
audit = subprocess.run(["node", "scripts/audit-consistency.mjs"], cwd=f"{REPO}/web", capture_output=True, text=True).stdout
def n(pat):
    m = re.search(pat, audit)
    return int(m.group(1).replace(".", "")) if m else 0
e59 = n(r"E59 párrafos de más de 900 caracteres: (\d+)")
e60 = sum(int(x) for x in re.findall(r"(?:campo|trabajo|URL cruda): (\d+) en", audit))
e57 = n(r"E57 enlace a otro caso usado como sustantivo: (\d+)")
sondas = [
    {"sonda": "E59", "mide": "Párrafos de más de 900 caracteres (muros en el móvil)", "al_crearse": 960, "hoy": e59},
    {"sonda": "E60", "mide": "Notas del redactor, nombres de campos y URL crudas en fuentes y documentos", "al_crearse": 103, "hoy": e60},
    {"sonda": "E57", "mide": "Enlaces a otro caso usados como sustantivo", "al_crearse": 6, "hoy": e57},
]

fichas_total = sum(x["fichas"] for x in tiers)

# Relectura completa: hasta el 10 nov 2026 la prueba de lectura era de muestra (2 fichas por lote, #1265).
# remediadas.json lista los lotes sin relectura completa documentada y las fichas releídas que esperan retoques.
sin_lect = {i for k in reg.get("relectura_sin_documentar", []) for i in reg["lotes"].get(k, [])} & set(cs)
retocar = [i for i in reg.get("retocar_tras_relectura", []) if i in cs]
categorias = [
    {"categoria": "Prosa de las fichas", "unidad": "fichas",
     "hecho": sum(x["remediadas"] + x["aprobadas_sin_tocar"] for x in tiers), "en_curso": 0,
     "pendiente": sum(x["pendientes"] for x in tiers), "aplazado": sum(x["aplazadas"] for x in tiers),
     "nota": "Corrector, verificador contra la fuente y prueba de lectura. La lectura completa de cada ficha empezó el 10 nov 2026; la deuda que dejó la de muestra va en la fila siguiente."},
    {"categoria": "Relectura de cada ficha", "unidad": "fichas",
     "hecho": len(hechas & set(cs)) - len(sin_lect), "en_curso": 0, "pendiente": len(sin_lect), "aplazado": 0,
     "nota": "Fichas remediadas antes del 10 nov 2026 cuyo lote solo tuvo lectura de muestra (2 por lote) y no tiene relectura completa documentada."},
    {"categoria": "Retoques tras la relectura", "unidad": "fichas",
     # Mantenimiento, no deuda (decisión del dueño, 12 nov 2026): los retoques se hacen cuando una ficha se toca por otro motivo.
     "hecho": len([i for i in reg.get("retocadas_tras_relectura", []) if i in cs]), "en_curso": 0, "pendiente": 0, "aplazado": len(retocar),
     "nota": "Mantenimiento, no deuda (decisión del dueño, 12 nov 2026): los defectos graves ya se corrigieron con la fuente; lo que queda es estilo y estructura, y se retoca cuando la ficha se toca por otro motivo."},
    {"categoria": "Página en el móvil", "unidad": "hallazgos",
     "hecho": t_hecho, "en_curso": t_curso, "pendiente": len(trans) - t_hecho - t_curso, "aplazado": 0,
     "nota": "Defectos que se repiten en todo el sitio, del tablero de la auditoría."},
    {"categoria": "Sondas automáticas", "unidad": "casos",
     "hecho": sum(max(s["al_crearse"] - s["hoy"], 0) for s in sondas), "en_curso": 0,
     "pendiente": sum(s["hoy"] for s in sondas), "aplazado": 0,
     "nota": "Casos que marcan E57, E59 y E60; bajan a medida que los lotes los corrigen."},
    {"categoria": "Decisiones del dueño", "unidad": "decisiones",
     "hecho": len(dec) - d_pend, "en_curso": 0, "pendiente": d_pend, "aplazado": 0,
     "nota": "Decisiones editoriales registradas en el panel de deuda."},
]

# Deuda pendiente, partida por partida: los avisos que la auditoría da hoy y las partidas abiertas de
# web/data/debt-manual.json (las que el informe de deuda lleva a mano). Una partida está cerrada si su
# estado empieza por hecho, resuelto, revertido, cerrado o «no generado».
CERRADA = ("hecho", "resuelto", "revertido", "cerrad", "no generado")
manual = json.load(open(f"{REPO}/web/data/debt-manual.json"))
items = [(g["group"], it) for g in manual for it in g["items"]]
deuda_pend = [{"partida": it["id"], "que": it["title"], "estado": it["state"], "origen": f"Deuda a mano · {grp}"}
              for grp, it in items if not it["state"].lower().startswith(CERRADA)]
for l in re.findall(r"^\s+\S+:\d+\s+((E\d+[a-z]?)\s.*)$", audit.split("WARNINGS")[-1], re.M) if "WARNINGS" in audit else []:
    deuda_pend.append({"partida": l[1], "que": l[0], "estado": "aviso de la auditoría", "origen": "audit-consistency"})
categorias.append({"categoria": "Deuda pendiente", "unidad": "partidas",
                   "hecho": len(items) - sum(d["origen"].startswith("Deuda a mano") for d in deuda_pend), "en_curso": 0,
                   "pendiente": len(deuda_pend), "aplazado": 0,
                   "nota": "Partidas del informe de deuda (npm run deuda): las que se llevan a mano y los avisos de la auditoría. El detalle está en la tabla de abajo."})
for c in categorias:
    c["total"] = c["hecho"] + c["en_curso"] + c["pendiente"] + c["aplazado"]
    c["medido"] = hoy
json.dump(categorias, open(f"{out}/categorias.json", "w"), ensure_ascii=False, indent=1)
json.dump(tiers, open(f"{out}/fichas_tier.json", "w"), ensure_ascii=False, indent=1)
json.dump(sondas, open(f"{out}/sondas.json", "w"), ensure_ascii=False, indent=1)
json.dump(deuda_pend, open(f"{out}/deuda_pendiente.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps({"categorias": categorias, "tiers": tiers, "sondas": sondas, "deuda_pendiente": deuda_pend}, ensure_ascii=False, indent=1))
