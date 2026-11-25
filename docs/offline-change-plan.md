# Happy Feet Home offline IDS: Stage 1 audit and change plan

**Scope:** read-only audit and plan only. No application code, migration, Supabase data, or deployment was changed. This document is the only proposed repository file.

**Repository audited:** `data-culture-goalkeep/pre-kc2-pilot-tanya`, `main`.

**Supabase audited:** Happy Feet test project `pre-kc2-happy-feet-test` (`ktobhlqfeqdxydppczmm`, ap-south-1), using metadata and aggregate-only SQL. No row contents, secrets, tokens, or keys were read. The aggregate checks show that this is a populated test project; handle it as data-bearing.

**Agreement:** Next.js, Supabase, Vercel, GitHub; browser storage with Dexie/IndexedDB, a service worker, and application-owned synchronization. No paid service, KoboToolbox, or mandatory native app. POC scope is add a beneficiary and save attendance for one child on one date while offline. Dashboards, assessments, and hospital sessions remain online-only.

## Executive audit

1. Today, data pages are Next.js server-rendered and fetch from Supabase. They are not an offline app and their 60-second server caches do not provide browser-local data.
2. The Next.js app uses cookie-based Supabase SSR sessions; `proxy.ts` validates with Supabase on protected requests. That network check cannot be the offline gate.
3. Google OAuth requires connectivity. The OAuth callback checks only that the email has email syntax; it does not enforce the stated `@goalkeep.net` domain or an approved-user list in application code. Supabase project-side signup/provider settings were not inspected.
4. The admin page is protected by the exact `tanya@goalkeep.net` email check and server-side Supabase Admin API. It is online-only. No offline admin actions should be supported.
5. The base beneficiary ID is text with no database default; the app currently creates `B-<UUID>` in a server action. Beneficiary manual-entry `source_row` is allocated by reading max + 1 and retrying a unique-constraint collision.
6. Existing attendance is one wide monthly row with `day_01`…`day_31`; it is not one row per child per date. The current test database has 2,945 rows, 2,935 distinct child/month/year keys, and 10 duplicate groups (10 excess rows). No child/month/year unique constraint is present in the live table.
7. Existing attendance saves go through `save_daycare_attendance_grid`, which serializes per child/month/year, updates only when exactly one row exists, blocks duplicate groups, and inserts if none exists. It is online-only and is not idempotent across a lost response/retry as a sync protocol.
8. RLS is enabled, but the live test policies for beneficiaries and attendance allow `anon` reads and test inserts; attendance also allows `anon` updates. This is explicitly test access in migrations, not a safe offline authorization boundary. Tighten it before real data is cached or used offline.
9. Vercel is configured for `bom1`. There is no service worker, manifest, Dexie dependency, local sync layer, or offline page in the audited tree. `@electric-sql/pglite` is a development dependency, not the selected browser database.
10. The current offline pilot needs a new local daily attendance representation, explicit organization membership/security, idempotent sync receipts, conflict handling, and a safe offline session/unlock policy. These are design work, not applied changes.

## Audit inventory

“Ready” means already compatible with local operation; it does not mean the entire application is offline-ready. “Needs change” means a POC feature can be adapted. “Online-only” means it stays network-dependent by agreement for this POC.

### Routes and page behavior

| Area | Current behavior | Offline problem | Proposed change | Status / size |
|---|---|---|---|---|
| `src/app/layout.tsx` | Shared Next.js layout, fonts/styles and app shell. | Not independently guaranteed to load offline; Next build assets are not precached. | Add a build-versioned worker and static fallback shell; cache only versioned static assets and explicit public shell resources. | Needs change / medium |
| `src/app/page.tsx` | Static link hub, but navigation into data routes still hits protected server routes. | Static-looking HTML does not make destination pages or auth checks local. | Make offline entry explicitly client-side and point to the local POC workspace when a local unlock is active. | Needs change / small |
| `src/app/beneficiaries/page.tsx` | Server Component; parses URL filters, calls `getBeneficiaryDashboardData`, `revalidate=60`, returns summary/charts. | Supabase/RSC and server cache needed; cannot render from Dexie. | Add a POC local list/form route or local mode inside this route; load and filter IndexedDB after the shell is available. Keep dashboard aggregates online. | Needs change / large |
| `src/app/attendance/page.tsx` | Server Component; calls `getDaycareData` and `getDaycareAttendanceGrid`; `revalidate=60`. | Both RPCs run online; current grid is a monthly record, not child/date records. | POC offline screen reads/writes local daily records. Keep current monthly dashboard and its filters online until the daily data integration is approved. | Needs change / large |
| `src/app/hospital/page.tsx` | Server Component; calls hospital dashboard RPC; `revalidate=60`. | Requires server/RPC data; not local. | Leave online-only in POC. | Online-only / none for POC |
| `src/app/assessments/page.tsx` | Server Component; calls assessment dashboard RPC; `revalidate=60`. | Requires server/RPC data; not local. | Leave online-only in POC. | Online-only / none for POC |
| `src/app/login/page.tsx`, `login/login-form.tsx` | Google button redirects through `/auth/sign-in`; email/password and reset requests call `/auth/email`. | Google, password verification, reset email, and Supabase are online. | Keep first sign-in online; after successful online authorization, let user configure a device-local unlock for already-authorized local work. Do not pretend Google OAuth or password reset work offline. | Needs change / large |
| `src/app/reset-password/*` | Reset UI sends a network POST to `/auth/update-password`. | Requires a valid Supabase recovery session and network. | Keep online-only; show a clear offline state. | Online-only / small UX change |
| `src/app/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`, `src/components/admin-user-manager.tsx` | Page checks configured admin; API uses server-side Supabase Admin API to list, invite, suspend/restore. | Depends on Auth Admin API and email delivery; no offline-safe admin authority. | Keep online-only; never queue invites, revokes, or admin changes for later. | Online-only / none for POC |
| `src/app/*/export/route.ts` and `src/app/*/charts/export/route.ts` for beneficiaries, attendance, hospital, assessments | Server routes query current data and return downloads/charts. | Query Supabase; local records may be pending and export behavior would be ambiguous. | Keep online-only; disable or label unavailable in offline mode. | Online-only / small UX change |
| `src/app/beneficiaries/loading.tsx`, `error.tsx` | Loading/error UI for the server-rendered beneficiaries route. | It cannot replace a persistent offline shell or show local pending writes. | Add separate offline/sync-state UI; preserve existing online boundaries. | Needs change / small |
| `src/components/navbar.tsx`, `dashboard-workspace.tsx`, `page-placeholder.tsx` | Navigation and online dashboard workspace. | Links assume network routes; online page state is not a local database. | Indicate offline mode/status and link only to the local POC tasks when unlocked. | Needs change / small |
| `src/components/ui/sheet.tsx` | Reusable presentation/dialog primitive; no Supabase or persistence calls. | Not an offline data source; UI can be reused if its bundle is precached. | No data-layer change; include its required static JS/CSS in the worker asset strategy. | Ready as presentation / small packaging check |

### Client components and forms

| Area | Current behavior | Offline problem | Proposed change | Status / size |
|---|---|---|---|---|
| `beneficiaries-view.tsx`, `charts/beneficiary-charts.tsx`, `data-table.tsx` | Client presentation over data passed by server pages; table/chart controls can trigger server actions. | Props are a server snapshot, not an IndexedDB subscription; dashboard views are online. | Keep aggregates online; add local beneficiary list/form with explicit local/sync status. | Needs change / large |
| `forms/beneficiary-form.tsx`, `src/lib/validation/beneficiary.ts` | Form uses shared validation and calls `saveBeneficiary`. Required identity/program/status/DOB validation is client/server code. | Save currently requires action + Supabase; generated ID is server-side. | Reuse pure validation locally; generate stable `B-<crypto.randomUUID()>` on device; persist first to Dexie and queue the same stable ID. Confirm form field set is appropriate for offline collection. | Needs change / medium |
| `daycare-attendance-view.tsx`, `forms/daycare-attendance-form.tsx` | Grid edits monthly row; calls `saveDaycareAttendanceGrid` / server action. The form uses month, financial year and 31 day slots. | Requires Supabase RPC; row-level edits do not represent isolated daily events. | Add child/date/status editor backed by Dexie; use one local row per child/date. POC codes currently include P, A, H, NA; blank means not recorded. | Needs change / large |
| `forms/hospital-session-form.tsx`, `hospital-sessions-view.tsx` | UI calls online server action and RPC for a separate hospital-child registry/session. | Requires network, sequence-generated hospital child ID, and sensitive session fields. | Leave online-only; no offline queue or local copy in POC. | Online-only / none for POC |
| `forms/assessment-form.tsx`, `assessments-view.tsx` | Search and save use online server actions and assessment tables. | Search, FK validation, and insert need Supabase; assessment calculations/data are outside POC. | Leave online-only. | Online-only / none for POC |
| `export-button.tsx`, `save-toast.tsx` | Browser starts server exports; toast reports action result. | Export is online; existing toast does not persist pending/sync state. | Retain for online pages; add local saved/pending/failed/conflict labels for the POC. | Needs change / small |

### Server actions, queries, and auth plumbing

| Area | Current behavior | Offline problem | Proposed change | Status / size |
|---|---|---|---|---|
| `src/lib/actions/beneficiaries.ts` + `beneficiaries-store.ts` | Auth check; validate; generate B-UUID on server; read latest manual `source_row`; insert; retry up to five source-row unique collisions; invalidate Next cache. | Server action cannot run disconnected; server-created identity is unavailable until online. | For local POC create, generate client ID and outbox mutation. On sync, preserve ID, assign source provenance/row number transactionally server-side, and return authoritative version. | Needs change / large |
| `src/lib/actions/daycare.ts` | Auth check; validate month/year/program, rows and codes; random `source_row`; call `save_daycare_attendance_grid`; invalidate cache. | Requires network; random source_row is not an idempotency key. | Replace POC local save with Dexie child/date record; sync stable mutation ID and expected version through an authenticated server endpoint/RPC. | Needs change / large |
| `src/lib/actions/hospital.ts` | Auth check; validates form; random source rows; calls `insert_hospital_session_entry`; invalidates cache. | Online RPC; separate ID/identity rules. | Keep online-only. | Online-only / none for POC |
| `src/lib/actions/assessments.ts` | Online beneficiary search and direct insert into Rosenberg/Stirling history; UUID database defaults and random source rows. | Needs Supabase, valid beneficiary FK, and scoring data. | Keep online-only. | Online-only / none for POC |
| `src/lib/actions/*` record loaders | Require authenticated user and call server queries. | Online-only and currently require `getUser()`; they do not read Dexie. | Keep for online views. Add separate local repository modules rather than trying to make server actions run in a browser. | Needs change / medium |
| `src/lib/queries/beneficiaries.ts`, `beneficiary-dashboard.ts` | Paginated/direct beneficiary reads plus `beneficiary_dashboard_data` RPC; cached with `unstable_cache` for 60 seconds. | Server cache is not browser persistence; may be stale and needs server. | Use an explicit online bootstrap to populate local authorized beneficiary rows; local reads thereafter. Keep chart aggregates online. | Needs change / large |
| `src/lib/queries/daycare.ts` | Dashboard RPC, grid RPC, direct monthly attendance and joined beneficiary records; 60-second dashboard cache. | Monthly shape and server RPC are not usable offline. | Add local daily data repository and versioned delta download; keep monthly dashboard online during POC. | Needs change / large |
| `src/lib/queries/hospital.ts`, `assessments.ts` | Dashboard RPC and direct views; paginated/export reads; 60-second server cache. | Requires network and is out of POC. | Keep online-only. | Online-only / none for POC |
| `src/lib/auth/allowed-login-domain.ts` | Function named as domain check only validates email syntax. | Not an approved-user or organization check. | Replace/augment with explicit server-verified membership and organization authorization before enabling offline data. | Needs change / large |
| `src/lib/auth/admin.ts` | Hardcoded `tanya@goalkeep.net` admin check; server-side Admin client uses secret env server-side. | Role authority is app-specific and online; cached role can become stale. | Keep admin control online; validate admin identity/role server-side on every sensitive request. Never put secret key in browser or worker. | Needs change / medium |
| `src/lib/auth/require-authenticated-user.ts`, `src/lib/supabase/server.ts` | Server-side cookie client and remote `auth.getUser()`. | Must reach Supabase; refresh/revocation cannot be checked offline. | Keep server auth for online sync. Offline unlock is a separate local-device gate, never a replacement Supabase identity. | Needs change / large |
| `src/proxy.ts` | For protected paths, calls remote `getUser`; redirects on missing config/auth/error or invalid email. | While offline, a network/auth error redirects, blocking a cached Next page. | Preserve online gate on server endpoints. Route the local offline shell through a safe static worker fallback, never cache privileged server responses as authorization. | Needs change / large |
| `src/app/auth/sign-in`, `callback`, `email`, `recovery`, `update-password`, `sign-out` | OAuth code exchange, password sign-in/reset, recovery, password update and logout use Supabase Auth and cookies. Callback/recovery require `getUser`; sign-out clears online/local cookies. | All are network-dependent. Browser Google account selection is not an app allowlist. Offline logout cannot revoke a server session, and local queued data must not be silently lost. | Online OAuth first; local unlock only after that; offline lock/logout clears in-memory key and protects local data; defer server revocation until online; pending queue must remain account-bound and visibly blocked from another account. | Needs change / large |
| `src/types/database.ts`, `src/lib/*` pure validation/date/filter/CSV helpers | Generated types and pure functions; not all need network. | Type definitions alone do not persist data; date/year semantics must match India rules. | Reuse only pure validation/constants; add separate Dexie types/versioned migration. Test dates across IST/FY boundary. | Ready for pure helpers; needs change / small |

Pure helper modules reviewed include `src/lib/assessments.ts`, `beneficiaries.ts`, `daycare.ts`, `financial-year.ts`, `hospital.ts`, `navigation.ts`, `csv.ts`, and `utils.ts`. They compute constants, validation/display filters, date/year mapping, CSV formatting, or classes; they do not persist records. Reuse relevant validation/date logic locally and verify India timezone/financial-year behavior in tests. `src/types/database.ts` describes Supabase types but is not a local database schema.

### Runtime and deployment configuration

| Area | Current behavior | Offline problem | Proposed change | Status / size |
|---|---|---|---|---|
| `package.json` / lockfile | Next.js 16.3.8, React 19.3.0, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.2; Node engine 24.x. `@electric-sql/pglite` 0.5.8 is a development dependency. | No Dexie package or browser persistence package is present. PGlite is not the selected storage plan. | Add Dexie in a separate reviewed PR and lock the exact version. Check compatibility against the existing Next/browser support policy. | Needs change / small |
| `next.config.ts` | Only sets `poweredByHeader: false`. | No offline/PWA setup or static fallback configured. | Keep custom worker registration and cache policy explicit; avoid adding a plugin that caches private Next responses by default. | Needs change / medium |
| `vercel.json` | `regions: ["bom1"]`; no custom headers/rewrites or worker configuration. | Vercel deployment does not itself cache the site for offline use. | Serve a same-origin worker from `public/`, ensure correct MIME/scope and immutable hashed assets. Validate production headers after deploy. | Needs change / medium |
| `public/` and app worker assets | No service worker, web manifest, or offline shell was found in the audited repository tree. | No controlled offline navigation fallback or cached application shell exists. | Add a versioned worker and an explicitly public static fallback in the shell PR; do not cache private HTML, RSC, action responses, or API data. | Needs change / medium |
| Automated tests | No checked-in `tests/` directory was found; the package test script targets `tests/*.test.ts`. | No existing offline, auth, sync, or conflict regression suite was available. | Add targeted tests with each implementation PR; do not treat the current script as evidence of passing tests. | Needs change / medium |

## Current data model and Supabase observations

The repository migration history describes eight core data tables: beneficiaries, daycare attendance, daycare quarterly, homecare monthly, hospital children, hospital session feedback, Rosenberg assessment history, and Stirling assessment history. This POC only needs the first two, plus new sync/security metadata and a daily attendance representation.

| Concern | Current design | Offline implication |
|---|---|---|
| Beneficiary primary ID | `beneficiaries.beneficiary_id` is text primary key; no DB default. Current action creates `B-${randomUUID()}` on server if blank. | Can be generated on device with Web Crypto and held stable across retries. Server must reject reuse with different payload and must not overwrite an existing child. |
| Beneficiary source row | Unique `(source_file, source_sheet, source_row)`; server reads max manual source row + 1 and retries unique collision up to five times. | Allocate source row only at server commit, in the same transaction as idempotency receipt. It is import provenance/row reference, not an offline identity. |
| Monthly attendance primary/unique keys | `attendance_id` UUID defaults at database. FKs to beneficiary. Unique source provenance `(source_file, source_sheet, source_row)`. Intended unique child/month/year constraint in migration is skipped when duplicate groups exist. Live catalog check found only PK, FK, and source-row unique constraint; no child/month/year unique constraint. | Do not use the random `source_row` or generated attendance UUID as idempotency. Daily POC needs a stable child/date unique key plus mutation receipt. |
| Attendance shape | One row per beneficiary/month/year, with 31 nullable day columns and total. Current list reports P/A/H/NA codes. | A daily event should be stored as a child/date record locally and on server. Do not flatten simultaneous device edits into a full month snapshot. |
| Live test counts (aggregate only) | Beneficiaries 235; monthly attendance 2,945; daycare quarterly 1,058; homecare monthly 306; hospital children 34; hospital feedback 7,961; Rosenberg 107; Stirling 113. Attendance has 10 duplicate child/month/year groups, 10 excess rows. | Realistic offline tests need safe test accounts/data approval. Existing duplicate groups must be resolved or preserved as review items before a uniqueness/backfill migration. No row contents were queried. |
| RPCs | `save_daycare_attendance_grid` uses invoker rights, locks each beneficiary/month/FY, rejects if >1 existing row, updates exactly one existing row or inserts when none. `daycare_attendance_grid_data` returns only a chosen row per child while exposing duplicate count. Hospital uses `insert_hospital_session_entry`; other dashboard RPCs aggregate server-side. | Existing grid RPC cannot provide full end-to-end sync semantics: no stable client mutation receipt, per-day row version, or delta cursor. Keep existing POC dashboards online; add a separate, narrow sync RPC/API. |
| RLS | RLS enabled on all core tables. Main schema revokes public/anon/authenticated table access; test migrations later add broad `anon, authenticated` read/insert policies on beneficiaries and read/insert/update policies on attendance. Current live policies confirm these roles. | RLS enabled is not proof of tenant protection. Remove anon policies and scope authenticated policies/RPCs by verified organization membership before local copies of real data. |
| Organizations / tenant key | No organization or membership table appeared among audited application tables. | Cross-organization isolation test cannot be implemented correctly until source of organization IDs and membership/admin ownership is decided. Add a mandatory tenant key to local rows, sync receipts, server rows, and change feed. |
| Other IDs | Hospital child ID comes from a server sequence (`H-0001` style); hospital sessions and assessment rows use DB UUID defaults. | Keep these areas online-only. Do not reuse sequence/UUID conventions as proof of offline idempotency. |

## Proposed Dexie/IndexedDB model for the POC

Use a new Dexie database with an explicit integer `schemaVersion` and additive Dexie upgrade functions. Keep the user/organization partition on every data and queue record. Store no Supabase access/refresh token, Google credential, service key, or server secret in IndexedDB or the service worker cache.

| Dexie table | Primary/index keys | Proposed fields |
|---|---|---|
| `deviceState` | `key` | `schemaVersion`, `activeUserId`, `activeOrganizationId`, `deviceId` (random UUID), `lastOnlineAuthAt`, `lastSuccessfulSyncAt`, `lastPulledCursor`, `appBuildId`, `offlineUnlockConfigured`; no raw password or Supabase token. |
| `beneficiaries` | `id`; indexes `[organizationId+syncState]`, `[organizationId+updatedAt]` | `id` (stable `B-<UUID>`), `organizationId`, supported beneficiary form fields (name, program, DOB, status, and selected existing form fields only), `createdAt`, `updatedAt`, `localVersion`, nullable `serverVersion`, `syncState` (`local-only`, `pending`, `synced`, `conflict`, `needs-review`), `lastMutationId`, `createdBy`. |
| `attendanceDays` | compound unique `[organizationId+beneficiaryId+date]`; secondary indexes by child/date and sync state | `organizationId`, `beneficiaryId`, `date` (`YYYY-MM-DD`, India calendar date), `code` (`P`, `A`, `H`, `NA`; null means not marked), `localVersion`, nullable `serverVersion`, `baseCode`, `baseServerVersion`, `updatedAt`, `syncState`, `lastMutationId`, `createdBy`. |
| `outbox` | `mutationId`; indexes `[organizationId+state+createdAt]`, `[entityType+entityId]` | Stable UUID `mutationId`, org/user/device IDs, `entityType`, `entityId`, operation, immutable payload, expected/base version, client timestamp, attempt count, `nextAttemptAt`, state (`pending`, `in-flight`, `blocked`, `conflict`, `accepted`), last safe error code. The outbox is the retry source of truth. |
| `syncReviews` | `reviewId`; indexes `[organizationId+status+createdAt]` | Local/server entity keys, reason (`possible-duplicate`, `version-conflict`, `invalid-reference`, `revoked-or-membership-changed`), compared safe summary fields, resolution status and actor/time. Avoid copying unnecessary sensitive payloads into a separate review record. |

The app should store only the fields needed by the POC. The current beneficiary table has many sensitive and operational fields; the owner must approve the exact offline subset and device retention policy before caching it. If full child details are required, they need the same protections as the online database.

## Sync design

### Record identity and one-time acceptance

- Generate one immutable UUID per local mutation. Retain it on every retry, including after timeout or tab/device restart.
- Server unique key: `(organization_id, mutation_id)`. Store a payload hash and the original outcome. Same mutation ID + same hash returns the saved outcome; same ID + different hash is rejected and logged as an integrity error.
- New beneficiary uses the device-generated beneficiary ID as the canonical ID. If that ID already exists under the same org, return the existing row only if it is the same accepted mutation/payload. If it collides with a different mutation, reject and create a review item; never silently overwrite.
- Attendance is one server row per `(organization_id, beneficiary_id, attendance_date)`, with a unique constraint. An identical duplicate payload is an idempotent no-op; a different value uses optimistic concurrency and either updates the expected version or returns a conflict for review.
- Allocate legacy `source_row` at server commit, not in the device. Treat it as provenance only. Keep sync mutation ID as the replay key.

### Upload and retry order

1. Confirm network, active local user/org, and online Supabase session before syncing. If auth or membership cannot be verified, stop uploads and preserve the queue.
2. Send parent beneficiary creates before dependent attendance. Within a parent-first batch, sort by creation time; do not send attendance until its beneficiary has a server-accepted ID.
3. Send modest batches (proposed 25 mutations/request) with each original mutation ID unchanged. Server applies each item in its own transaction so one bad item does not cause accepted items to replay ambiguously.
4. Retry transient network/5xx/429 errors with exponential backoff and jitter (proposed 1s → capped at 15m); retry on next app open/reconnect and foreground; use Background Sync only when browser supports it. Do not claim delivery while the browser is closed on unsupported platforms.
5. Validation, membership, permanent FK, or version-conflict responses move the item to blocked/review with a human-readable reason. Do not drop failed items. A user can retry after correction or an authorized admin can resolve online.
6. Server receipt, entity write, server version update, and change-feed event must commit atomically. A timeout after commit is safe because replay returns the stored receipt.

### Download, cursor and conflicts

- Initial authorized sign-in/bootstrap downloads only the POC beneficiary fields for the active organization plus recent/required daily attendance, paged by stable key. A local seed is not authorization; every online bootstrap must first verify organization membership.
- Incremental pull returns ordered change events and current authorized entity versions. Use a per-organization transactional cursor (row lock + increment inside the same transaction as the entity update) so clients cannot advance past an uncommitted lower sequence. A plain timestamp or sequence allocated outside the transaction can skip late commits.
- Save the new local cursor only after all pages and local writes complete in one Dexie transaction. Repeat pulls are safe.
- For attendance, compare the server version to `baseServerVersion`. If unchanged, apply the local value. If the server already has the same value, mark accepted. If both changed to different codes, retain both values and create a review item; do not use last-write-wins.
- For child registrations, exact matching ID is handled by idempotency. Different IDs with a plausible duplicate (normalized name plus DOB and, if approved, phone; never name alone as proof) are flagged for staff review. Do not auto-merge children or infer identity. Identity match rules and false-positive handling need HFH approval.
- Remote corrections arriving while the local row is pending must be shown as a conflict; never overwrite queued local edits silently.

### Sync status UI

Show: `Offline` / `Online`; pending mutation count; blocked/review count; last successful sync time (local time and date); last successful download cursor/time; whether this device’s local data may be stale; progress during upload/download; retry status/next retry; and a visible warning when local browser storage is unavailable or near quota. Per-row labels: `Saved on this device`, `Waiting to sync`, `Synced`, `Needs review`, or `Sync failed—retry`. Never call a locally saved record “synced.” Provide an explicit review screen with the local/server values needed to resolve attendance conflicts and possible duplicates. Keep sensitive record details out of service-worker logs and generic error messages.

## Supabase changes needed (plan only; not applied)

1. Decide tenant/org ownership and populate verified memberships. There is no organization table in the current schema, so cross-organization isolation cannot be guessed.
2. Remove unauthenticated `anon` access on beneficiaries/attendance and replace broad test policies with authenticated, organization-scoped RLS. Review existing dashboard RPC grants as well; the migrations grant several read RPCs to `anon, authenticated`.
3. Add row versions and update timestamps to mutable beneficiary/day tables; every accepted mutation increments version and writes one change-feed event.
4. Create a normalized daily attendance table for the new POC. Preserve the old wide monthly table during rollout; adapt online dashboards later after reconciliation/backfill design is approved.
5. Reconcile the 10 existing duplicate child/month/FY groups before adding constraints or backfilling daily attendance. The audit deliberately did not fetch group keys or values.
6. Add transactional idempotency receipts and a per-org change cursor. Implement authenticated, narrow RPCs (or server route using a server secret) with organization membership checks. Never expose `SUPABASE_SECRET_KEY` to client code.
7. Confirm beneficiary uniqueness policy. Current source-row uniqueness protects import provenance, while `beneficiary_id` only protects exact IDs. It does not prevent the same child being added under two IDs.

### Draft SQL (design sketch only; dependencies and policy decisions remain open)

This is intentionally **not applied** and is **not yet a runnable migration**. It assumes an `organizations` table and `organization_memberships` are approved and created first. The current repository does not contain those tables. Types/constraints, legacy data backfill and policy grants require review before implementation.

```sql
-- Proposed organization-scoped idempotency ledger.
create table public.sync_receipts (
  organization_id uuid not null references public.organizations(id),
  mutation_id uuid not null,
  actor_id uuid not null references auth.users(id),
  device_id uuid not null,
  entity_type text not null check (entity_type in ('beneficiary', 'attendance_day')),
  entity_id text not null,
  payload_hash text not null,
  result_version bigint,
  accepted_at timestamptz not null default now(),
  primary key (organization_id, mutation_id)
);

-- Daily rows make one child/date the concurrency boundary.
create table public.daycare_attendance_days (
  organization_id uuid not null references public.organizations(id),
  attendance_day_id uuid not null,
  beneficiary_id text not null references public.beneficiaries(beneficiary_id),
  attendance_date date not null,
  code text check (code in ('P', 'A', 'H', 'NA')),
  row_version bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  primary key (organization_id, attendance_day_id),
  unique (organization_id, beneficiary_id, attendance_date)
);

-- A per-organization transactional cursor; lock/increment it in the same
-- transaction as each accepted entity change and feed row.
create table public.organization_sync_cursors (
  organization_id uuid primary key references public.organizations(id),
  last_change_id bigint not null default 0
);

create table public.sync_changes (
  organization_id uuid not null references public.organizations(id),
  change_id bigint not null,
  entity_type text not null check (entity_type in ('beneficiary', 'attendance_day')),
  entity_id text not null,
  row_version bigint not null,
  changed_at timestamptz not null default now(),
  primary key (organization_id, change_id)
);

-- Before any GRANT: enable RLS, revoke direct anon access, and add policies
-- that require auth.uid() to have active membership in organization_id.
-- A server RPC must verify membership and the requested organization itself.
-- Receipt + entity mutation + cursor/feed event must be one transaction.
-- Same mutation_id + same payload_hash returns its receipt; a different hash
-- for an existing mutation_id is an integrity error, never a second write.
```

**Important constraint:** a child/date unique key across organizations requires every referenced beneficiary to be associated with that same organization. The current beneficiary table lacks that column. Add it only after a documented tenant plan; do not rely on client-supplied org IDs alone.

## Offline authentication, session and local unlock

| Stage | Online behavior | Offline behavior / required guard |
|---|---|---|
| First visit / sign-in | Require internet and complete Google OAuth with Supabase. `proxy.ts` and callback make server-side `getUser()` calls. Email/password routes are also online and remain optional. | No first sign-in offline. Show a clear “Connect once to sign in and prepare this device” message. |
| Authorization | On server, validate Supabase user ID, active approved-user/org membership, and allowed POC role. The present email-syntax helper is insufficient. | Cache only the minimum approved local profile after successful online authorization. Do not treat a browser Google account chooser as application authorization. |
| Device setup | After first successful online auth, enroll a random device ID and ask the user to set a local unlock method (PIN/passphrase). | Unlock allows access only to this device’s saved POC data. It is not a Google password and does not refresh or prove a Supabase session. Keep key material in memory where possible; never store a raw PIN/password. IndexedDB is not encrypted by Dexie automatically. If data-at-rest encryption is required, agree a Web Crypto key derivation/rotation/recovery plan before implementation. |
| Returning offline | Online sign-in refreshes cookies via Supabase SSR. | Service worker serves shell, local data opens after unlock. No Supabase calls are required for reading local records or saving new local work. Do not cache server-rendered private HTML/RSC as an auth bypass. |
| Sync | Before upload/download, revalidate online Supabase session, user, active membership and device authorization. | If session expired, revoked, or membership changed, pause sync and keep records locally locked/pending. No online authorization means no sync. |
| Logout / account switch | Online logout asks Supabase to revoke/clear local session cookies. | Local lock clears in-memory key. Pending records stay bound to their original user+org and must not be shown to another account. Require sync or an explicit safe handoff/export policy before account switch. Server revocation waits until connectivity returns. |
| Offline access expiry | Decide a maximum offline window and device-loss procedure. | An offline browser cannot learn that an account was revoked while disconnected. At expiry, lock local data and require online revalidation; do not delete unsynced data automatically. The expiry duration is a product/security decision, not inferred here. |

Service workers should cache only the app shell/static build assets and explicit non-sensitive public resources. Do not cache auth endpoints, API responses, server actions, HTML/RSC responses containing beneficiary data, OAuth redirects, or Supabase tokens. Use a versioned cache and an offline fallback route. On an incompatible app/DB version, stop writes and preserve the outbox until an upgrade migration is available; never clear IndexedDB to recover an upgrade.

## Proposed implementation sequence (future PRs; none created in this Stage 1 PR)

| PR | Scope | Acceptance / test before next PR |
|---|---|---|
| 1. Access model and pilot data approval | Confirm organization/tenant, approved users, admin, offline fields, device ownership and retention. Add server-side membership checks and replace broad anon test access only after review. | Anonymous read/write denied; approved user can access only own org; unauthenticated or non-member OAuth cannot reach pages/actions/API; admin remains server-only. Use dummy data. |
| 2. Offline shell and worker | Add worker registration, static shell/fallback, explicit cache allowlist, build/schema version handling. | With network disabled after a successful load, shell and hashed JS/CSS load; auth/API/HTML/RSC responses are absent from Cache Storage; update worker does not delete old pending database. |
| 3. Dexie schema and bootstrap | Add Dexie dependency; initial DB/version; user/org partition; online authorized bootstrap of allowed beneficiary fields and cursor. | Schema upgrade preserves records/outbox; empty DB bootstrap; pagination/restart; wrong org bootstrap rejected; clear storage produces clear recovery messaging. |
| 4. Offline beneficiary creation | Local validation, B-UUID, local row + outbox transaction, online sync endpoint and receipt. | Add while offline; close/reopen; retry after dropped response; replay same mutation; same ID/different payload rejected; source row allocated once server-side. |
| 5. Daily attendance and server model | Resolve duplicate monthly groups; add daily table/row versions/unique child-date key; daily offline editor; parent-first queue. | One child/date accepted once; second device same value idempotent; divergent concurrent values create review; invalid child reference blocked; no month-wide overwrite. |
| 6. Download deltas and review UI | Transactional org cursor/change feed; pull and merge; status/review screen. | Reconnect download, out-of-order pages, repeated pull, duplicate candidate review, explicit conflict resolution and status counters. |
| 7. Offline unlock and lifecycle | Local unlock policy, expiry, account binding, lock/logout, browser/device loss and key decisions. | Google first login online; reopen offline unlock; expiry/revocation pauses sync; account switch cannot expose other account’s pending data; local logout locks data. |
| 8. Pilot hardening | Offline/online regression, accessibility, quota and performance, threat review, release checklist. | Complete checklist below on test data and supported browsers; security review sign-off before real beneficiary data. |

Dashboards, assessments, hospital sessions, charts and exports remain online-only throughout the POC. Their current pages/RPCs are not included in the offline cache or sync queue.

## Test plan mapped to the project brief

| Brief checklist scenario | Planned test / expected result |
|---|---|
| First login | With internet, Google OAuth completes; approved-user and org membership validated; offline data subset bootstraps. New device cannot sign in offline. |
| Offline after setup | Turn off network, load the cached shell, unlock, view local beneficiary and save new beneficiary + attendance. Show local-only state. |
| Close/reopen browser | Pending records survive browser close/reopen and device restart; no duplicate created. |
| Drop network mid-sync | Server-committed rows have a receipt; uncommitted rows retry with same mutation ID; accepted rows not duplicated. |
| Replay request | Re-send identical mutation repeatedly; exactly one server entity change and one receipt. Same ID/different payload rejected. |
| Large backlog | Seed a large test backlog; batch, progress, retry and UI remain responsive; interruption resumes from durable outbox. Set explicit target backlog once pilot scale is confirmed. |
| Two devices / concurrent edits | Same child/date, same code → idempotent; different code and same base version → review, neither silently lost. |
| Duplicate child registration | Two devices create likely same child with different IDs; keep both pending/accepted only per policy and create possible-duplicate review; never auto-merge. |
| Account switching with pending items | Pending user A records cannot appear in user B's local view or sync as B; switch blocked or explicit handoff needed. |
| Multiple tabs | Two tabs do not race the same outbox item; use transaction/lease and browser coordination; duplicate sync remains safe due server receipt. |
| Version upgrade while offline | New worker/Dexie version preserves and migrates local data and outbox; incompatible upgrade blocks safely without data deletion. |
| Login expiry | Expired session allows local unlock only within approved offline window; sync waits for online re-auth. |
| Revoke user / org membership | After reconnect, revoked user cannot sync/download; pending data stays locked and recoverable under approved admin process. Offline revocation cannot be instantaneous; test that limitation. |
| Clear browser storage | User sees that unsynced data cannot be recovered from server; synced bootstrap can be downloaded again after login. Do not promise recovery of unsynced data. |
| Cross-organization access | User A cannot download, write, or infer org B rows by changing request org/entity IDs; enforce RLS/RPC checks and test direct API calls. |
| Attendance duplicates | Use aggregate-identified duplicate groups only after approved data reconciliation; unique daily key rejects duplicate key; legacy duplicate monthly groups are preserved/reviewed, never automatically collapsed. |
| Weak/absent connectivity | Offline indicator reacts to request failure, not only `navigator.onLine`; retries are bounded in rate and visible. |
| Data freshness | Show last successful pull and unsynced count; stale data is labeled. |
| POC scope boundary | Dashboards, assessments, hospital sessions, and exports show online-required state; no private response is served from worker cache. |

Current code tree contains no `tests/` directory even though `package.json` has a `test` script pointing to `tests/*.test.ts`. The future PRs need meaningful unit, browser integration, database/RLS, and multi-device tests; this audit did not run the test/build scripts.

## Unknowns, risks, and questions (ranked by blocker)

### P0 — resolve before implementation or any real-data offline test

1. **Organization boundary:** What is the authoritative Goalkeep/HFH organization ID and membership source? Should a user belong to one or multiple organizations? The current schema has no tenant table/key; cross-organization isolation cannot be guessed.
2. **Data authorization:** Is the populated Happy Feet test project approved to hold the listed test data for offline-device tests? Who can approve which beneficiary fields may be copied into IndexedDB, and on what devices?
3. **Existing duplicates:** Who can review the 10 duplicate monthly attendance groups and decide which legacy row is valid? Do not add the absent child/month/FY unique constraint or backfill until resolved.
4. **Offline revocation window:** How long may a device be used offline after the last successful online sign-in? What happens to a device reported lost, and who can authorize local wipe/recovery? A disconnected device cannot receive revocation immediately.
5. **Auth allowlist:** Is access restricted to `@goalkeep.net`, an explicit user list, or organization membership? The current application helper validates syntax only; the Google provider’s project-side signup restrictions were not inspected.

### P1 — decide before sync/schema PRs

6. **Attendance meaning:** Is one daily value always P/A/H/NA, with blank as “not recorded”? Is attendance correction allowed after sync, and who resolves concurrent changes?
7. **Daily/legacy relationship:** Should new daily rows eventually replace the wide monthly table, or should a compatibility view/materialization feed existing dashboards? POC leaves dashboards online but this affects long-term migration.
8. **Possible duplicate rule:** Which fields may be compared to flag candidate duplicate beneficiaries? Phone and DOB are personal data; name alone is not a safe merge key. Who reviews/merges? 
9. **Offline fields:** Which beneficiary form fields must be mandatory offline, and which can be omitted to minimize local sensitive data?
10. **Offline unlock:** PIN vs passphrase, minimum strength, device sharing, key recovery, and whether local encryption at rest is required. Dexie itself does not encrypt browser storage.
11. **Pilot browser/device support:** Which browser versions and operating systems are required, including private browsing/storage limits? Background Sync is not available everywhere; foreground reconnect sync is the baseline.
12. **Service-worker install model:** The agreed approach has no mandatory app install. Confirm that “offline” means the user has opened the site online at least once in a supported browser so the worker can install/cache its shell.

## Not checked / limits of this audit

- No production Supabase project was queried. Only the named Happy Feet test project was inspected.
- Supabase Auth/provider/signup settings, Google Cloud OAuth client settings, Vercel environment variables/deployment history, GitHub branch protection, and actual user membership settings were not inspected.
- No Supabase record contents were queried; database checks were table/schema/policy/function metadata and aggregate counts only.
- No Dexie or service-worker implementation exists to test yet; browser offline behavior, quota, encryption, and Background Sync support remain implementation tests.
- No build, lint, typecheck, or app test command was run. The audit found no checked-in `tests/` directory.
- The schema sketch is a design aid, not an applied or reviewed migration. Organization FKs/RLS, RPC security mode, legacy backfill and retention need the P0 decisions above.
