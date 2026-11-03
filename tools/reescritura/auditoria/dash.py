"""Datos del dashboard de la auditoría (prosa + página). Lee historial.json, progreso y el repo.
Escribe auditdash/{fichas,defectos,cobertura,transversales}.json. Uso: dash.py"""
import json, glob, os
S = "/tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad"
O = f"{S}/auditdash"; os.makedirs(O, exist_ok=True)
hist = json.load(open(f"{S}/muestras/historial.json"))
hechas = set(json.load(open(f"{S}/deuda/progreso.json")).get("capa3_hechas", []))
cases = {c["id"]: c for c in (json.load(open(f)) for f in glob.glob("/home/user/Mercadopublico/web/data/cases/*.json"))}
fichas, defectos = [], []
for m in hist:
    for f in m["fichas"]:
        if f["id"] in hechas: continue
        ds = f.get("defectos", [])
        pro = [d for d in ds if not d["tipo"].startswith("ui-")]; ui = [d for d in ds if d["tipo"].startswith("ui-")]
        fichas.append({"ficha": f["id"], "nombre": cases.get(f["id"], {}).get("name", f["id"]), "tier": f["tier"],
            "muestra": m.get("muestra", m["fecha"]), "fecha": m["fecha"], "veredicto": f["veredicto"],
            "gravedad": f.get("gravedad") or "SIN CLASIFICAR", "veredicto_ui": f.get("veredicto_ui") or "SIN REVISAR",
            "gravedad_ui": f.get("gravedad_ui") or "SIN REVISAR",
            "alta_prosa": sum(d["gravedad"] == "ALTA" for d in pro), "alta_ui": sum(d["gravedad"] == "ALTA" for d in ui),
            "defectos_prosa": len(pro), "defectos_ui": len(ui)})
        for k, d in enumerate(ds):
            defectos.append({"clave": f"{m.get('muestra', m['fecha'])}|{f['id']}|{k}", "ficha": f["id"], "tier": f["tier"],
                "muestra": m.get("muestra", m["fecha"]), "factor": "página" if d["tipo"].startswith("ui-") else "prosa",
                "gravedad": d["gravedad"], "tipo": d["tipo"].removeprefix("ui-"), "duda": d["tipo"] in ("duda", "ui-duda"),
                "detalle": d["detalle"]})
n = len(fichas); pend = len(cases) - len(hechas)
nr = sum(f["veredicto"] == "REESCRIBIR" for f in fichas); na = sum(f["veredicto"] == "APROBADA" for f in fichas)
cob = [{"fichas_total": len(cases), "reescritas_r1": len(hechas), "pendientes": pend,
        "auditadas_prosa": n, "auditadas_pagina": sum(f["veredicto_ui"] != "SIN REVISAR" for f in fichas),
        "sin_auditar": pend - n, "muestras": len(hist), "ultima_muestra": hist[-1].get("muestra", hist[-1]["fecha"]),
        "est_reescribir": round(pend * nr / max(n, 1)), "est_aprobadas": round(pend * na / max(n, 1)),
        "est_retocar": pend - round(pend * nr / max(n, 1)) - round(pend * na / max(n, 1))}]
trans = [
 {"hallazgo": "El aviso de cookies sale en inglés en todo el espejo /es: se dibuja en el layout raíz, fuera del contenedor que fija el español", "factor": "página", "gravedad": "ALTA", "alcance": "todas las páginas /es", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Error de hidratación de React #418: el HTML estático no coincide con el primer render del navegador", "factor": "página", "gravedad": "MEDIA", "alcance": "todas las páginas probadas (fichas, portada, /es y raíz)", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "El rótulo de la barra de «Qué fue» se corta en el móvil («Sin causa c…», «Causa natural o hu…»)", "factor": "página", "gravedad": "BAJA", "alcance": "fichas con reparto de clases", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "El pie del sitio pasa a inglés en las fichas en español al cargar la página: el HTML estático está en español y el navegador lo cambia (ligado al error #418)", "factor": "página", "gravedad": "ALTA", "alcance": "todas las fichas /es revisadas cuyo pie entró en las capturas", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Nombres internos de campos (whatHappened, whyMatters, classBasis…) a la vista en notas de fuentes y textos: 34 menciones en 17 fichas, medido en el repo", "factor": "página", "gravedad": "ALTA", "alcance": "17 fichas", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Imágenes de Commons que no cargan en las capturas (Halt en Rendlesham, Varginha): Wikimedia responde 429 a este contenedor también en miniaturas, así que no está probado que fallen para los lectores; queda por comprobar desde otra red", "factor": "página", "gravedad": "BAJA", "alcance": "sin confirmar", "detectado": "2026-11-03", "estado": "Por verificar"},
 {"hallazgo": "Las etiquetas de «Fisionomía de la entidad» muestran el identificador interno junto al nombre («gris Gris», «sin-forma», «robotica»): el componente pinta el slug a propósito", "factor": "página", "gravedad": "MEDIA", "alcance": "35 fichas con fisionomía, medido en el repo", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "La tarjeta de «Actores asociados» se sale por la derecha en el móvil y corta su texto", "factor": "página", "gravedad": "MEDIA", "alcance": "visto en 3 fichas (Cisco Grove, Napolitano, Valdés); falta medirlo en todas", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Comillas simples rectas ('…') en los títulos de fuentes: 341 fuentes en 168 fichas, medido en el repo. Puede ser deliberado (el título se cita literal); decisión del dueño", "factor": "página", "gravedad": "BAJA", "alcance": "168 fichas", "detectado": "2026-11-03", "estado": "Espera al dueño"},
]
for k, v in {"fichas": fichas, "defectos": defectos, "cobertura": cob, "transversales": trans}.items():
    json.dump(v, open(f"{O}/{k}.json", "w"), ensure_ascii=False)
print(n, len(defectos), cob)
