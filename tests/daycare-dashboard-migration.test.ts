import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Daycare migration groups synthetic attendance, quarterly inputs, and output data in Postgres", { timeout: 30000 }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const filename of ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql", "20261004170000_daycare_attendance_dashboard.sql"]) await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,source_file,source_sheet,source_row) values ('SYNTHETIC-DAYCARE','Synthetic Daycare Child','Daycare','test','fixture',1)");
    await pg.exec("insert into public.daycare_attendance (beneficiary_id,month,financial_year,day_01,day_02,source_file,source_sheet,source_row) values ('SYNTHETIC-DAYCARE','January','2026-27','P','NA','test','fixture',1)");
    await pg.exec("insert into public.daycare_quarterly (beneficiary_id,quarter,grocery_support_required_date,grocery_support_provided_date,source_file,source_sheet,source_row) values ('SYNTHETIC-DAYCARE','Q1',current_date,current_date,'test','fixture',1)");
    const result = await pg.query<{ data: { summary: { children_with_data: number }; charts: Array<{ chart_name: string; label: string; value: number; series: string | null }> } }>("select public.daycare_attendance_dashboard_data('January','Daycare','SYNTHETIC-DAYCARE') as data");
    assert.equal(result.rows[0].data.summary.children_with_data, 1);
    assert.ok(result.rows[0].data.charts.some((row) => row.chart_name === "program" && row.label === "Daycare"));
    assert.ok(result.rows[0].data.charts.some((row) => row.chart_name === "quarterly" && row.series === "Inputs" && Number(row.value) === 1));
    assert.ok(result.rows[0].data.charts.some((row) => row.chart_name === "quarterly" && row.series === "Outputs" && Number(row.value) === 1));
    await pg.exec("set role anon");
    assert.ok((await pg.query("select public.daycare_attendance_dashboard_data('January','Daycare','SYNTHETIC-DAYCARE')")).rows.length === 1);
    await assert.rejects(() => pg.exec("update public.daycare_attendance set total_present=0"));
  } finally { await pg.close(); }
});
