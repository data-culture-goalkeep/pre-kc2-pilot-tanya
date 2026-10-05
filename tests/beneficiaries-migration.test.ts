import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const SQL_TEST_TIMEOUT_MS = 30000;

test("test migration permits beneficiary reads and manual inserts only", { timeout: SQL_TEST_TIMEOUT_MS }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    const migrations = ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql"];
    for (const filename of migrations) await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,source_file,source_sheet,source_row) values ('SYNTHETIC-SEED','Synthetic Test Child','fixture','synthetic',1)");
    const notNull = await pg.query<{ is_nullable: string }>("select is_nullable from information_schema.columns where table_schema='public' and table_name='beneficiaries' and column_name='source_row'");
    assert.equal(notNull.rows[0].is_nullable, "NO");
    for (const role of ["anon", "authenticated"]) {
      await pg.exec(`set role ${role}`);
      assert.ok((await pg.query("select beneficiary_id from public.beneficiaries")).rows.length);
      await pg.query("insert into public.beneficiaries (beneficiary_id,name_of_child,source_file,source_sheet,source_row) values ($1,$2,$3,$4,$5)", [`TEST-${role}`, "Synthetic Policy Child", "Happy Feet Dashboard", "Manual Entry", role === "anon" ? 1 : 2]);
      for (const sql of [
        "select * from public.daycare_attendance",
        "update public.beneficiaries set name_of_child='Synthetic change'",
        "delete from public.beneficiaries",
        "insert into public.beneficiaries (beneficiary_id,source_file,source_sheet,source_row) values ('BAD-SOURCE','other','other',3)",
      ]) await assert.rejects(() => pg.exec(sql), (error: { code?: string }) => error.code === "42501");
      await assert.rejects(() => pg.exec("insert into public.beneficiaries (beneficiary_id,source_file,source_sheet,source_row) values ('DUPLICATE','Happy Feet Dashboard','Manual Entry',1)"), (error: { code?: string }) => error.code === "23505");
      await pg.exec("reset role");
    }
  } finally { await pg.close(); }
});

test("beneficiary charts and totals are grouped in an RLS-aware database function", { timeout: SQL_TEST_TIMEOUT_MS }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const filename of ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql", "20261004145500_beneficiary_dashboard_aggregates.sql"]) {
      await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    }
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,date_of_birth,status,gender,primary_diagnosis,hospital,source_file,source_sheet,source_row) values ('SYNTHETIC-ACTIVE','Synthetic Active Child','Daycare',current_date - interval '4 years','Active','Female','Synthetic diagnosis','Metro Care Hospital A','test','charts',1)");
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,date_of_birth,status,gender,primary_diagnosis,hospital,source_file,source_sheet,source_row) values ('SEED-CHART-EXIT','Synthetic Exit Child','Homecare',current_date - interval '15 years','Deceased','Female','Synthetic exit diagnosis','Metro Care Hospital B','test','charts',2)");
    const total = await pg.query<{ beneficiary_dashboard_data: { summary: { total_count: number; active_count: number; exited_count: number }; charts: Array<{ chart_name: string; label: string; value: number }> } }>("select public.beneficiary_dashboard_data() as beneficiary_dashboard_data");
    const actual = await pg.query<{ total: number }>("select count(*)::int as total from public.beneficiaries");
    const result = total.rows[0].beneficiary_dashboard_data;
    assert.equal(result.summary.total_count, actual.rows[0].total);
    assert.equal(result.summary.active_count + result.summary.exited_count, actual.rows[0].total);
    const programs = result.charts.filter((row) => row.chart_name === "program");
    assert.ok(programs.some((row) => row.label === "Daycare"));
    const ageGroups = result.charts.filter((row) => row.chart_name === "age_group");
    assert.ok(ageGroups.some((row) => row.label === "1–5"));
    const diagnosisRows = result.charts.filter((row) => row.chart_name === "primary_diagnosis");
    assert.ok(diagnosisRows.length <= 10);
    const filtered = await pg.query<{ beneficiary_dashboard_data: typeof result }>("select public.beneficiary_dashboard_data('Daycare', 'Active', 'female', 'Metro Care Hospital A') as beneficiary_dashboard_data");
    assert.equal(filtered.rows[0].beneficiary_dashboard_data.summary.total_count, 1);

    await pg.exec("set role anon");
    const anonData = await pg.query<{ data: typeof result }>("select public.beneficiary_dashboard_data() as data");
    assert.equal(anonData.rows[0].data.summary.total_count, 2);
    await assert.rejects(() => pg.exec("update public.beneficiaries set name_of_child='Synthetic change'"));
  } finally { await pg.close(); }
});
