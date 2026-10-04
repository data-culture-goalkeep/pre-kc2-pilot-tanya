# PM Learnings — Pre-KC2 Pilot Phase 1

## Summary

The pilot completed the seven-tab data migration into the Supabase test project, with 12,724 rows loaded and 166 excluded with row-level reasons logged. Explicit source review, staged approvals, and keeping unresolved rules visible prevented silent assumptions. The main rework came from clarifying tab names, adding one missed source column after schema review, and investigating GitHub state that had changed. Plan a half-day assisted-work window for comparable work: the recorded end-to-end collaboration span was about 4 hours 17 minutes, covering roughly 22 user prompts across the eight main project steps plus diagram and context-document follow-ups. This includes user decision and connector wait time; continuous model runtime was not measured.

## Findings by topic

### 1. Data quality

The task description first conflicted on the number of tabs (nine mentioned versus seven authorized); Tanya confirmed seven and excluded `4A` and `4B`. Two tab names were also clarified from a truncation: `1. Beneficiaries` and `2. Daycare Attendance`. Checking live titles resolved both before import.

Headers included typos or ambiguous wording, including `Life Goals disconitued date`, `Is interseted in DAYCARE Program`, `Job Discription`, `Verfication from HFH`, `Doubt from Gaolkeep`, 3A `Educational Provided Required Date`, and 5A `Q8:`. Dropdown-like fields also had inconsistent values/casing; long or inconsistent lists stayed text instead of being forced into enums. No enum mismatches or unparseable dates caused migration failures. Incomplete rows were the 166 logged FK/name failures below.

### 2. Migration

**12,724 inserted; 0 updated; 0 unchanged; 166 failed.** Failures: 116 Daycare Attendance rows with a missing or unknown beneficiary ID; 1 Homecare row with an unknown beneficiary ID; 49 Hospital Session Feedback rows without a child name. All are listed in the [migration failure log](https://docs.google.com/spreadsheets/d/1gEUlXVW_CBuuvj_bnMRWN24g_1IhWeQoNvwgfO_jCzQ/edit?usp=drivesdk). There were no silent failures or database insert errors. Source row references were used for reruns; sorting or inserting source rows requires a full clean reload.

### 3. Rosenberg scoring

The straight conversion SD=1, DA=2, A=3, SA=4 matched **0 of 5** sampled source totals. The reverse-score check was not performed because Tanya later directed us to skip it. Therefore there is no reversed-item match count; the NGO must validate the scale and scoring key. Source totals were preserved and never recalculated.

### 4. Connector experience

- **Supabase:** Connector SQL applied and verified the schema, RLS state, and imported-row counts. The Supabase CLI was unavailable, so changes used the connector. Schema review caught a missing `name_of_child` attendance field; a second migration fixed it before import.
- **Google Drive:** Live sheet/tab reads and the failure log sheet worked. Workbook names and headers needed verification because the sheet could change and some prompt text was truncated.
- **GitHub:** Branch, file, and PR work succeeded. Live state checks mattered: PR #1 was merged into `main` even though an earlier status had it open. Later direct commits to `main` were made only after Tanya explicitly requested them.

### 5. Practices to repeat

Preserve source-shaped records and values; record `source_file`, `source_sheet`, and `source_row`; keep an auditable per-row failure log; confirm relationships and dropdown rules with the owner; make missing/unknown identifiers fail visibly; keep RLS enabled with client access blocked until a real policy model is approved. For hospital feedback, Tanya explicitly confirmed a separate population from Beneficiaries. The pilot used exact child names to assign separate `H-0001` IDs because no child ID existed in the source; this enabled linkage without inventing a beneficiary relationship. Risks include same-name collisions, spelling/case differences producing duplicate identities, name changes breaking matches, and two children with the same name being conflated. Live projects should capture a stable child ID.

## Recommendations for Cohort 2

1. **Run a data-prep checklist before modeling:** confirm the authorized tab count and exact live tab names; snapshot headers; check required identifiers, dates, blank rows, distinct values, spelling, casing, and duplicate keys.
2. **Agree on durable IDs and reruns up front:** add a stable source record key where possible. If pilot row references are used, document when a clean reload is mandatory.
3. **Validate scoring with the domain owner before schema approval:** identify negatively worded items from header text, confirm forward/reverse rules and expected totals, and agree on representative sample rows and match criteria.
4. **Do connector preflight before kickoff:** verify GitHub repository/branch permissions, Supabase project and available SQL path, and Drive access to the exact source. Confirm who merges PRs and what branch policy applies.
5. **Compare every source header to the draft schema before applying DDL:** check field coverage and data types; then verify table columns/FKs/RLS against the approved model before migration. This would have avoided the extra attendance-column migration.
6. **Keep access decisions explicit:** enable RLS and block clients during the pilot, but schedule an owner decision on authentication, roles, and row visibility before front-end work.
7. **Make migration observable:** preflight counts, import in dependency order, preserve source provenance, reconcile inserted/updated/unchanged/failed totals, and put every rejected row with a reason in the failure log.

## Effort estimate

The recorded workflow spans about **4 hours 17 minutes end to end**, around **22 user prompts**, and **eight main steps** (planning through handover), followed by ER diagram and context-document tasks. This is a collaboration-window estimate, not measured active labor; Cohort 2 should budget roughly **half a day** including data-owner decisions and verification.

## Phase 2 dashboard handoff

Phase 2 adds a shared filters-first dashboard layout across Beneficiaries, Daycare Attendance, Hospital Sessions, and Assessments. Score cards and chart aggregates respond to the active filters; charts export grouped CSV; full records stay in a searchable, paginated drawer. PostgreSQL functions aggregate chart data, and the page does not fetch the full record set to the browser. New entries are insert-only and stamped with `Happy Feet Dashboard` / `Manual Entry` provenance and a code-generated positive `source_row`.

The Phase 2 work was tested locally with synthetic PGlite fixtures, type checking, and linting. No hosted SQL was applied and no PR was merged as part of that work. The policies are test-only read/insert policies with the comment **TEST ONLY - tighten before real data**. There is no login, edit, or delete feature.

The source-data migration total remains **12,724 inserted, 0 updated, 0 unchanged, and 166 failed**. Before real data, the PM still needs to decide login/authorization, manual `source_row` semantics, the Rosenberg scoring key, and durable hospital child identity. See [Phase 2 playbook](docs/PLAYBOOK_phase2.md) for setup variables, ordered migrations, known deployment gotchas, and the dummy-project cleanup SQL.
