# Supabase keepalive — simple setup guide

## What this does

Think of this as a robot checking that the database is awake. Twice a day,
GitHub sends one harmless question to Supabase and checks that it gets the
expected answer. It does **not** add, edit or delete records, read beneficiary
information, change tables, or change who can access your data.

Repository: **data-culture-goalkeep/pre-kc2-pilot-tanya**.
Only target: **pre-kc2-happy-feet-test**, ref **ktobhlqfeqdxydppczmm**.
The workflow refuses any other project ref. This authorization applies only to
the read-only check; no source/schema or permissions changes are made.

Schedule: every **12 hours**, at **00:17 and 12:17 UTC** — **05:47 and 17:47 India
time**. There is also a Run workflow button for an immediate manual test.

## Three steps to switch it on

1. Create a small, restricted access token.
   Open [Supabase account tokens](https://supabase.com/dashboard/account/tokens).
   Create a **scoped personal access token**, select **ktobhlqfeqdxydppczmm only**,
   and allow **Database → Read** only. Do not grant write, migrations, project
   management, billing or other-project access. Choose an expiry and note when
   it needs replacing. This token is different from your database password or
   the project's anon/publishable/service-role keys. If scoped tokens are not
   available in your account, stop and ask for an alternative instead of using
   an unrestricted account token.

2. Put the token into GitHub's secure settings.
   In this repository open **Settings → Secrets and variables → Actions →
   New repository secret**. Name it **SUPABASE_KEEPALIVE_TOKEN** and paste the
   token into its Secret box. Do not paste it into chat or any code file.
   [Open repository Actions secrets](https://github.com/data-culture-goalkeep/pre-kc2-pilot-tanya/settings/secrets/actions).
   The connected GitHub tools cannot add/read this secret; an environment secret
   in Codex is not automatically a repository Actions secret.

3. Review/merge the PR, then test once.
   The repository owner must merge it into main; the agent does not merge.
   Go to **Actions → Supabase keepalive → Run workflow**, choose main, and run.
   A green job saying the read-only database check succeeded means the request
   worked. Confirm later runs also appear. Scheduled runs start only once the
   workflow is on main; an open PR alone does not activate it. Configure GitHub
   Actions failure notifications for someone who will respond.

## What has been checked

The project was verified **ACTIVE_HEALTHY** on 16 November 2026, and the harmless
database query returned the expected result through the Supabase connector.
The workflow's syntax and success/failure paths were checked locally with a
mocked request; this did not use a real token or call the network.
A live GitHub run is still unverified until the owner supplies the secret and
merges the workflow. Existing frontend checks and database migrations are untouched.

## Useful limits to know

- This is a **best-effort test**, not a promise that a Free project can never be
  paused. Supabase does not document Management API probes or two checks per day
  as an exemption. A green job proves a query ran; watch Supabase project status
  and inactivity-warning emails over subsequent weeks.
- It cannot wake an already-paused project. Restore this target first if it later
  pauses; do not automatically pause/delete other projects.
- This repository is public. GitHub can disable schedules after 60 days without
  repository activity, and schedules can be delayed/dropped. Check that the
  workflow stays enabled. Account Actions usage limits still apply.
- Missing token fails before connecting. HTTP errors or an unexpected reply fail
  the job. A 401/403 usually needs a token expiry/scope check, not write access.
- The token and API response are not printed. The read-only Management API
  endpoint is Beta; unexpected response changes fail visibly.
- This is not a backup or an availability guarantee. Use a paid plan when client
  access must not depend on Free-plan inactivity rules.
- To stop it, disable the workflow in Actions and revoke its scoped token.
  There is no database change to undo.

## Technical details and references

The workflow POSTs one fixed, read-only query to Supabase's read-only Management
API endpoint. It uses no checkout or third-party action, no GitHub token
permissions, a three-minute timeout, bounded retries, a fixed project guard and
JSON-result validation. It queries only the database catalog, not project data.

- [Supabase pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Scoped tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)
- [Read-only query endpoint](https://supabase.com/docs/reference/api/v1-read-only-query)
- [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
