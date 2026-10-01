# Pre-KC2 Pilot Phase 1 — Project Context

## Stage 1: Planning
- **Decisions:** Phase 1 covers the data model, Supabase database, migration, and handover; no front end.
- **Assumptions:** Seven source tabs were intended.
- **Open questions:** Exact tab names, relationships, stable rerun keys, and access policies.
- **Current state:** GitHub and Supabase access were verified. At planning time, stages required Tanya's `ok`, migration required “run migration,” and work was to stay off `main`; later explicit requests authorized the diagram and context commits directly to `main`.

## Stage 2: Data Model
- **Decisions:** Seven exact live tabs were verified; 4A and 4B were excluded.
- **Assumptions:** No relationships were inferred beyond repeated source fields.
- **Open questions:** Whether Hospital Session Feedback children linked to Beneficiaries; dropdown values were unconfirmed.
- **Current state:** Step 2 completed and seven tab structures reviewed; model drafting awaited resolution of the hospital-child link.

## Stage 3: Model Review
- **Decisions:** Hospital children are a separate entity with generated H-0001-style IDs; attendance remains wide; source-row references are pilot rerun keys.
- **Assumptions:** Short clean dropdown lists can use enums; inconsistent variants and long lists stay as text.
- **Open questions:** Rosenberg scoring key and reversed items; the revised straight 1–4 sum matched 0 of 5 sampled source totals. Tanya later directed us to skip the reverse-score check and retain that result as an NGO validation question.
- **Current state:** Revised model and ER diagram were prepared, including required beneficiary FKs, numeric scale checks, and separate hospital-child linkage.

## Stage 4: Schema Creation
- **Decisions:** Created schema for all seven approved source tabs; no source data was migrated in this stage.
- **Assumptions:** Preserved source-shaped attendance and approved enum and ID rules.
- **Open questions:** Rosenberg scoring key and access policies remained unresolved.
- **Current state:** Eight tables were applied to the test Supabase project; RLS was enabled and client access blocked. SQL was committed on `feature/happy-feet-schema`; PR #1 was open at the time and was later merged into `main`. The Supabase CLI was unavailable, so SQL was applied through the connector.

## Stage 5: Schema Verification
- **Decisions:** Verified eight tables against the approved model, with source tracking on every source-backed row, indexed foreign keys, and NOT NULL beneficiary links.
- **Assumptions:** All imported source rows should retain file, sheet, and row provenance.
- **Open questions:** Header spelling/wording variants, including 3A “Educational Provided Required Date” and 5A “Q8:”; access policies; source-row stability; Rosenberg scoring.
- **Verification/current state:** All eight tables have RLS enabled and no client policies. There were no database insert failures, unparseable dates, or enum mismatches. The 166 rejected source records were logged: 116 attendance unknown/missing beneficiary IDs, 1 Homecare unknown beneficiary ID, and 49 hospital feedback rows missing a child name.

## Stage 6: Migration
- **Decisions/results:** Migrated only the seven approved tabs; all counts below are inserted / updated / unchanged / failed.
- **Counts:** Beneficiaries 234/0/0/0; Daycare Attendance 2,945/0/0/116; Daycare Quarterly 1,058/0/0/0; Homecare Monthly 306/0/0/1; Hospital Session Feedback 7,961/0/0/49; Rosenberg history 107/0/0/0; Stirling history 113/0/0/0. Total: 12,724 inserted and 166 failed.
- **Failures:** The 116 attendance and 1 Homecare rows had missing or unknown beneficiary IDs; 49 hospital rows had no child name. All failures were logged in the [migration failure sheet](https://docs.google.com/spreadsheets/d/1gEUlXVW_CBuuvj_bnMRWN24g_1IhWeQoNvwgfO_jCzQ/edit?usp=drivesdk); none failed silently.
- **Assumptions/limitations:** Source-row references are the pilot rerun key. Sorting or inserting rows requires a full clean reload. Hospital children remain separate from Beneficiaries and are identified by exact name only; live projects should capture a child ID.
- **Open questions/current state:** The Rosenberg straight-sum result remains: “Rosenberg straight 1-4 sums matched 0 of 5 source totals; scoring key (scale, reversed items) to be validated with the NGO.” RLS is enabled with zero client policies; access policies remain TBD. All imported rows have source tracking; 34 hospital children received H-0001–H-0034 IDs.
