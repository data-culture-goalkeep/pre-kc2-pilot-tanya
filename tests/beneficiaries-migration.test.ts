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
    await pg.exec(await readFile("supabase/seed.sql", "utf8"));
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

test("beneficiary charts and totals are grouped in RLS-aware database views", { timeout: SQL_TEST_TIMEOUT_MS }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const filename of ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql", "20261004145500_beneficiary_dashboard_aggregates.sql"]) {
      await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    }
    await pg.exec(await readFile("supabase/seed.sql", "utf8"));
    await pg.exec("update public.beneficiaries set date_of_birth=current_date - interval '4 years', status='Active', gender='Female', hospital='Metro Care Hospital A'");
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,date_of_birth,status,gender,primary_diagnosis,hospital,source_file,source_sheet,source_row) values ('SEED-CHART-EXIT','Synthetic Exit Child','Homecare',current_date - interval '15 years','Deceased','Female','Synthetic exit diagnosis','Metro Care Hospital B','test','charts',1)");
    const total = await pg.query<{ total_count: number; active_count: number; exited_count: number }>("select * from public.beneficiary_dashboard_summary");
    const actual = await pg.query<{ total: number }>("select count(*)::int as total from public.beneficiaries");
    assert.equal(total.rows[0].total_count, actual.rows[0].total);
    assert.equal(total.rows[0].active_count + total.rows[0].exited_count, actual.rows[0].total);
    const programs = await pg.query<{ label: string; value: string }>("select label, value::text as value from public.beneficiary_dashboard_chart_data where chart_name='program'");
    assert.ok(programs.rows.some((row) => row.label === "Daycare"));
    const ageGroups = await pg.query<{ label: string }>("select label from public.beneficiary_dashboard_chart_data where chart_name='age_group'");
    assert.ok(ageGroups.rows.some((row) => row.label === "1–5"));
    const diagnosisRows = await pg.query("select * from public.beneficiary_dashboard_chart_data where chart_name='primary_diagnosis'");
    assert.ok(diagnosisRows.rows.length <= 10);

    await pg.exec("set role anon");
    assert.ok((await pg.query("select * from public.beneficiary_dashboard_summary")).rows.length === 1);
    assert.ok((await pg.query("select * from public.beneficiary_dashboard_chart_data")).rows.length > 0);
    await assert.rejects(() => pg.exec("update public.beneficiary_dashboard_chart_data set value=0"));
  } finally { await pg.close(); }
});
