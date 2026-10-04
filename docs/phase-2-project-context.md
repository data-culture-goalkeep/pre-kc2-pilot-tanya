# Happy Feet Home — Phase 2

## Step 2: Root layout and Navbar

- Decisions: Next.js App Router with TypeScript, Tailwind CSS variables, system typography, and shadcn/ui configuration; shared Navbar with the supplied logo through next/image.
- Assumptions: The four data routes are placeholders until their individual feature PRs; Step 2 does not need database access or deployment secrets.
- Open questions at Step 2: source_row=NULL conflicted with NOT NULL; Tani resolved this in Step 3 by requesting generated positive manual-entry numbers.
- Verification: Lint, typecheck, and production build passed. Browser checks passed at 320, 390, 768, 1024, and 1440px: all routes, logo loading, active links, menu close after selection, Escape handling, no horizontal overflow, and no browser errors. Mobile and desktop screenshots were visually inspected. Actual Vercel preview speed remains unmeasured.
- Current state: Navbar PR #3 was merged by the repository owner; Step 3 starts from that merged main.

## Step 3: Beneficiaries

- Decisions: Server-side Supabase reads and inserts, 60-second ISR, pink count card, seven staff columns, filtering and pagination, accessible add Sheet, validated fields, three-second success toast with fade, and all-column CSV export for all matching rows.
- Assumptions: The connected project contains dummy data. Tani explicitly authorized test SELECT/INSERT policies on beneficiaries only; these supersede the earlier PM-wait restriction for this table.
- Numbering: The server reads the maximum source_row for Happy Feet Dashboard / Manual Entry in beneficiaries and tries the next positive number. The existing beneficiaries_source_row_uq makes competing inserts atomic; collisions are re-read and retried up to five times. Beneficiary-ID duplicates produce an explicit error. No unique key or NOT NULL constraint changes.
- Verification: All nine tests, lint, typecheck, and production build passed. Isolated Postgres checks verified read/insert policies, required provenance, and uniqueness. Production browser checks with SQL-backed dummy data passed for saves, validation, duplicate/denied saves, toast timing, filtered all-column CSV, pagination, mobile panels, and no browser errors or client key exposure. Desktop/mobile screenshots were visually inspected. Vercel preview speed remains unmeasured. No migration or test writes have been applied to the connected Supabase project.
- Current state: Prepared on feature/beneficiaries; user must review and apply the migration, configure Vercel variables, and test the real preview before requesting merge.

## Confirmed product rules for subsequent features

- Beneficiaries test SELECT/INSERT policies are included as an unapplied migration. Other tables retain their existing access restrictions. Local tests use isolated synthetic fixtures; the app uses Supabase, never a silent fallback to fixtures.
- Manual-entry provenance: source_file="Happy Feet Dashboard", source_sheet="Manual Entry", source_row=next positive number for this pair in beneficiaries. Keep source_row NOT NULL.
- Attendance percentage: P days / (days in the applicable calendar month minus NA days) × 100. NA means Not Applicable. Exclude calendar-invalid day columns; show no rate when the denominator is zero. Distinguish months by financial year.
- Rosenberg: count SA/A/DA/SD raw responses across question fields, without reverse scoring or recomputing source totals.
- Stirling: count 1–5 responses across question fields, grouped by Pre/Post.
- Live query and mutation failures must be visible. A successful save toast requires a confirmed write; synthetic testing must remain distinguishable from live saves.
- New page features require their own PR and Vercel preview review before Tani says "merge".

## Frontend development

Run `npm ci`, then `npm run dev`. Verification: `npm test`, `npm run lint`, `npm run build`, and `npm run typecheck`; `npm start` serves the production build.

Step 3 needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel environment variables. The key may be the modern publishable key or legacy anon key; do not use service_role or a secret key. Neither variable has a NEXT_PUBLIC prefix, and the client factory imports server-only. No actual values are stored in the repository or a .env file.

The existing vercel.json pins deployment functions to bom1. This feature adds no changes to that configuration. A one-second preview load target must be measured on the actual Vercel preview; local response times do not certify it.
