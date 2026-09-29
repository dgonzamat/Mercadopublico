# Brief: assign the prosaic object class (level 1) and detail (level 2)

Repo: /home/user/Mercadopublico. Case files: web/data/cases/<id>.json. Read CLAUDE.md ("Modelo de probabilidad") first.

The site shows prosaic explanations in two levels (owner decision, 29 Sep 2026). There is no "misidentification" category and there must be no "conventional object, not pinned down" bucket.

Level 1 (field `mundanoType` + `misidSubtype`):
- misid + astronomico — Objeto astronómico
- misid + aeronave — Aeronave (includes balloons)
- misid + espacial — Objeto espacial
- misid + luces_tierra — En tierra (the source was on or near the ground: lights, a person, an animal)
- natural — Fenómeno natural
- fraude — Posible fraude
- instrumento — Fallo de instrumento (the anomaly came from the equipment: film, sensor, radar, a failure)
- psicosocial — Causa psicológica o social (collective contagion, suggestion, sleep paralysis)

Level 2 (field `objectDetail`, optional; allowed values in web/lib/meceClasses.ts OBJECT_DETAILS):
- astronomico: planeta_estrella | meteoro | luna
- aeronave: avion | helicoptero | dron | globo
- espacial: cohete_misil | satelite | reentrada
- luces_tierra: faro_reflector | bengala | vehiculo | llama_industrial | persona | animal
- natural: atmosferico (ball lightning, clouds, plasma) | optico (mirage, refraction)
- instrumento: pelicula_foto | sensor_radar | falla_equipo
- psicosocial: contagio_colectivo | sugestion | paralisis_sueno
- fraude: no detail

## For each assigned case
1. Read the ficha (summary, whatHappened, whyMatters, evidence, sources) and open the primary source it cites for the prosaic explanation (Blue Book file, official report, telex…). Do not work from memory or Wikipedia.
2. Decide the level-1 class the EVIDENCE favours as the prosaic explanation:
   - If the ficha/official analysis names a leading candidate, use its class. If several candidates of different classes, pick the one the evidence favours and say why.
   - Meteors/fireballs go to misid + astronomico + meteoro, not to natural (change `mundanoType` if needed).
   - Before moving mass to indet, check whether the prosaic reading the ficha weighs is an instrument artifact or a psychological/social cause: those are classes now (owner decision, 29 Sep 2026), and using them keeps the probability stable.
   - If the evidence supports no class at all (no candidate named anywhere), do NOT invent one: move the `mundano_natural` mass to `indet` (posterior must still sum to 1) and remove `mundanoType`/`misidSubtype` if mundano falls below 0.15 (audit M2).
   - `terrestre_otros` must disappear: replace it by a concrete class or by the indet move above.
3. Set `objectDetail` only if the evidence pins the specific object (e.g. "Venus" → planeta_estrella; "weather balloon" → globo). Otherwise leave it absent ("sin precisar").
4. After any posterior change, set `probability` = Math.round(100 × (indet + nohumano_encubierto + nohumano_abierto) / sum) — JS rounding (audit E43).
5. Do not rewrite prose, except where it now contradicts the classification (keep ES and EN in parallel). Do not set `evidenceReviewed` (this is not a full evidence review).
6. An independent verifier will check each assignment (docs/brief-verificacion.md). Include in the ficha nothing you cannot source.

## Report
One line per case: id | old class/detail → new class/detail | posterior change if any | source + quote that fixes the object. Then run from web/: node scripts/build-cases.mjs && node scripts/validate-schema.mjs && node scripts/audit-consistency.mjs --warn, and paste the tails.
