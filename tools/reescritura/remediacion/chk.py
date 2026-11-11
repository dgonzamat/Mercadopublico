"""Chequeo mecánico de un parche antes de aplicarlo (paso 5 de LOTE.md).
Simula el parche sobre las fichas y falla (exit 1) si hay ops rechazadas, párrafos de
más de 900, un resumen fuera de 400–650 o prosa ES (whatHappened + whyMatters) bajo
3.500. Lista, sin fallar, los campos que el parche cambia en un solo idioma: muchos son
legítimos (vocabulario, unidades o formato de hora del español) y se miran a mano.
Uso: chk.py <parche.json>"""
import json, re, subprocess, sys, os
from collections import Counter
R = os.path.dirname(os.path.abspath(__file__))
W = "/home/user/Mercadopublico/web/data/cases"
P = sys.argv[1]
d = json.loads(subprocess.run(["python3", "-I", f"{R}/aplicar.py", P, "--dry"], capture_output=True, text=True).stdout)
malo = bool(d["rechazadas"])
for x in d["rechazadas"]:
    print("RECHAZADA", x)
for f in d["fichas"]:
    if f["parrafos_largos"]:
        malo = True
        print("LARGO", f["id"], f["parrafos_largos"])


def base(campo):
    return re.sub(r"\[\d+\]", "", campo).replace("_en", "")


for f in json.load(open(P))["fichas"]:
    c = json.load(open(f"{W}/{f['id']}.json"))
    for op in f.get("ops", []):
        m = re.fullmatch(r"(\w+)\[(\d+)\]", op["campo"])
        if m:
            c[m[1]][int(m[2])] = c[m[1]][int(m[2])].replace(op["viejo"], op["nuevo"], 1)
        elif op["viejo"] in (c.get(op["campo"]) or ""):
            c[op["campo"]] = c[op["campo"]].replace(op["viejo"], op["nuevo"], 1)
    s, se = len(c["summary"]), len(c["summary_en"])
    prosa = len(c["whatHappened"]) + len(c.get("whyMatters") or "")
    es = Counter(base(o["campo"]) for o in f["ops"] if "_en" not in o["campo"])
    en = Counter(base(o["campo"]) for o in f["ops"] if "_en" in o["campo"])
    avisos = []
    if not (400 <= s <= 650 and 400 <= se <= 650):
        malo = True
        avisos.append(f"RESUMEN {s}/{se}")
    if prosa < 3500:
        malo = True
        avisos.append(f"PROSA-ES {prosa}")
    if es - en or en - es:
        avisos.append(f"un-idioma ES{dict(es - en)} EN{dict(en - es)}")
    print(f["id"], f"resumen {s}/{se} prosa {prosa}", " · ".join(avisos))
print("FALLA" if malo else "OK")
sys.exit(1 if malo else 0)
