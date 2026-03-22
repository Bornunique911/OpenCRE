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

## Issue and PR linkage summary

This section answers a practical question directly:

- which upstream issues or PRs were helped by the code changes on this branch

### Primary upstream items

- `#472` `Mapping: Map to the rest of CWE`
  - reference:
    `https://github.com/OWASP/OpenCRE/issues/472`
  - status in this branch:
    directly addressed
  - main work:
    CWE inheritance, curated fallback mappings, MITRE refresh tooling, broader
    standard imports, and local verification

- `#486` `Make smartlink go to CRE directly`
  - reference:
    `https://github.com/OWASP/OpenCRE/issues/486`
  - status in this branch:
    related context, not the direct implementation in the commits below
  - main relevance:
    explorer, routing, mapping, and linked-document cleanup happened in the
    same working stream and are useful if smartlink behavior must be revisited

- `#797` `fix: redirect smartlink directly to CRE when only one is linked`
  - reference:
    `https://github.com/OWASP/OpenCRE/pull/797`
  - status in this branch:
    upstream comparison point only
  - main relevance:
    nearby upstream implementation to compare against for smartlink-related
    follow-up work

### Mapping from implementation phases to issues and PRs

- `Phase 1` to `Phase 6`
  - primary upstream issue:
    `#472`
  - reason:
    this is the core CWE mapping and refresh work

- `Phase 7`
  - primary upstream issue:
    `#472`
  - secondary relevance:
    makes local and upstream verification of mapping work more reliable

- `Phase 8` and `Phase 9`
  - primary upstream issue:
    `#472`
  - reason:
    expands standards and official references so mapping coverage is more
    useful in practice

- `Phase 10`
  - primary upstream issue:
    adjacent to `#486`
  - secondary upstream issue:
    supports `#472`
  - reason:
    explorer and discoverability changes help inspect and validate mappings,
    while also touching the same navigation space as smartlink behavior

- `Phase 11`
  - primary upstream issue:
    supports `#472`
  - secondary upstream issue:
    adjacent to `#486`
  - reason:
    map-analysis correctness and category-specific rendering improve the
    usability of the new mappings and related navigation flows

## Conversation-order implementation timeline

The branch history only tells part of the story. This section records the work
in roughly the same order it happened during the implementation session, even
when some steps were local runtime changes, SQLite refreshes, or grouped later
into broader source changes.

### Phase 1: CWE mapping foundation

Linked upstream items:

- issue `#472`

- validated the original CWE importer behavior against the target use case from
  issue `#472`
- extended CWE import logic to inherit CRE links through related CWE nodes
- added regression coverage for transitive CWE mapping cases
- verified locally that child CWE entries could inherit from broader injection
  mappings during the same import run

Primary files involved:

- [cwe.py](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/parsers/cwe.py)
- [cwe_parser_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/cwe_parser_test.py)

### Phase 2: Local app bring-up and database population

Linked upstream items:

- issue `#472`

- started the local Flask app
- confirmed the initial local SQLite cache was effectively empty
- loaded local standards data so CWE and CRE pages could be inspected in the UI
- verified early live examples for `CWE-89`, `CWE-120`, and related pages

Primary files and scripts involved:

- [cre.py](/home/born/Important_Stuff/OpenCRE/cre.py)
- [run-local.sh](/home/born/Important_Stuff/OpenCRE/scripts/run-local.sh)

### Phase 3: Initial fallback mappings for missing CWE links

Linked upstream items:

- issue `#472`

- added direct local fallback coverage for missing but high-confidence CWE
  families such as:
  - injection
  - XXE
  - authorization and access control
- confirmed examples like `CWE-611` and `CWE-612` in the live app

Primary files involved:

- [cwe.py](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/parsers/cwe.py)

### Phase 4: Move CWE fallback logic into curated data

Linked upstream items:

- issue `#472`

- moved ad hoc fallback matching out of parser logic and into a curated data
  file
- made the parser load a reviewable JSON mapping file instead of burying the
  rules entirely in code
- kept regression tests green after the refactor

Primary files involved:

- [cwe_fallback_mappings.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/cwe_fallback_mappings.json)
- [cwe.py](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/parsers/cwe.py)
- [cwe_parser_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/cwe_parser_test.py)

### Phase 5: Expand high-confidence CWE families

Linked upstream items:

- issue `#472`

- expanded fallback families for:
  - `authentication`
  - `CSRF`
  - `SSRF`
  - hard-coded secrets and credential storage
  - deserialization
  - redirect
  - session and additional authn/authz variants
- updated the local SQLite database and rechecked linked coverage

Primary files involved:

- [cwe_fallback_mappings.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/cwe_fallback_mappings.json)
- [cwe.py](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/parsers/cwe.py)

### Phase 6: Official MITRE CWE import and refresh tooling

Linked upstream items:

- issue `#472`

- switched local verification to the official MITRE CWE XML source
- added a reusable update script for refreshing the latest MITRE CWE release
- added a DB stats helper script so import growth can be measured over time

Primary files and scripts involved:

- [update-cwe.sh](/home/born/Important_Stuff/OpenCRE/scripts/update-cwe.sh)
- [show-db-stats.sh](/home/born/Important_Stuff/OpenCRE/scripts/show-db-stats.sh)

### Phase 7: Upstream sync resilience and local/runtime fallbacks

Linked upstream items:

- issue `#472`

- hardened `--upstream_sync` with request-level retries so transient upstream
  failures no longer abort the whole refresh
- added local SQLite-backed fallback logic for `map_analysis` when Redis and
  Neo4j are unavailable
- reduced long waits by using faster fallback timeout settings for web requests

Primary files involved:

- [cre_main.py](/home/born/Important_Stuff/OpenCRE/application/cmd/cre_main.py)
- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)
- [cre_main_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/cre_main_test.py)
- [web_main_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/web_main_test.py)

### Phase 8: Add OWASP Top 10 2025 and related standard families

Linked upstream items:

- issue `#472`

- added curated importers and data files for:
  - `OWASP Top 10 2025`
  - `OWASP API Security Top 10 2023`
  - `OWASP Top 10 for LLM and Gen AI Apps 2025`
  - `OWASP Kubernetes Top Ten 2022`
  - `OWASP Kubernetes Top Ten 2025 (Draft)`
  - `OWASP AI Security Verification Standard (AISVS)`
- added update scripts to reimport these standards in local development
- added Kubernetes fallback behavior:
  - prefer `2025` where usable
  - reuse `2022` mapping only when needed

Primary files involved:

- [owasp_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_top10_2025.json)
- [owasp_api_top10_2023.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_api_top10_2023.json)
- [owasp_llm_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_llm_top10_2025.json)
- [owasp_kubernetes_top10_2022.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_kubernetes_top10_2022.json)
- [owasp_kubernetes_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_kubernetes_top10_2025.json)
- [owasp_aisvs_1_0.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_aisvs_1_0.json)
- [update-owasp-top10-2025-mappings.sh](/home/born/Important_Stuff/OpenCRE/scripts/update-owasp-top10-2025-mappings.sh)
- [update-owasp-top10-standards.sh](/home/born/Important_Stuff/OpenCRE/scripts/update-owasp-top10-standards.sh)

### Phase 9: Fix official references and cheat-sheet sources

Linked upstream items:

- issue `#472`

- normalized OWASP Cheat Sheet references to the official Cheat Sheet Series
  URLs
- added supplemental cheat sheets used by newer AI and LLM categories
- corrected LLM Top 10 risk links to the official per-risk OWASP GenAI URLs
- aligned AISVS section links to the actual `1.0/en` source locations

Primary files involved:

- [cheatsheets_parser.py](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/parsers/cheatsheets_parser.py)
- [owasp_cheatsheets_supplement.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_cheatsheets_supplement.json)
- [owasp_llm_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_llm_top10_2025.json)
- [owasp_aisvs_1_0.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_aisvs_1_0.json)
- [update-cheatsheets.sh](/home/born/Important_Stuff/OpenCRE/scripts/update-cheatsheets.sh)

### Phase 10: Explorer and root standard discoverability

Linked upstream items:

- issue `#486` as adjacent context
- issue `#472` as mapping validation support
- PR `#797` as nearby upstream smartlink implementation context

- refreshed explorer caching so new standards are visible more reliably
- added `Expand all` and `Collapse all` controls to reduce perceived lag
- extended `/rest/v1/root_cres` with a limited `featured_standards` section for:
  - `AI`
  - `API`
  - `Cloud`

Primary files involved:

- [DataProvider.tsx](/home/born/Important_Stuff/OpenCRE/application/frontend/src/providers/DataProvider.tsx)
- [explorer.tsx](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/Explorer/explorer.tsx)
- [explorer.scss](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/Explorer/explorer.scss)
- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)

### Phase 11: Map analysis specialization and correctness clean-up

Linked upstream items:

- issue `#472`
- issue `#486` as adjacent routing and UX context

- fixed backend `500` paths for local `map_analysis`
- normalized aliases like `OWASP Top 2025` to `OWASP Top 10 2025`
- added an explicit `OWASP Top 10 2021` vs `OWASP Top 10 2025` comparison
  section
- added category-specific cheat-sheet sections for:
  - `AI / LLM`
  - `API`
  - `Cloud`
- filtered generic cheat-sheet noise out of LLM comparisons
- reattached specialized cheat-sheet sections on async job completion
- refined the frontend labels to distinguish `AI`, `API`, `Cloud`, and `Web`
  cheat sheets in a clearer way

Primary files involved:

- [web_main.py](/home/born/Important_Stuff/OpenCRE/application/web/web_main.py)
- [web_main_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/web_main_test.py)
- [GapAnalysis.tsx](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/GapAnalysis/GapAnalysis.tsx)
- [GapAnalysis.scss](/home/born/Important_Stuff/OpenCRE/application/frontend/src/pages/GapAnalysis/GapAnalysis.scss)
- [types.ts](/home/born/Important_Stuff/OpenCRE/application/frontend/src/types.ts)

## Local commit timeline

The commits below were created in a deliberate order so they can be reused or
split into focused PRs.

### Commit 1

- `2ce9fbc`
- `Tighten LLM Top 10 prompt injection mappings`
- linked upstream items:
  - issue `#472`

Purpose:

- remove the over-broad prompt-injection link from `LLM05`
- keep prompt-injection mapping focused on the right LLM risk sections

Primary files:

- [owasp_llm_top10_2025.json](/home/born/Important_Stuff/OpenCRE/application/utils/external_project_parsers/data/owasp_llm_top10_2025.json)
- [owasp_llm_top10_2025_parser_test.py](/home/born/Important_Stuff/OpenCRE/application/tests/owasp_llm_top10_2025_parser_test.py)

### Commit 2

- `b8e6951`
- `Refine specialized cheat sheet map analysis`
- linked upstream items:
  - issue `#472`
  - issue `#486` as adjacent UX and navigation context

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
- linked upstream items:
  - issue `#472`

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
