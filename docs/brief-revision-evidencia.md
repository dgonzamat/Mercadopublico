# Brief: review UAP Codex case records against PRIMARY evidence, then correct them

Repo: /home/user/Mercadopublico. Cases are JSON files at web/data/cases/<id>.json.

Each case's classification is written by hand: `posterior` (6 MECE keys summing to exactly 1: mundano_natural, humana_clasificada, adversaria, nohumano_encubierto, nohumano_abierto, indet), `mundanoType` (misid|natural|fraude) and `misidSubtype` (astronomico|aeronave|espacial|terrestre_otros, only when mundanoType=misid). The site just sums these numbers, so a classification written without reading the evidence contaminates every count.

Rule from the owner: the classification must be assigned only AFTER reading the primary evidence (the actual file, report, telex, transcript, contemporaneous press), never from Wikipedia or an aggregator summary.

Be neutral. Look for errors in BOTH directions:
- claims the primary record does not support (invented names, figures or maneuvers, misquoted verdicts);
- facts the ficha downplays or omits that strengthen the case (instrument data, independent witnesses, official admissions that something was unexplained, weaknesses in the official explanation).

If the primary evidence supports less prosaic weight than the ficha gives, lower it. If it supports the ficha, change little. Do not assume in advance which way the correction goes: the document decides.

## Your job, for each assigned case
1. Read the ficha (summary, whatHappened, whyMatters, evidence, sources, and the _en pairs).
2. Find and READ the primary evidence. Leads that work from this container:
   - archive.org: advancedsearch API `https://archive.org/advancedsearch.php?q=...&fl[]=identifier&fl[]=title&rows=50&output=json`, `/metadata/<id>`, `/download/<id>/<file>`, OCR `<id>_djvu.txt`.
   - Project Blue Book collection: identifiers `YYYY-MM-NNNNNNN-Place-State`. Search by month plus place (`collection:project-blue-book AND identifier:1957-11*`). The record card is usually page 1; render it to PNG with pymupdf and view it with Read, because the card OCR is poor.
   - The CIA reading room is mirrored on archive.org. So are the Condon Report (DTIC_AD0680975/76/77; full text also at files.ncas.org/condon/text/), the NSA UFO collection (NSAUFO) and the UFO Newsclipping Service.
   - nicap.org is reachable and hosts many document scans. theblackvault.com and many government sites are reachable too.
   - Blocked: web.archive.org, war.gov, defense.gov, aaro.mil.
   - Load WebSearch/WebFetch with ToolSearch "select:WebSearch,WebFetch" when you need them.
   - Python venv with pymupdf and ephem: /tmp/claude-0/-home-user-Mercadopublico/51719664-1aa9-5406-a859-ae4ae7bbc06e/scratchpad/venv/bin/python. Work in a subdir of that scratchpad named after your batch. For astronomical checks, compute planet positions with ephem.
3. Correct the ficha. You are authorized to edit ONLY your assigned case files. Do NOT commit or push. Do not touch any other file.
   - Fix every claim the primary record contradicts or does not support, in both ES and EN. Keep the paragraph structure (paragraphs are separated by \n\n) and make surgical edits.
   - Add the key primary facts that are missing, especially counter-evidence and official conclusions.
   - Present disputes fairly and keep what the primary record confirms. Where an official explanation is itself weak or contradicted by its own file, say so.
   - Spanish must be neutral, with no voseo. ES fields must not contain untranslated English except verbatim quotes in «» and titles or proper names; use «» for quotes in ES. No markdown in the prose (no **, no "- " lists, no #).
   - whatHappened + whyMatters must stay at 3,500 characters or more in each language.
   - Sources: add the primary sources with url, note and note_en, using exact URLs you verified return 200 with real content. Label Wikipedia and aggregators as secondary. Remove any source that presents Wikipedia as a primary archive.
   - Re-assess the `posterior` in light of what you read, then set `probability` = round(100 × (indet + nohumano_encubierto + nohumano_abierto)) — it is derived, never judged separately (audit E43), and adjust `mundanoType`/`misidSubtype` if a prosaic explanation becomes the leading one. Justify every change.
   - Only if you actually read primary evidence for the case, add `"evidenceReviewed": "2026-09-28"` as the last key. If you could not reach any primary evidence, do NOT add it; say so in your report.
4. From /home/user/Mercadopublico/web, run `node scripts/validate-schema.mjs` and `node scripts/audit-consistency.mjs --warn`. Fix anything that flags your cases (E7b spanglish, E13 length, E26 note without note_en). Pre-existing WARNs to ignore: E21, E38, E41, E42.

## Report back concisely, per case
- the primary sources read, with URLs;
- the changes made;
- old → new probability and posterior;
- whether evidenceReviewed was set;
- the final ES and EN character counts of whatHappened + whyMatters.

Also include the tail of the validator/audit output.

## Rule added after independent verification (29 Sep 2026)
A sample check of 15 merged corrections found a deflation bias: in 4 of 15 the corrector quoted the documents in a file that support the prosaic reading and OMITTED documents in the SAME file that point the other way (Kecksburg: the duty log sending a team "to pick-up an object that started a fire"; Manises: 5 radar echoes and 3 lock-ons in the MACOM report; Lakenheath: Hynek/Whipple/Condon contradicting ATIC's "not concurrent"; RB-47: an unsupported "third operator found nothing"). Therefore:
- When you cite a document to support a correction, look through the rest of the same file for material that contradicts it and include that too.
- Never state an absence ("no radar", "nothing found", "only one receiver") unless the primary record states it; otherwise write what the record does say.
- An independent verifier will check your edits claim by claim, including what you removed and what you left out.
