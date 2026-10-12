import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migrations = [
  "20261001044732_create_happy_feet_schema.sql",
  "20261004180000_hospital_sessions_dashboard.sql",
  "20261012090000_hospital_financial_year_filter.sql",
];

async function createDatabase() {
  const pg = new PGlite();
  await pg.exec("create role anon; create role authenticated; create role service_role;");
  for (const filename of migrations) await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
  return pg;
}

test("Hospital dashboard keeps hospital children separate and creates the next H-ID", { timeout: 30000 }, async () => {
  const pg = await createDatabase();
  try {
    const id = await pg.query<{ id: string }>("select public.insert_hospital_session_entry(null,'Synthetic Hospital Child',1,2,jsonb_build_object('session_date',current_date::text,'hospital_name','Metro Care Hospital A')) id");
    assert.equal(id.rows[0].id, "H-0001");
    const result = await pg.query<{ data: { summary: { total_children: number; total_sessions: number }; charts: Array<{ chart_name: string; label: string; value: number }> } }>("select public.hospital_sessions_dashboard_data(null,null) data");
    assert.equal(result.rows[0].data.summary.total_children, 1);
    assert.equal(result.rows[0].data.summary.total_sessions, 1);
    assert.ok(result.rows[0].data.charts.some((row) => row.chart_name === "hospital" && row.label === "Metro Care Hospital A"));
    await pg.exec("set role anon");
    await assert.rejects(() => pg.exec("update public.hospital_children set child_name='bad'"));
  } finally { await pg.close(); }
});

test("Hospital financial year filter uses April-to-March boundaries and fiscal month order", { timeout: 30000 }, async () => {
  const pg = await createDatabase();
  try {
    const id = await pg.query<{ id: string }>("select public.insert_hospital_session_entry(null,'Synthetic FY Child',1,2,jsonb_build_object('session_date','2025-04-01','hospital_name','Metro Care Hospital A')) id");
    for (const [date, sourceRow] of [["2026-03-31", 3], ["2026-04-01", 4]] as const) {
      await pg.query("select public.insert_hospital_session_entry($1,null,1,$2,$3::jsonb)", [
        id.rows[0].id, sourceRow,
        JSON.stringify({ session_date: date, hospital_name: "Metro Care Hospital A" }),
      ]);
    }
    const result = await pg.query<{
      data: { summary: { total_sessions: number }; charts: Array<{ chart_name: string; label: string }>; financial_years: string[] }
    }>("select public.hospital_sessions_dashboard_data(null,null,'2025-26') data");
    assert.equal(result.rows[0].data.summary.total_sessions, 2);
    assert.deepEqual(result.rows[0].data.charts.filter((row) => row.chart_name === "monthly").map((row) => row.label), ["April", "March"]);
    assert.ok(result.rows[0].data.financial_years.includes("2025-26"));
    const records = await pg.query<{ financial_year: string }>("select financial_year from public.hospital_sessions_records where hospital_child_id=$1 order by session_date", [id.rows[0].id]);
    assert.deepEqual(records.rows.map((row) => row.financial_year), ["2025-26", "2025-26", "2026-27"]);
    const overloads = await pg.query<{ count: number }>("select count(*)::int as count from pg_proc where proname='hospital_sessions_dashboard_data'");
    assert.equal(overloads.rows[0].count, 1);
  } finally { await pg.close(); }
});
