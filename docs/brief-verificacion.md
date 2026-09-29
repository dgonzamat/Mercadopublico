# Brief: independent verification of evidence-review corrections (READ-ONLY)

Second step of the mandatory two-step method (see CLAUDE.md, "Modelo de probabilidad"). You did not make the corrections; you check them. Do NOT edit any file.

Repo: /home/user/Mercadopublico. Case files: web/data/cases/<id>.json. See what changed with
`git diff origin/main -- web/data/cases/<id>.json` (unmerged work) or `git diff <commit>~1 <commit> -- …` (merged work).

For each case:
1. Every factual claim ADDED or CHANGED (dates, names, numbers, quotes, "the file/report/telex says X"): open the cited primary source and check it. archive.org (Blue Book collection, `_djvu.txt` OCR), the Black Vault, WikiLeaks PlusD, dvidshub.net (og:description), govinfo.gov, oversight.house.gov and the local PDFs in web/public/pursue/ work; war.gov, aaro.mil and defense.gov are blocked. If OCR is poor, render the page and look at it.
2. Every claim REMOVED: was the removal justified, or did a primary source support it?
3. OMISSIONS: material in the SAME primary file that contradicts the correction, in either direction. This is the most frequent error found so far.
4. Posterior change: consistent with the sources, or does it go further than the evidence in either direction? (`probability` is derived from the posterior; don't judge it separately.)

Be as skeptical of the corrector as of the original ficha.

Report per case: a table claim | VERIFIED / NOT VERIFIABLE from here / WRONG | source + quote; a verdict OK / needs fix, with the exact corrected wording and its source. End with one line: over-deflated, over-inflated, or neither.
