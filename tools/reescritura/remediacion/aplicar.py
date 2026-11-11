"""Aplica un parche de corrección a las fichas y mide el resultado.
Parche: {"fichas":[{"id", "ops":[{"campo","viejo","nuevo"}], ...}]}. Cada `viejo`
debe aparecer exactamente una vez en su campo; si no, la op se rechaza y la ficha
no se escribe. Uso: aplicar.py <parche.json> [--dry]"""
import json, re, sys, difflib
W = "/home/user/Mercadopublico/web/data/cases"
LIM = 900
p = json.load(open(sys.argv[1])); dry = "--dry" in sys.argv
fallos, informe = [], []
def get(c, campo):
    m = re.fullmatch(r"(\w+)\[(\d+)\]", campo)
    return (c[m[1]][int(m[2])] if m else c.get(campo)), m
def put(c, campo, v, m):
    if m: c[m[1]][int(m[2])] = v
    else: c[campo] = v
for f in p["fichas"]:
    path = f"{W}/{f['id']}.json"; c = json.load(open(path)); antes = json.dumps(c, ensure_ascii=False, indent=2)
    ok = True
    for k, op in enumerate(f.get("ops", [])):
        t, m = get(c, op["campo"])
        if t is not None and t.count(op["viejo"]) != 1 and "\xa0" in t:
            # Los agentes copian el espacio duro de la ficha («41 %») como espacio normal:
            # si el tramo aparece una sola vez admitiendo cualquiera de los dos, se usa
            # el texto real y el reemplazo conserva el espacio duro donde lo llevaba.
            pat = re.escape(op["viejo"]).replace(r"\ ", "[ \xa0]")
            hits = list(re.finditer(pat, t))
            if len(hits) == 1:
                real = hits[0].group(0)
                nuevo = op["nuevo"]
                for a, b in re.findall(r"(\S)\xa0(\S)", real):
                    nuevo = nuevo.replace(f"{a} {b}", f"{a}\xa0{b}")
                op = {**op, "viejo": real, "nuevo": nuevo}
        if t is None or t.count(op["viejo"]) != 1:
            fallos.append(f"{f['id']} op {k} ({op['campo']}): «{op['viejo'][:50]}» aparece {0 if t is None else t.count(op['viejo'])} veces"); ok = False; continue
        put(c, op["campo"], t.replace(op["viejo"], op["nuevo"]), m)
    largos = [(k, n, len(x)) for k in ("whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en") for n, x in enumerate((c.get(k) or "").split("\n\n")) if len(x) > LIM]
    informe.append({"id": f["id"], "ops": len(f.get("ops", [])), "aplicada": ok, "parrafos_largos": largos})
    if ok and not dry:
        open(path, "w").write(json.dumps(c, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"rechazadas": fallos, "fichas": informe}, ensure_ascii=False, indent=1))
