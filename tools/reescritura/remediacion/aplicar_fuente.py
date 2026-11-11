"""Aplica L/parche-fuente-final.json: ops (vía aplicar.py), sources_nuevas y notas_fuente.
Los `campos` (p. ej. location) NO se aplican: se imprimen con «!!campos sin aplicar» y van a mano.
uso: aplicar_fuente.py <L>"""
import json,sys,subprocess
L=sys.argv[1]; P=f"{L}/parche-fuente-final.json"
r=subprocess.run(["python3","-I",__import__("os").path.dirname(__import__("os").path.abspath(__file__))+"/aplicar.py",P],capture_output=True,text=True,cwd="/home/user/Mercadopublico")
d=json.loads(r.stdout); print("rechazadas",d["rechazadas"],[(f["id"],f["aplicada"],f["parrafos_largos"]) for f in d["fichas"]])
for f in json.load(open(P))["fichas"]:
    path=f"/home/user/Mercadopublico/web/data/cases/{f['id']}.json"; c=json.load(open(path)); ch=False
    for s in f.get("sources_nuevas") or []:
        if s.get("url") and s["url"] in [x.get("url") for x in c["sources"]]: continue
        c["sources"].append(s); ch=True; print("+fuente",f["id"],s.get("name","")[:90])
    for n in f.get("notas_fuente") or []:
        for s in c["sources"]:
            if (n.get("url") and s.get("url")==n["url"]) or (n.get("name") and s.get("name")==n["name"]):
                for k in ("note","note_en","name","name_en"):
                    if n.get(k) and k in ("note","note_en") or (k in("name_en",) and n.get("name_nuevo_en")): pass
                if n.get("note"): s["note"]=n["note"]
                if n.get("note_en"): s["note_en"]=n["note_en"]
                if n.get("name_nuevo"): s["name"]=n["name_nuevo"]
                if n.get("name_nuevo_en"): s["name_en"]=n["name_nuevo_en"]
                ch=True; print("~nota",f["id"],(n.get("url") or n.get("name"))[:80]); break
        else: print("!!nota sin destino",f["id"],n)
    if f.get("campos"): print("!!campos sin aplicar",f["id"],f["campos"])
    if ch: open(path,"w").write(json.dumps(c,ensure_ascii=False,indent=2)+"\n")
