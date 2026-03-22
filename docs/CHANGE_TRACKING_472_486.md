# Change Tracking for Issues #472 and #486

This document tracks the local source-code changes made while working through the
OpenCRE mapping and smartlink improvements related to upstream issues and nearby
PR context.

The goal is simple:

- keep a record of what changed
- explain why it changed
- make it easier to replay or redo the work if something goes wrong

## Upstream issue context

### Issue #472

Upstream reference:

- https://github.com/OWASP/OpenCRE/issues/472

Title:

- `Mapping: Map to the rest of CWE`

Problem statement captured in the issue:

- map more of CWE into OpenCRE
- example given upstream:
  `CWE-652 query injection` should connect into a broader `Injection` mapping

Relevant issue discussion notes:

- embeddings alone may lead to awkward mappings
- manual volunteer mapping does not scale across all CWE entries
- a more maintainable mapping strategy is needed

Why this mattered locally:

- a large part of the work on this branch focused on making mappings more
  deterministic and maintainable
- this included curated data files, fallback mapping rules, local importer
  updates, and verification scripts

### Issue #486

Upstream reference:

- https://github.com/OWASP/OpenCRE/issues/486

Title:

- `Make smartlink go to CRE directly`

Problem statement captured in the issue:

- if a smartlink target resolves to exactly one CRE, smartlink should redirect
  straight to that CRE page instead of making the user stop at an intermediate
  standard landing page

Why this mattered locally:

- this issue is adjacent to the explorer and mapping cleanup work
- while the current local commits in this document are not the direct smartlink
  implementation, it is useful context because this branch name and nearby work
  touched map analysis, routing, explorer behavior, and linked document flows

## Upstream PR context

### Relevant upstream PR visible while tracking

Upstream reference:

- https://github.com/OWASP/OpenCRE/pulls
- https://github.com/OWASP/OpenCRE/pull/797

Observed PR title:

- `fix: redirect smartlink directly to CRE when only one is linked`

Why this is worth recording:

- it is directly related to issue `#486`
- if local smartlink behavior ever needs to be revisited, this PR is the first
  upstream implementation to compare against

### Important note

As of the time this tracking note was prepared:

- issue `#472` showed no linked branches or PRs on its issue page
- issue `#486` also showed no linked branches or PRs on its issue page

That means local branch history is especially useful for reconstructing work in
progress.

## Local commit timeline

The commits below were created in a deliberate order so they can be reused or
split into focused PRs.

### Commit 1

- `2ce9fbc`
- `Tighten LLM Top 10 prompt injection mappings`

Purpose:

- remove the over-broad prompt-injection link from `LLM05`
- keep prompt-injection mapping focused on the right LLM risk sections

Primary files:

- [owasp_llm_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_llm_top10_2025.json)
- [owasp_llm_top10_2025_parser_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/owasp_llm_top10_2025_parser_test.py)

### Commit 2

- `b8e6951`
- `Refine specialized cheat sheet map analysis`

Purpose:

- add specialized cheat-sheet handling for `AI / LLM`, `API`, and `Cloud`
- prevent generic cheat sheets from cluttering LLM-specific comparisons
- ensure queued job results reattach the specialized cheat-sheet section

Primary files:

- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)
- [web_main_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/web_main_test.py)

### Commit 3

- `575b940`
- `Improve cheat sheet labels in gap analysis`

Purpose:

- add clearer display labels for different cheat-sheet families in the frontend
- make `AI`, `API`, `Cloud`, and fallback `Web` cheat sheets easier to scan

Primary files:

- [GapAnalysis.tsx](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/GapAnalysis/GapAnalysis.tsx)
- [GapAnalysis.scss](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/GapAnalysis/GapAnalysis.scss)

## What changed technically

### LLM mapping tightening

Implemented in:

- [owasp_llm_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_llm_top10_2025.json)

Key effect:

- `LLM05 Improper Output Handling` no longer inherits the prompt-injection
  cheat-sheet behavior just because it shared a broad CRE

### Specialized cheat-sheet grouping

Implemented in:

- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)

Key effect:

- `map_analysis` now treats specialized cheat-sheet comparisons as category-aware
- current specialized categories:
  - `AI / LLM Cheat Sheets`
  - `API Cheat Sheets`
  - `Cloud Cheat Sheets`

### LLM section-to-cheat-sheet allowlist

Implemented in:

- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)

Current intended matches:

- `LLM01` -> `LLM Prompt Injection Prevention Cheat Sheet`
- `LLM02` -> `AI Agent Security Cheat Sheet`
- `LLM03` -> `Secure AI Model Ops Cheat Sheet`
- `LLM04` -> `Secure AI Model Ops Cheat Sheet`
- `LLM06` -> `AI Agent Security Cheat Sheet`
- `LLM07` -> `AI Agent Security Cheat Sheet`
- `LLM08` -> `AI Agent Security Cheat Sheet`

Current intentionally empty:

- `LLM05`
- `LLM09`
- `LLM10`

This is intentional so those sections do not get noisy or misleading matches.

### Frontend naming convention

Implemented in:

- [GapAnalysis.tsx](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/GapAnalysis/GapAnalysis.tsx)

Rendered label examples:

- `AI Cheat Sheet: LLM Prompt Injection Prevention Cheat Sheet`
- `API Cheat Sheet: REST Security Cheat Sheet`
- `Cloud Cheat Sheet: Kubernetes Security Cheat Sheet`
- fallback:
  `Web Cheat Sheet: ...`

## Cache and rebuild notes

Several local bugs during this work were caused by stale cache entries rather
than bad source data.

### SQLite gap analysis cache keys worth clearing

If LLM, proactive controls, or cheat-sheet results look wrong, check and clear:

- `OWASP Top 10 for LLM and Gen AI Apps 2025 >> OWASP Cheat Sheets`
- `OWASP Cheat Sheets >> OWASP Top 10 for LLM and Gen AI Apps 2025`
- `OWASP Top 10 2025 >> OWASP Proactive Controls`
- `OWASP Proactive Controls >> OWASP Top 10 2025`

### Example local cache-clear command

```bash
cd /home/born/Important_Stuff/OpenCRE
./venv/bin/python - <<'PY'
import sqlite3
conn = sqlite3.connect('standards_cache.sqlite')
cur = conn.cursor()
keys = [
    'OWASP Top 10 for LLM and Gen AI Apps 2025 >> OWASP Cheat Sheets',
    'OWASP Cheat Sheets >> OWASP Top 10 for LLM and Gen AI Apps 2025',
    'OWASP Top 10 2025 >> OWASP Proactive Controls',
    'OWASP Proactive Controls >> OWASP Top 10 2025',
]
for key in keys:
    cur.execute('delete from gap_analysis_results where cache_key=?', (key,))
conn.commit()
conn.close()
PY
```

## Local rerun commands

### Reimport LLM Top 10

```bash
cd /home/born/Important_Stuff/OpenCRE
CRE_NO_CALCULATE_GAP_ANALYSIS=1 CRE_NO_GEN_EMBEDDINGS=1 \
./venv/bin/python cre.py --owasp_llm_top10_2025_in --cache_file /home/born/Important_Stuff/OpenCRE/standards_cache.sqlite
```

### Reimport OWASP Top 10 2025

```bash
cd /home/born/Important_Stuff/OpenCRE
CRE_NO_CALCULATE_GAP_ANALYSIS=1 CRE_NO_GEN_EMBEDDINGS=1 \
./venv/bin/python cre.py --owasp_top10_2025_in --cache_file /home/born/Important_Stuff/OpenCRE/standards_cache.sqlite
```

### Run focused tests for the LLM cheat-sheet work

```bash
cd /home/born/Important_Stuff/OpenCRE
./venv/bin/python -m pytest \
  application/tests/owasp_llm_top10_2025_parser_test.py \
  application/tests/web_main_test.py \
  -k 'llm_top10_2025_parser or filters_generic_cheatsheets_for_llm_top10 or keeps_prompt_injection_cheatsheet_for_llm01 or ma_job_results_adds_specialized_cheatsheet_section' \
  -q
```

## Suggested PR split

If this branch needs to be redone or upstreamed cleanly, this is the preferred
split:

### PR 1

- focus: LLM cheat-sheet correctness
- commits:
  - `2ce9fbc`
  - `b8e6951`

### PR 2

- focus: frontend presentation and naming
- commits:
  - `575b940`

This keeps behavior fixes separate from UI polish and matches the contribution
guidance better.
