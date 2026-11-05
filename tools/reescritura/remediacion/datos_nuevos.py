"""Detecta en un parche las ops que introducen cifras, fechas o nombres propios
que no estaban en ninguna parte de la ficha anterior, con independencia de la
etiqueta «dato»/«estilo» del corrector. Uso: datos_nuevos.py <paquete.json> <parche.json>"""
import json, re, sys
pk = {f["id"]: f for f in json.load(open(sys.argv[1]))["fichas"]}
TOK = re.compile(r"\d[\d.,]*|\b[A-ZÁÉÍÓÚÑ][\wáéíóúñ'-]{2,}")
# palabras que abren frase o son comunes en mayúscula: no son datos
COMUNES = {"El","La","Los","Las","Un","Una","En","Por","Para","Con","Según","Pero","Esa","Ese","Eso","Este","Esta","Como","Tras","Desde","The","In","On","At","For","With","According","But","That","This","After","From","An","As","When","His","Her","Its"}
out = {}
for f in json.load(open(sys.argv[2]))["fichas"]:
    prev = " ".join(str(v) for v in pk[f["id"]]["prosa"].values()) + " " + " ".join(f"{s.get('name')} {s.get('note')}" for s in pk[f["id"]]["fuentes"])
    for n, op in enumerate(f["ops"]):
        nuevos = sorted({t.strip(".,") for t in TOK.findall(op["nuevo"]) if t.strip(".,") not in COMUNES and t.strip(".,") not in prev})
        if nuevos: out.setdefault(f["id"], []).append({"op": n, "tipo": op.get("tipo"), "campo": op["campo"], "nuevos": nuevos})
print(json.dumps(out, ensure_ascii=False, indent=1))
