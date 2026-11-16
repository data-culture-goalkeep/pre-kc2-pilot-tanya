# Supabase keepalive — project API method

## In simple words

Twice a day GitHub reads a tiny test table in Supabase. The table holds only
the number **1**, not anyone's name or personal information. If GitHub gets that
number back, the check is green. If it cannot, the check is red.

This replaces the earlier Management API/PAT approach. It now uses this project's
own Data API, like a website reading data, with a **publishable key** (or legacy
anon key). A personal access token is no longer needed.

Only project: **pre-kc2-happy-feet-test**, ref **ktobhlqfeqdxydppczmm**.
Schedule: **every 12 hours**, 00:17/12:17 UTC — 05:47/17:47 India time.
It never targets the other HFH project. The owner must merge the PR; the agent
does not merge or enable automatic merge.

## What has already been applied

Migration **20261116092439_create_keepalive.sql** was applied to this project
using Supabase's migration mechanism. It creates **public.keepalive** with one
dummy row, id=1, and row-level security enabled. Anonymous clients can SELECT
this helper only; they cannot insert, update or delete it. The authenticated
role gets no grant on this helper. There are no functions or broad schema grants.

Existing access to the eight original public tables was not changed. Before/
after row counts and full-row hashes, existing policy hashes and grant hashes
matched. This is a narrowly approved public-read exception for a non-sensitive
helper, not authorization to expose beneficiaries or other source tables.
No old migration was edited. Do not manually reapply this migration after it
has been recorded.

## Finish setup — three steps

1. In the Supabase project open **Settings → API Keys** (the label may appear
   under Project Settings). Copy the **publishable key**, beginning
   sb_publishable_. The legacy **anon** key also works; never use service_role,
   a secret key, a personal access token or a database password.
2. In this GitHub repository open **Settings → Secrets and variables → Actions →
   New repository secret**. Name it **SUPABASE_PUBLISHABLE_KEY** and paste the
   key in its Secret field. Never paste it into chat or a committed file.
   [Open Actions secrets](https://github.com/data-culture-goalkeep/pre-kc2-pilot-tanya/settings/secrets/actions).
   The earlier SUPABASE_KEEPALIVE_TOKEN secret is no longer read. If you created
   a personal access token solely for that discarded approach, revoke that
   dedicated token; do not revoke a token used elsewhere.
3. Review/merge PR #17. Then open **Actions → Supabase keepalive → Run workflow**,
   select main and run it. Confirm the job says Project Data API heartbeat
   succeeded. The schedule starts only when this workflow is on main. Check the
   later scheduled runs too, and enable failure notifications for an owner.

The GitHub connector cannot add repository secrets, merge on the owner's behalf
under repository rules, or start a new workflow run. Those activation steps are
still for the owner; an open PR alone is not a running keepalive.

## Verification and limits

- YAML/Bash syntax and seven mocked request cases passed: expected row, empty
  rows, wrong id, malformed JSON, HTTP failure, missing key and wrong project.
- The migration passed isolated PostgreSQL/PGlite tests: anon SELECT returns
  the single row, anon writes are rejected, authenticated SELECT is rejected,
  RLS stays on and id=2 violates the singleton constraint.
- Live SQL verification confirmed id=1, RLS on, one SELECT policy, anon read
  only and no authenticated table access. Original records/policies/grants
  were unchanged.
- A real HTTPS GET was attempted, but this Codex worker's outbound proxy denied
  the project hostname (tunnel 403) before reaching Supabase. Therefore a live
  project REST read and an end-to-end GitHub Actions run are **not yet verified**.
  This is an environment-network blocker, not evidence of invalid Supabase
  permissions. The first manual GitHub run above is the next live test.
- Missing keys fail before a network request. HTTP errors and a wrong response
  fail visibly. Only the apikey header is used: modern publishable keys are
  not JWTs and must not be placed in Authorization: Bearer.
- The job has no GitHub token permissions, no checkout/third-party action, a
  fixed-project guard, a three-minute timeout, bounded retries and response
  validation. It sends GET /rest/v1/keepalive?select=id&id=eq.1&limit=1.
  It does not write per-run timestamps or print keys/responses.
- On 401/403, check the public key and narrowly scoped helper permissions; on
  404, check Data API exposure of public and the heartbeat table/schema cache.
  Never fix a heartbeat error by granting access to all beneficiary tables.
- This direct project-API read is a more representative activity test than the
  former administrative probe, but **two checks per day are not a guaranteed
  exemption from Supabase Free-plan pausing**. Watch the project status and
  inactivity emails across subsequent weeks. For guaranteed protection from
  inactivity pausing, use an appropriate paid plan.
- The project must be active; this GET cannot restore a paused project. Public
  GitHub repository schedules can be disabled after 60 days without repository
  activity, and scheduled jobs may be delayed/dropped. Monitor failures.
- This is not a backup or an availability guarantee. To stop it, disable the
  workflow; the harmless helper can remain. Any later removal belongs in a
  new, separately authorized migration.

## References

- [Supabase pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Explicit API grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [GitHub scheduling](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
