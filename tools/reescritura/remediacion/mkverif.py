"""Arma los archivos del verificador: por ficha, la prosa anterior completa en
español (con evidencia), las fuentes con notas y cada op de dato (las marcadas
«dato» y las «estilo» que introducen cifras o nombres nuevos según datos_nuevos).
Uso: mkverif.py <carpeta>"""
import json, sys, subprocess
L = sys.argv[1]
pk = {f["id"]: f for f in json.load(open(f"{L}/paquete.json"))["fichas"]}
parche = json.load(open(f"{L}/parche.json"))
dn = json.loads(subprocess.run(["python3", "-I", "/home/user/Mercadopublico/tools/reescritura/remediacion/datos_nuevos.py",
                                f"{L}/paquete.json", f"{L}/parche.json"], capture_output=True, text=True).stdout or "{}")
blocks, total = [], 0
for f in parche["fichas"]:
    marcadas = {x["op"] for x in dn.get(f["id"], [])}
    ops = [(n, op) for n, op in enumerate(f["ops"]) if op.get("tipo") == "dato" or n in marcadas]
    if not ops:
        continue
    total += len(ops)
    p = pk[f["id"]]
    t = [f"######## FICHA {f['id']}", "[PROSA ANTERIOR, en español]"]
    for k, v in p["prosa"].items():
        if not k.endswith("_en") and "_en[" not in k:
            t.append(f"[{k}]\n{v}\n")
    t.append("[fuentes]\n" + "\n".join(f"- {s['name']}" + (f" | nota: {s['note']}" if s.get("note") else "") for s in p["fuentes"]))
    t.append("\n[CAMBIOS A DICTAMINAR]")
    for n, op in ops:
        t.append(f"op {n} · campo {op['campo']} · tipo {op.get('tipo')}" + (" · trae cifras o nombres nuevos" if n in marcadas else "")
                 + f"\nANTES: {op['viejo']}\nDESPUÉS: {op['nuevo']}\n")
    blocks.append("\n".join(t))
chunks, cur = [], ""
for b in blocks:
    if cur and len(cur) + len(b) > 52000:
        chunks.append(cur); cur = ""
    cur += b + "\n\n"
if cur:
    chunks.append(cur)
for n, c in enumerate(chunks, 1):
    open(f"{L}/verif-{n}.txt", "w").write(c)
print(total, "ops a verificar en", len(blocks), "fichas;", len(chunks), "archivos", [len(c) for c in chunks])
