"""Paquete reducido: solo los párrafos que tocan los defectos de la auditoría (y su par EN),
más el resumen y los párrafos largos. Uso: paquete2.py <salida.json> <id>..."""
import json, re, sys
D = "/home/user/Mercadopublico/tools/reescritura/datos"  # datos de la auditoría del 6 nov 2026, versionados
W = "/home/user/Mercadopublico/web/data/cases"
LIM = 900
defs = json.load(open(f"{D}/defectos.json"))
PROSA = ["whatHappened", "whyMatters"]
def claves(det):
    q = re.findall(r"«([^»]{4,})»", det)
    q = [x.split("…")[0].strip()[:40] for x in q]
    pass
    return [x for x in q if len(x) >= 4]
out = []
for i in sys.argv[2:]:
    c = json.load(open(f"{W}/{i}.json"))
    ds = [d for d in defs if d["ficha"] == i and d["factor"] == "prosa" and d["tipo"] not in ("transversal", "entorno")]
    sel = {k: set() for k in PROSA}
    sin = []
    for d in ds:
        hit = False
        for k in PROSA:
            for n, p in enumerate((c.get(k) or "").split("\n\n")):
                if any(x in p for x in claves(d["detalle"])): sel[k].add(n); hit = True
        if not hit: sin.append(d["detalle"])
    for k in PROSA:
        for n, p in enumerate((c.get(k) or "").split("\n\n")):
            if len(p) > LIM: sel[k].add(n)
    parr = {}
    for k in PROSA:
        es = (c.get(k) or "").split("\n\n"); en = (c.get(k + "_en") or "").split("\n\n")
        for n in sorted(sel[k]):
            parr[f"{k}#{n}"] = es[n]
            if len(es) == len(en): parr[f"{k}_en#{n}"] = en[n]
        if sel[k] and len(es) != len(en): parr[f"{k}_en (entero: no tiene los mismos párrafos)"] = c.get(k + "_en")
    total = sum(len((c.get(k) or "").split("\n\n")) for k in PROSA)
    out.append({"id": i, "summary": c.get("summary"), "summary_en": c.get("summary_en"),
                "evidence": c.get("evidence"),
                "fuentes": [s.get("name") for s in c.get("sources") or []],
                "parrafos": parr, "parrafos_enviados": f"{sum(len(v) for v in sel.values())} de {total}",
                "defectos": [{"gravedad": d["gravedad"], "tipo": d["tipo"], "detalle": d["detalle"]} for d in ds],
                "defectos_sin_parrafo": sin})
json.dump({"limite_parrafo": LIM, "fichas": out}, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
for f in out: print(f["id"], f["parrafos_enviados"], "sin párrafo:", len(f["defectos_sin_parrafo"]))
print(len(json.dumps(out, ensure_ascii=False)), "caracteres")
