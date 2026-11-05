"""Pasa paquete.json (de paquete.py) a trozos de texto de ≤52.000 caracteres para el
corrector (su Read corta hacia los 54.000), y arma los textos de la relectura.
Uso: mktxt.py <carpeta>            → <carpeta>/paquete-N.txt
     mktxt.py <carpeta> --reaud <id>...  → <carpeta>/reaud/<id>.txt"""
import json, re, sys, os
L = sys.argv[1]
if "--reaud" in sys.argv:
    os.makedirs(f"{L}/reaud/lector", exist_ok=True)
    for i in sys.argv[sys.argv.index("--reaud") + 1:]:
        c = json.load(open(f"/home/user/Mercadopublico/web/data/cases/{i}.json"))
        s = lambda t: re.sub(r"\[\[[a-z0-9-]+\]\]", "↗", t or "")
        t = [f"=== TEXTO: {i} ===", c["name"], f"{c['year_start']} · {c['location'].get('place', '')}", "", s(c["summary"]), "",
             "Qué pasó", "", s(c["whatHappened"]), "", "Por qué importa", "", s(c.get("whyMatters")), "", "Evidencia"] + ["- " + s(e) for e in c.get("evidence", [])]
        open(f"{L}/reaud/{i}.txt", "w").write("\n".join(t))
        print("reaud", i)
    sys.exit()
p = json.load(open(f"{L}/paquete.json"))
blocks = []
for f in p["fichas"]:
    t = [f"######## FICHA {f['id']} (tier {f['tier']})\n"]
    for k, v in f["prosa"].items():
        t.append(f"[{k}]\n{v}\n")
    t.append("[fuentes]\n" + "\n".join(f"- {s['name']}" + (f" — nota: {s['note']}" if s.get("note") else "") for s in f["fuentes"]) + "\n")
    if f["classBasis_solo_lectura"]:
        t.append(f"[classBasis, solo lectura]\n{f['classBasis_solo_lectura']}\n")
    if f["parrafos_largos"]:
        t.append("[párrafos de más de 900]\n" + "\n".join(f"- {x['campo']} #{x['parrafo']}: {x['caracteres']} car., empieza «{x['empieza']}»" for x in f["parrafos_largos"]) + "\n")
    t.append("[defectos de la auditoría]\n" + "\n".join(f"- {d['gravedad']} | {d['factor']} | {d['tipo']} | {d['detalle']}" for d in f["defectos"]) + "\n")
    blocks.append("\n".join(t))
chunks, cur = [], ""
for b in blocks:
    if cur and len(cur) + len(b) > 52000:
        chunks.append(cur); cur = ""
    cur += b + "\n"
chunks.append(cur)
for n, c in enumerate(chunks, 1):
    open(f"{L}/paquete-{n}.txt", "w").write(c)
print(len(chunks), "trozos", [len(c) for c in chunks])
