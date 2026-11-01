"""Aplica out/<id>.json sobre la ficha del repo: campos de prosa, evidencia y
descripciones de documentos. No toca nada más (posterior, fuentes, tier...)."""
import json, os, sys
WEB = "/home/user/Mercadopublico/web"
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED = {"name", "name_en", "summary", "summary_en", "whatHappened", "whatHappened_en",
           "whyMatters", "whyMatters_en", "evidence", "evidence_en", "location.place", "location.place_en"}
for cid in sys.argv[1:]:
    out = json.load(open(f"{R}/out/{cid}.json"))
    # Sobre la ficha ACTUAL del repo, no sobre orig/: reconstruir desde orig/
    # revertía en silencio lo que otro paso ya había cambiado (la revisión de
    # la clasificación del lote R1, nov 2026).
    o = json.load(open(f"{WEB}/data/cases/{cid}.json"))
    for k, v in out.get("fields", {}).items():
        if k not in ALLOWED: sys.exit(f"{cid}: campo no permitido {k}")
        if k.startswith("location."): o["location"][k.split(".")[1]] = v
        else: o[k] = v
    for d in out.get("documents", []):
        i = d["index"]
        for k in ("description", "description_en"):
            if k in d: o["documents"][i][k] = d[k]
    open(f"{WEB}/data/cases/{cid}.json", "w").write(json.dumps(o, ensure_ascii=False, indent=2) + "\n")
    print(cid, "aplicado")
