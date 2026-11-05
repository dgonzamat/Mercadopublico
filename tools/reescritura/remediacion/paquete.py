"""Arma el paquete de un lote de corrección: prosa ES+EN de cada ficha, sus
párrafos largos y los defectos de la auditoría. Uso: paquete.py <salida.json> <id>..."""
import json, sys
S = "/tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad"
W = "/home/user/Mercadopublico/web/data/cases"
LIM = 900
defs = json.load(open(f"{S}/auditdash/defectos.json"))
CAMPOS = ["name", "summary", "whatHappened", "whyMatters"]
out = []
for i in sys.argv[2:]:
    c = json.load(open(f"{W}/{i}.json"))
    prosa = {}
    for k in CAMPOS:
        for kk in (k, k + "_en"):
            if c.get(kk): prosa[kk] = c[kk]
    for kk in ("evidence", "evidence_en"):
        for n, t in enumerate(c.get(kk) or []): prosa[f"{kk}[{n}]"] = t
    largos = [{"campo": k, "parrafo": n, "caracteres": len(p), "empieza": p[:60]}
              for k in ("whatHappened", "whatHappened_en", "whyMatters", "whyMatters_en")
              for n, p in enumerate((c.get(k) or "").split("\n\n")) if len(p) > LIM]
    ds = [{"factor": d["factor"], "gravedad": d["gravedad"], "tipo": d["tipo"], "detalle": d["detalle"]}
          for d in defs if d["ficha"] == i and d["tipo"] not in ("transversal", "entorno")]
    out.append({"id": i, "tier": c["tier"], "prosa": prosa,
                "fuentes": [{"name": s.get("name"), "note": s.get("note")} for s in c.get("sources") or []],
                "classBasis_solo_lectura": (c.get("classBasis") or {}).get("es"),
                "parrafos_largos": largos, "defectos": ds})
json.dump({"limite_parrafo": LIM, "fichas": out}, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
print(len(out), "fichas;", sum(len(f["defectos"]) for f in out), "defectos;", len(json.dumps(out, ensure_ascii=False)), "caracteres")
