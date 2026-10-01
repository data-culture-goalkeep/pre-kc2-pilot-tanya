# Repository guidance

- Keep work on feature branches. Never push directly to `main`; open a pull request for the repository owner to review and squash merge.
- Keep secrets out of the repository. Use environment variables; `.env.example` must contain placeholder values only.
- The Supabase project is the Phase 1 test project. Database schema changes belong in timestamped SQL files under `supabase/migrations/`.
- Do not add client-access policies until the access model is approved. RLS is enabled and client access is blocked in the current Phase 1 schema.
- Preserve source values and provenance. Source-backed tables require `source_file`, `source_sheet`, and `source_row`.
- The pilot's rerun key is source row reference. If source rows are sorted or inserted, use a full clean reload; do not treat row references as durable business IDs.
- Hospital children are a distinct population, keyed by exact child name in this pilot. Do not join them to beneficiaries. Live projects should capture a child ID.
- Rosenberg answer values are a straight conversion only. Do not reverse-score or recalculate the source total until the NGO confirms the scoring key.
- Seed fixtures must be clearly synthetic and must not contain real beneficiary data.
