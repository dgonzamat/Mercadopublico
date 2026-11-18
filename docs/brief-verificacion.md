# Brief: independent verification of evidence-review corrections (READ-ONLY)

Second step of the mandatory two-step method (see CLAUDE.md, "Modelo de probabilidad"). You did not make the corrections; you check them. Do NOT edit any file.

**Writing:** also check the corrected text against the `/redaccion` guide (`.claude/commands/redaccion.md`): flag any departure with the exact sentence and a proposed rewrite.

**Do not use the researcher's notes or any summary as evidence**, only the primary sources themselves: a summary carries the writer's reading, and checking against it confirms what the writer already believed (Nov 2026).

Repo: /home/user/Mercadopublico. Case files: web/data/cases/<id>.json. See what changed with
`git diff origin/main -- web/data/cases/<id>.json` (unmerged work) or `git diff <commit>~1 <commit> -- …` (merged work).

For each case:
1. Every factual claim ADDED or CHANGED (dates, names, numbers, quotes, "the file/report/telex says X"): open the cited primary source and check it. archive.org (Blue Book collection, `_djvu.txt` OCR), the Black Vault, WikiLeaks PlusD, dvidshub.net (og:description), govinfo.gov, oversight.house.gov and the local PDFs in web/public/pursue/ work; war.gov, aaro.mil and defense.gov are blocked. If OCR is poor, render the page and look at it.
2. Every claim REMOVED: was the removal justified, or did a primary source support it?
3. OMISSIONS: material in the SAME primary file that contradicts the correction, in either direction. This is the most frequent error found so far.
4. Posterior change: consistent with the sources, or does it go further than the evidence in either direction? (`probability` is derived from the posterior; don't judge it separately.)

Be as skeptical of the corrector as of the original ficha.

Report per case: a table claim | VERIFIED / NOT VERIFIABLE from here / WRONG | source + quote; a verdict OK / needs fix, with the exact corrected wording and its source. End with one line: over-deflated, over-inflated, or neither.

---

## New cases: fixed brief (Nov 2026)

Use this section, unchanged, for every NEW case created with `/nuevo-caso`. It is fixed on purpose: the findings ledger (`docs/hallazgos-verificacion.md`) compares cases, and a brief rewritten for each case measures the brief instead of the case (the Puddy verifier got a sharper ad hoc brief than the five before it, so its higher count could not be compared).

The orchestrator fills in only three things: the case path (`web/data/cases/<id>.json`), the list of primary-source files or URLs, and a scratch directory for your notes. You work READ-ONLY.

1. Read, in this order: this brief, the `/redaccion` guide, then the primary sources themselves (images for handwritten pages: open them and look). Do not use the researcher's notes or any summary as evidence.
2. Check every claim in `summary`, `whatHappened`, `whyMatters`, `evidence`, `documents[].description`, `classBasis` and `sources[].note`, in both languages, by these categories, in this order of priority (they are the ones that failed in earlier cases):
   - A. **Attribution**: who said or did what, and the date of the document that records it.
   - B. **Omissions**: anything in the SAME document that qualifies or contradicts the case; reread every cited page whole.
   - C. **Absence claims** ("no record", "nobody interviewed"): check each against the source; they must be impersonal ("no ... is known"), never first person.
   - D. **Figures, times and dates**, including conversions and stamps; a weekday and a date may not agree between hands of the same file.
   - E. **Quotes**: literal in the source? Faithful translation?
   - F. **ES/EN parity**, American English, quotes and dates per the guide.
   - G. **Classification** (read only): anything in the sources against the tier, `mundanoType` or `classBasis`?
3. Report a NUMBERED list of findings, most severe first. Each one: (a) field and exact sentence; (b) what the source says, with file and page or line; (c) severity HIGH / MEDIUM / LOW and category letter; (d) proposed rewrite in ES and EN. Then, separately, one line per block of what you checked and found correct, and what you could not check and why. No general conclusions.
4. **Patch file** (since Nov 18, 2026). Besides the report, write every proposed rewrite as a patch in the JSON file the orchestrator names, one entry per string and language (the ES and the EN rewrite of a finding are two entries): `{"ficha": "<id>", "hallazgo": <n>, "severidad": "ALTA|MEDIA|BAJA", "hecho": true|false, "cita": "<file, page or line: literal words>", "old": "<text copied exactly from the case file>", "new": "<replacement>"}`. `old` must occur only once in the case file: copy enough words to make it unique. `hecho` is true when the patch changes a fact (a name, figure, date, attribution or what a document says), false when it only fixes form. Write `new` to the `/redaccion` standard: a patch that adds a 60-word sentence or a chain of semicolons creates the defect the reader will find. The orchestrator applies patches with `npm run parches` (`web/scripts/aplicar-parches.mjs`).
