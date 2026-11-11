"""Elige el próximo lote de remediación según el orden aprobado por el dueño (5 nov 2026):
1) Tier S pendientes; 2) Tier A con defectos ALTA de prosa (más ALTA primero), sin las de
veredicto REESCRIBIR; 3) reescrituras Tier A; 4) Tier B con defectos ALTA (desde el 9 nov 2026, agotados los tramos
anteriores); 5) reescrituras Tier B. Las Tier B que solo tienen MEDIA o BAJA quedan aplazadas. Las fichas ya
remediadas salen de remediadas.json. Uso: elegir_lote.py [n=10]"""
import json, glob, sys, collections, os
D = "/home/user/Mercadopublico/tools/reescritura/datos"  # datos de la auditoría del 6 nov 2026, versionados
R = os.path.dirname(os.path.abspath(__file__))
n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
reg = json.load(open(f"{R}/remediadas.json"))
hechas = {i for v in reg["lotes"].values() for i in v}
cs = {c["id"]: c for c in (json.load(open(f)) for f in glob.glob("/home/user/Mercadopublico/web/data/cases/*.json"))}
ver = {f["ficha"]: f["veredicto"] for f in json.load(open(f"{D}/fichas.json"))}
defs = json.load(open(f"{D}/defectos.json"))
alta = collections.Counter(d["ficha"] for d in defs if d["factor"] == "prosa" and d["gravedad"] == "ALTA")
total = collections.Counter(d["ficha"] for d in defs if d["factor"] == "prosa")
pend = [i for i in cs if i not in hechas and ver.get(i) != "APROBADA"]
tramos = [
    ("Tier S", sorted([i for i in pend if cs[i]["tier"] == "S"], key=lambda i: (-alta[i], -total[i]))),
    ("Tier A con ALTA", sorted([i for i in pend if cs[i]["tier"] == "A" and alta[i] and ver.get(i) != "REESCRIBIR"], key=lambda i: (-alta[i], -total[i]))),
    ("Reescrituras Tier A (método de reescritura, no de corrección)", [i for i in pend if cs[i]["tier"] == "A" and ver.get(i) == "REESCRIBIR"]),
    ("Tier B con ALTA", sorted([i for i in pend if cs[i]["tier"] == "B" and alta[i] and ver.get(i) != "REESCRIBIR"], key=lambda i: (-alta[i], -total[i]))),
    ("Reescrituras Tier B (método de reescritura, no de corrección)", [i for i in pend if cs[i]["tier"] == "B" and ver.get(i) == "REESCRIBIR"]),
]
# Si un tramo de corrección no llena el lote, se completa con el siguiente de corrección;
# el de reescrituras usa otro método y nunca se mezcla.
lote, nombres = [], []
for nombre, ids in tramos:
    if not ids or len(lote) >= n:
        continue
    if nombre.startswith("Reescrituras") and lote:
        break
    nombres.append(nombre)
    lote += ids[:n - len(lote)]
    if nombre.startswith("Reescrituras"):
        break
tramo = " + ".join(nombres) or None
print(json.dumps({"tramo": tramo, "lote": lote, "pendientes_por_tramo": {k: len(v) for k, v in tramos}}, ensure_ascii=False, indent=1))
