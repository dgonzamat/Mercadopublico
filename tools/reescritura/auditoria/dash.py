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
n = len(fichas); pend = len(cases)  # desde el 5 nov la auditoría cubre también las 11 reescritas en R1
nr = sum(f["veredicto"] == "REESCRIBIR" for f in fichas); na = sum(f["veredicto"] == "APROBADA" for f in fichas)
cob = [{"fichas_total": len(cases), "reescritas_r1": len(hechas), "pendientes": pend,
        "auditadas_prosa": n, "auditadas_pagina": sum(f["veredicto_ui"] != "SIN REVISAR" for f in fichas),
        "sin_auditar": pend - n, "muestras": len(hist), "ultima_muestra": hist[-1].get("muestra", hist[-1]["fecha"]),
        "est_reescribir": round(pend * nr / max(n, 1)), "est_aprobadas": round(pend * na / max(n, 1)),
        "est_retocar": pend - round(pend * nr / max(n, 1)) - round(pend * na / max(n, 1))}]
trans = [
 {"hallazgo": "Un enlace a otro caso usado como sustantivo («por el de ↗», «en ↗ y GoFast») deja la frase sin nombre: linkCaseRefs dibuja solo «↗» y el nombre queda en el title", "factor": "página", "gravedad": "ALTA", "alcance": "fichas con [[slug]] tras preposición o artículo (Burgos 1975, Golfo de Omán, Ghost rockets Finlandia…)", "detectado": "2026-11-05", "estado": "Pendiente"},
 {"hallazgo": "El recuadro «Por qué» corta la cita en una inicial («dijo a J.»): splitLead toma el punto de la inicial como fin de oración", "factor": "página", "gravedad": "ALTA", "alcance": "fichas con iniciales en el porqué (Lubbock 1951 visto; ~14 en riesgo)", "detectado": "2026-11-05", "estado": "Pendiente"},
 {"hallazgo": "Una URL o ruta sin cortes en la nota de una fuente desborda Evidencia y Fuentes por la derecha, y la sonda ui.mjs no lo ve (desborde_horizontal vacío)", "factor": "página", "gravedad": "ALTA", "alcance": "Ferrol 1966, Harare 2008; la sonda no es fiable para este caso", "detectado": "2026-11-05", "estado": "Pendiente"},
 {"hallazgo": "La etiqueta «Contactado» junto al tier no se explica en la página", "factor": "página", "gravedad": "BAJA", "alcance": "fichas con tipo de encuentro contactee", "detectado": "2026-11-05", "estado": "Pendiente"},
 {"hallazgo": "El aviso de cookies sale en inglés en todo el espejo /es: se dibuja en el layout raíz, fuera del contenedor que fija el español", "factor": "página", "gravedad": "ALTA", "alcance": "todas las páginas /es", "detectado": "2026-11-03", "estado": "Descartado: artefacto de la sonda (servía el sitio bajo /Mercadopublico)"},
 {"hallazgo": "Error de hidratación de React #418: el HTML estático no coincide con el primer render del navegador", "factor": "página", "gravedad": "MEDIA", "alcance": "todas las páginas probadas (fichas, portada, /es y raíz)", "detectado": "2026-11-03", "estado": "Descartado: artefacto de la sonda (servía el sitio bajo /Mercadopublico)"},
 {"hallazgo": "El rótulo de la barra de «Qué fue» se corta en el móvil («Sin causa c…», «Causa natural o hu…»)", "factor": "página", "gravedad": "BAJA", "alcance": "fichas con reparto de clases", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "El pie del sitio pasa a inglés en las fichas en español al cargar la página: el HTML estático está en español y el navegador lo cambia (ligado al error #418)", "factor": "página", "gravedad": "ALTA", "alcance": "todas las fichas /es revisadas cuyo pie entró en las capturas", "detectado": "2026-11-03", "estado": "Descartado: artefacto de la sonda (servía el sitio bajo /Mercadopublico)"},
 {"hallazgo": "Nombres internos de campos (whatHappened, whyMatters, classBasis…) a la vista en notas de fuentes y textos: 34 menciones en 17 fichas, medido en el repo", "factor": "página", "gravedad": "ALTA", "alcance": "17 fichas", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Imágenes de Commons que no cargan en las capturas (Halt en Rendlesham, Varginha): Wikimedia responde 429 a este contenedor también en miniaturas, así que no está probado que fallen para los lectores; queda por comprobar desde otra red", "factor": "página", "gravedad": "BAJA", "alcance": "sin confirmar", "detectado": "2026-11-03", "estado": "Por verificar"},
 {"hallazgo": "Las etiquetas de «Fisionomía de la entidad» muestran el identificador interno junto al nombre («gris Gris», «sin-forma», «robotica»): el componente pinta el slug a propósito", "factor": "página", "gravedad": "MEDIA", "alcance": "35 fichas con fisionomía, medido en el repo", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "La tarjeta de «Actores asociados» se sale por la derecha en el móvil y corta su texto: el rótulo largo «Experiencers · abducidos, contactados y testigos de entidad» no cabe", "factor": "página", "gravedad": "MEDIA", "alcance": "26 fichas con un actor de ese grupo (medido); visto en Cisco Grove, Napolitano, Valdés y Kofu", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Comillas simples rectas ('…') en los títulos de fuentes: 341 fuentes en 168 fichas, medido en el repo. Puede ser deliberado (el título se cita literal); decisión del dueño", "factor": "página", "gravedad": "BAJA", "alcance": "168 fichas", "detectado": "2026-11-03", "estado": "Espera al dueño"},
 {"hallazgo": "Los enlaces a otros casos dentro de la prosa se ven solo como «(↗)»: pequeños para el dedo y sin decir adónde llevan (el título va solo en el atributo title)", "factor": "página", "gravedad": "BAJA", "alcance": "50 enlaces en 43 fichas, medido en el repo", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "El bloque «Qué fue» muestra una «explicación más probable» que choca a la vista con el porcentaje o con el recuadro «Por qué» de debajo (p. ej. «70 % causa natural o humana» y «más probable: tecnología adversaria»)", "factor": "página", "gravedad": "MEDIA", "alcance": "visto en 7 fichas (Yellow Sea, Virginia, drones europeos, Navy Flyby, Father Gill, Marruecos 1953, Yellow Sea Star); falta medirlo en todas", "detectado": "2026-11-03", "estado": "Pendiente"},
 {"hallazgo": "Códigos de archivo y direcciones web a la vista en la prosa (DOW-UAP-PR051, war.gov, [CALLSIGN]…), fuera de citas", "factor": "prosa", "gravedad": "MEDIA", "alcance": "59 apariciones en 42 fichas, medido en el repo", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "El desplegable del visor dice «Ver los otros 1 documentos» (concordancia) cuando queda un solo documento oculto", "factor": "página", "gravedad": "BAJA", "alcance": "visto en Salvador 1963 y Apolo 12; todas las fichas con un documento de más en el grupo", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "Los «casos relacionados» por misma explicación o mismo objeto llevan a casos que el lector no ve como afines (una bola de acero → luces en el cielo; un video de Irán → Mothman)", "factor": "página", "gravedad": "BAJA", "alcance": "visto en 6 fichas; falta revisar el criterio", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "La voz del redactor dentro del texto: «esta ficha», «según un cálculo propio de esta ficha»", "factor": "prosa", "gravedad": "MEDIA", "alcance": "173 menciones en 82 fichas, medido en el repo", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "La leyenda del Tier B enumera los criterios en general («un solo testigo, un testimonio tardío o sin documentación») y no dice cuál aplica: en un caso con 22 testigos se lee como si hubiera uno solo", "factor": "página", "gravedad": "BAJA", "alcance": "173 fichas Tier B; visto en Yukón 1996 y Talavera 1976", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "La etiqueta de «Fisionomía de la entidad» no casa con lo que describe el relato («Pequeña, peluda, con garras» para seres con uniforme o una figura de luz de 3 m)", "factor": "página", "gravedad": "MEDIA", "alcance": "la etiqueta «peluda-garras» está en 9 fichas; no casa en 3 de las vistas (Malasia 1970, Talavera 1976, Ilkley Moor 1987)", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "El «%» queda solo al inicio de una línea en el móvil, separado de su cifra («95 / %»): falta un espacio duro entre número y signo", "factor": "página", "gravedad": "BAJA", "alcance": "86 cifras en 37 fichas, medido en el repo", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "El recuadro «Por qué» de «Qué fue» cita la fuente en inglés o francés sin traducir en la página española, aunque el relato sí la traduce", "factor": "página", "gravedad": "MEDIA", "alcance": "20 fichas, medido en el repo (porqué de clase en español con cita en inglés)", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "Nombres de fuentes en inglés fuera de comillas en la página española («Director GEPAN testimony», «Independent analysis…»)", "factor": "página", "gravedad": "MEDIA", "alcance": "67 fuentes en 53 fichas, medido en el repo", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "El visor de PDF abre en la portada de documentos de cientos de páginas y no en la página del caso", "factor": "página", "gravedad": "MEDIA", "alcance": "visto en 6 fichas (Kenneth Arnold, Chiles-Whitted, Puerto Rico 1964, Molebka, Gemini 4, Sandia)", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "La miga de pan repite el título completo de la ficha en mayúsculas y ocupa tres líneas en el móvil antes del caso", "factor": "página", "gravedad": "BAJA", "alcance": "todas las fichas (componente Breadcrumb)", "detectado": "2026-11-04", "estado": "Pendiente"},
 {"hallazgo": "Notas internas del redactor a la vista en las notas de fuentes y documentos («no es accesible desde el entorno de revisión», «no se pudo descargar desde aquí», «enlace heredado»)", "factor": "página", "gravedad": "MEDIA", "alcance": "120 notas en 89 fichas, medido en el repo", "detectado": "2026-11-04", "estado": "Pendiente"},
]
for k, v in {"fichas": fichas, "defectos": defectos, "cobertura": cob, "transversales": trans}.items():
    json.dump(v, open(f"{O}/{k}.json", "w"), ensure_ascii=False)
print(n, len(defectos), cob)
