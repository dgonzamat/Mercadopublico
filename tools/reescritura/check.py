"""Conservación de hechos. Compara la ficha reescrita (repo) con el original:
- NUEVOS: cifras, horas y nombres propios del texto nuevo que no aparecen en
  ninguna parte del original (prosa, evidencia, documentos, fuentes). Cada uno
  necesita fuente verificada.
- SALEN: cifras y nombres de la prosa/evidencia original que ya no están en
  ninguna parte de la ficha nueva (ni prosa, ni evidencia, ni documentos).
  No es un error: es la lista que revisa el verificador (¿omisión que cambia
  la lectura?).
Uso: check.py <id> [...]"""
import json, os, re, sys
WEB = "/home/user/Mercadopublico/web"
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUM = re.compile(r"\d[\d.,:]*\d|\d")
PROP = re.compile(r"(?<=[\w,;:)»”\"] )([A-ZÁÉÍÓÚÑ][\wáéíóúñü'’-]+)")
STOP = set("El La Los Las Un Una En De Del Al Y The A An In Of And On At He She It They Él Ella Su Sus His Her Their This That Este Esta Ese Esa Según But Pero Tras After When Cuando".split())
def norm(t): return re.sub(r"[.,\s]", "", t)
def toks(text):
    nums = {norm(n) for n in NUM.findall(text) if len(norm(n)) >= 2}
    props = {p for p in PROP.findall(text) if p not in STOP}
    return nums, props
def prose(o):
    parts = [o.get(k) or "" for k in ("name", "name_en", "summary", "summary_en", "whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en")]
    parts += (o.get("evidence") or []) + (o.get("evidence_en") or [])
    return "\n".join(parts)
def everything(o): return json.dumps(o, ensure_ascii=False)
for cid in sys.argv[1:]:
    old = json.load(open(f"{R}/orig/{cid}.json")); new = json.load(open(f"{WEB}/data/cases/{cid}.json"))
    on, op = toks(everything(old)); onorm = norm(everything(old))
    nn, np_ = toks(prose(new) + "\n" + "\n".join((d.get("description") or "") + (d.get("description_en") or "") for d in new.get("documents") or []))
    nuevos = sorted(nn - on) + sorted([p for p in np_ if p not in op and p not in everything(old)])
    pn, pp = toks(prose(old)); allnew = everything(new); allnewn = norm(allnew)
    an, _ = toks(allnew)
    salen = sorted(pn - an) + sorted([p for p in pp if p not in allnew])
    lo = lambda o, l: sum(len(o.get(k + l) or "") for k in ("whatHappened", "whyMatters"))
    print(f"== {cid}  prosa ES {lo(old,'')}→{lo(new,'')}  EN {lo(old,'_en')}→{lo(new,'_en')}")
    print("  NUEVOS (necesitan fuente):", ", ".join(nuevos) or "ninguno")
    print("  SALEN de toda la ficha:", ", ".join(salen) or "ninguno")
