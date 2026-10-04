# Happy Feet Home — Phase 2

## Step 2: Root layout and Navbar

- Decisions: Next.js App Router with TypeScript, Tailwind CSS variables, system typography, and shadcn/ui configuration; shared Navbar with the supplied logo through next/image.
- Assumptions: The four data routes are placeholders until their individual feature PRs; Step 2 does not need database access or deployment secrets.
- Open questions: The requested manual-entry source_row=NULL conflicts with the deployed NOT NULL constraint; PM must resolve this before live inserts.
- Verification: Lint, typecheck, and production build passed. Browser checks passed at 320, 390, 768, 1024, and 1440px: all routes, logo loading, active links, menu close after selection, Escape handling, no horizontal overflow, and no browser errors. Mobile and desktop screenshots were visually inspected. Actual Vercel preview speed remains unmeasured.
- Current state: Navbar feature prepared on feature/phase-2-navbar; main and Phase 1 database files are unchanged.

## Confirmed product rules for subsequent features

- RLS remains blocking. Use clearly labeled synthetic seed fixtures for testing; do not insert seed rows into the connected database. Future fixture mode must be explicit, never a silent fallback after a live query error.
- Requested manual-entry provenance: source_file="Happy Feet Dashboard", source_sheet="Manual Entry", source_row=NULL. Do not fabricate a source row to bypass the current schema constraint.
- Attendance percentage: P days / (days in the applicable calendar month minus NA days) × 100. NA means Not Applicable. Exclude calendar-invalid day columns; show no rate when the denominator is zero. Distinguish months by financial year.
- Rosenberg: count SA/A/DA/SD raw responses across question fields, without reverse scoring or recomputing source totals.
- Stirling: count 1–5 responses across question fields, grouped by Pre/Post.
- Live query and mutation failures must be visible. A successful save toast requires a confirmed write; synthetic testing must remain distinguishable from live saves.
- New page features require their own PR and Vercel preview review before Tani says "merge".

## Frontend development

Run `npm ci`, then `npm run dev`. Production verification: `npm run lint`, `npm run build`, and `npm run typecheck`; `npm start` serves the production build.

No .env file is required for the Step 2 shell. Later credentials belong exclusively in Vercel environment variables and server-only modules, never NEXT_PUBLIC variables or component code.

The existing vercel.json pins deployment functions to bom1. This feature adds no changes to that configuration. A one-second preview load target must be measured on the actual Vercel preview; local response times do not certify it.
