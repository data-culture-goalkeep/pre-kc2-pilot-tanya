# Phase 2 dashboard playbook

## What Phase 2 adds

The Beneficiaries dashboard now has shared filters, three score cards, six charts, and a paged records drawer. Daycare Attendance adds month, program, and beneficiary filters; attendance summaries; attendance and quarterly charts; and manual entry of one monthly row. Hospital Sessions adds month and hospital filters, session charts, and one-session entry for an existing hospital child or a newly assigned `H-####` ID. Assessments adds test, Pre/Post, and month filters with database-side response distributions and a form for one new assessment.

All pages put filters first, then score cards, then charts. Each chart offers add and chart CSV controls. Records live in a separate drawer with search, pagination, current filters, and CSV export. Reads and writes use the server-side Supabase client. PostgreSQL functions group chart data before it reaches the page; only one 20-row records page is fetched into the drawer at a time. The pages use the existing brand pink, blue, and purple palette. New-entry success uses the “Entry saved successfully” toast for three seconds.

The new dashboard access policies are explicitly marked `TEST ONLY - tighten before real data`. They allow only reads and inserts, require manual-entry provenance on inserts, and provide no edit or delete flow. Hospital children remain separate from beneficiaries.

## What is not included

- Editing and deleting existing records.
- Authentication or a login flow. Google sign-in was discussed, but authentication is a decision to make before real data.
- Applying migrations to Supabase, merging PRs, or deploying to production.
- Recomputing source assessment totals. Rosenberg response charts count SA/A/DA/SD as entered; Stirling charts count scores 1–5 split by Pre/Post. No reverse scoring or calculated totals are used.

The Phase 1 migration reconciliation remains **12,724 inserted, 0 updated, 0 unchanged, and 166 failed**. Those figures describe the earlier source-data load, not Phase 2 manual entries.

## Setup and migration order

Set these Vercel environment variables in the intended deployment environments:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Project URL, for example `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (or legacy anon key during this pilot) |

Do not use a service-role key. These server-only variables do not use a `NEXT_PUBLIC_` prefix.

After reviewing each PR and confirming the project contains dummy data, apply migrations in this order:

1. Existing schema migrations: `20261001044732_create_happy_feet_schema.sql`, then `20261001060420_add_name_of_child_to_daycare_attendance.sql`.
2. `20261004132727_beneficiaries_test_access.sql` for Beneficiaries test-only read/insert access.
3. `20261004145500_beneficiary_dashboard_aggregates.sql` for Beneficiary chart and score-card aggregation.
4. `20261004170000_daycare_attendance_dashboard.sql` for Daycare Attendance policies and database aggregates.
5. `20261004180000_hospital_sessions_dashboard.sql` for hospital policies, next H-ID allocation, session insert, records view, and aggregates.
6. `20261004190000_assessments_dashboard.sql` for assessment policies, records view, and response aggregates.

The schema migrations are already part of the repository's original setup. The migrations from item 2 onward are the pending Phase 1/2 changes in these PRs. Do not apply them to a real-data project: the policies intentionally permit unauthenticated test access.

## Gotchas

- The repository was made public during the pilot. Confirm whether that visibility is still acceptable before storing any real data.
- Vercel is under a personal Hobby account. Review project ownership, team access, and plan limits before treating it as an organization deployment.
- One earlier Vercel build failed because `src/types/database.ts` was corrupted as a binary file. Restore it as plain UTF-8 TypeScript and rerun `npm run typecheck` and `npm run build` if that message appears.
- Preview deployments may sit behind Vercel sign-in. A working deployment URL does not guarantee the intended reviewer can open it. Do not ask reviewers to enter Google credentials into the application.
- Synthetic PGlite tests cover migration SQL without contacting Supabase. A passing local check is not evidence that a hosted migration was applied.
- The Daycare Attendance denominator is calendar days in the month minus days marked `NA`; the financial year is used to determine leap-year February.
- Manual inserts use `source_file = 'Happy Feet Dashboard'`, `source_sheet = 'Manual Entry'`, and a positive `source_row` generated in application code. Confirm this convention before importing or reconciling these entries against a source sheet.

## Open PM decisions before real data

1. Decide which login and authorization model is required before real data. Google sign-in is a requested convenience, not authentication that has been implemented.
2. Decide how `source_row` should work for manual entries long term: generated random positive values avoid collisions but are not source-sheet row numbers.
3. Confirm the Rosenberg scoring key with the program owner. The dashboard deliberately shows raw answer distributions and never recalculates the stored source total.
4. Approve a durable hospital child identity process. `H-####` IDs are allocated from a database sequence, but existing name-based pilot matching can still have same-name and spelling risks.
5. Replace the broad test-only RLS policies with role-aware access before any real records are entered.
6. Confirm repository visibility, Vercel ownership, and which reviewers can access protected preview deployments.

## Test-row cleanup SQL

Run only in the dummy-data project after confirming that every matching `Happy Feet Dashboard` / `Manual Entry` row is disposable. The transaction removes manually entered feature rows first, then manually created beneficiaries. A remaining foreign-key reference will make the beneficiary delete fail and roll back the transaction for review.

```sql
begin;

delete from public.hospital_session_feedback
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';
delete from public.hospital_children
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';

delete from public.rosenberg_assessment_history
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';
delete from public.stirling_assessment_history
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';

delete from public.daycare_attendance
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';
delete from public.daycare_quarterly
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';

delete from public.beneficiaries
where source_file = 'Happy Feet Dashboard' and source_sheet = 'Manual Entry';

commit;
```
