"""Empaqueta una ficha en un solo archivo para el redactor: prosa, evidencia,
documentos, fuentes, porqué de clase y, si existen, los hallazgos del editor y
del lector de la auditoría de prosa. Copia también el original intacto."""
import json, os, sys, shutil
WEB = "/home/user/Mercadopublico/web"
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(os.path.dirname(R), "prosa-l1")
KEEP = ["id", "num", "tier", "name", "name_en", "location", "country_name", "year_start", "year_end",
        "summary", "summary_en", "whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en",
        "evidence", "evidence_en", "classBasis", "mundanoType"]
for cid in sys.argv[1:]:
    src = f"{WEB}/data/cases/{cid}.json"
    o = json.load(open(src))
    if not os.path.exists(f"{R}/orig/{cid}.json"):
        shutil.copy(src, f"{R}/orig/{cid}.json")
    p = {k: o[k] for k in KEEP if k in o}
    p["documents"] = [{"index": i, **{k: d.get(k) for k in ("role", "type", "title", "title_en", "description", "description_en", "source", "src", "fallbackUrl")}}
                      for i, d in enumerate(o.get("documents") or [])]
    for k in ("primaryDocument", "featuredDoc"):
        if o.get(k): p[k] = {kk: o[k].get(kk) for kk in ("role", "title", "description", "src")}
    p["sources"] = [{k: s.get(k) for k in ("name", "url", "note")} for s in o.get("sources") or []]
    for tag, sub in (("editor", f"editor/{cid}.md"), ("lector_opus_es", f"opus/es-{cid}.md"), ("lector_opus_en", f"opus/en-{cid}.md")):
        f = os.path.join(AUD, sub)
        if os.path.exists(f): p["auditoria_" + tag] = open(f).read()
    json.dump(p, open(f"{R}/pack/{cid}.json", "w"), ensure_ascii=False, indent=1)
    print(cid, os.path.getsize(f"{R}/pack/{cid}.json"), "bytes")
