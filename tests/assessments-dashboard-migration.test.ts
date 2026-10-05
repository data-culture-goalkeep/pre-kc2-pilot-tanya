import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Assessments migration reports synthetic response distributions without changing totals", { timeout: 30000 }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const file of ["20261001044732_create_happy_feet_schema.sql", "20261004132727_beneficiaries_test_access.sql", "20261004190000_assessments_dashboard.sql"]) {
      await pg.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    }
    await pg.exec(`
      insert into public.beneficiaries(beneficiary_id,name_of_child,source_file,source_sheet,source_row)
      values('SYNTHETIC-ASSESSMENT','Synthetic Assessment Child','Happy Feet Dashboard','Manual Entry',1);
      insert into public.stirling_assessment_history(beneficiary_id,name_of_child,test_type,assessment_date,q1,source_file,source_sheet,source_row,source_total_score)
      values('SYNTHETIC-ASSESSMENT','Synthetic Assessment Child','Pre',date '2026-01-10',3,'Happy Feet Dashboard','Manual Entry',2,12),
            ('SYNTHETIC-ASSESSMENT','Synthetic Assessment Child','Post',date '2026-01-12',4,'Happy Feet Dashboard','Manual Entry',3,14);
      insert into public.rosenberg_assessment_history(beneficiary_id,name_of_child,assessment_date,q1_raw,source_total_score,source_file,source_sheet,source_row)
      values('SYNTHETIC-ASSESSMENT','Synthetic Assessment Child',date '2026-01-10','SA',12,'Happy Feet Dashboard','Manual Entry',4);
    `);
    type Result = { data: { summary: { assessments_recorded: number; children_assessed: number; pre_post_pairs: number }; charts: Array<{ chart_name: string; label: string; series: string; detail: string; value: number }> } };
    const result = await pg.query<Result>("select public.assessments_dashboard_data(null,null,null) data");
    assert.deepEqual(result.rows[0].data.summary, { assessments_recorded: 3, children_assessed: 1, pre_post_pairs: 1 });
    assert.ok(result.rows[0].data.charts.some(row => row.chart_name === "Rosenberg" && row.label === "q1" && row.detail === "SA" && Number(row.value) === 1));
    assert.ok(result.rows[0].data.charts.some(row => row.chart_name === "Stirling" && row.label === "Score 3" && row.series === "Pre"));
    const total = await pg.query<{ value: number }>("select source_total_score value from public.rosenberg_assessment_history");
    assert.equal(total.rows[0].value, 12);
    await pg.exec("set role anon");
    await assert.rejects(() => pg.exec("update public.stirling_assessment_history set q1=1"));
  } finally { await pg.close(); }
});
