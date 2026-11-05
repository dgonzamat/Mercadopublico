"""Muestra semanal de prosa: N fichas al azar repartidas por tier (proporcional),
sin las ya reescritas (progreso.json → capa3_hechas). Deja el texto de cada
ficha tal como lo ve el lector (enlaces [[slug]] como «↗») en <dir>/es/.
Uso: muestra.py <dir_salida> [N=10]"""
import json, glob, random, re, sys, datetime, os
WEB = "/home/user/Mercadopublico/web"
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 10
os.makedirs(f"{out}/es", exist_ok=True); os.makedirs(f"{out}/lector", exist_ok=True)
done = set(json.load(open(f"{S}/deuda/progreso.json")).get("capa3_hechas", []))
# Ni las ya muestreadas: cada semana amplía la cobertura en vez de releer las mismas.
_h = f"{S}/muestras/historial.json"
if os.path.exists(_h): done |= {f["id"] for m in json.load(open(_h)) for f in m["fichas"]}
cases = [json.load(open(f)) for f in glob.glob(f"{WEB}/data/cases/*.json")]
pool = {t: sorted(c["id"] for c in cases if c["tier"] == t and c["id"] not in done) for t in "SAB"}
tot = sum(len(v) for v in pool.values())
cuota = {t: max(1, round(N * len(pool[t]) / tot)) for t in "SAB"}
while sum(cuota.values()) > N: cuota[max(cuota, key=cuota.get)] -= 1
label = os.path.basename(os.path.normpath(out))  # clave única: dos muestras el mismo día no se pisan
if os.path.exists(_h) and any(m.get("muestra", m["fecha"]) == label for m in json.load(open(_h))):
    sys.exit(f"la muestra {label} ya está en el historial: usa otra carpeta ({label}b, …)")
random.seed(label)
pick = [(t, i) for t in "SAB" for i in random.sample(pool[t], cuota[t])]
by = {c["id"]: c for c in cases}
for t, i in pick:
    o = by[i]; sub = lambda s: re.sub(r"\[\[([a-z0-9-]+)\]\]", "↗", s or "")
    open(f"{out}/es/{i}.txt", "w").write(f"{o['name']}\n{o['year_start']} · {o['location']['place']}\n\n{sub(o['summary'])}\n\nQUÉ PASÓ\n\n{sub(o.get('whatHappened'))}\n\nPOR QUÉ IMPORTA\n\n{sub(o.get('whyMatters'))}\n")
json.dump({"fecha": datetime.date.today().isoformat(), "muestra": label, "fichas": pick}, open(f"{out}/muestra.json", "w"))
print(json.dumps(pick))
