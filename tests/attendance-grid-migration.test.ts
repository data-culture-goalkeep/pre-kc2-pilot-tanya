import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("attendance grid migration supports synthetic P/A/H/NA data, missing rows, safe provenance, and the new denominator", { timeout: 30000 }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const filename of ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql", "20261004170000_daycare_attendance_dashboard.sql", "20261005100000_attendance_grid_assessment_picker.sql"]) {
      await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    }
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,source_file,source_sheet,source_row) values ('SYNTH-GRID-1','Synthetic One','Daycare','fixture','fixture',1),('SYNTH-GRID-2','Synthetic Two','Daycare','fixture','fixture',2)");
    await pg.exec("insert into public.daycare_attendance (beneficiary_id,name_of_child,month,financial_year,day_01,day_02,day_03,day_04,source_file,source_sheet,source_row) values ('SYNTH-GRID-1','Synthetic One','January','2024-25','P','A','H','NA','original.csv','source tab',11)");
    const grid = await pg.query<{ data: { rows: Array<{ beneficiary_id: string; duplicate_count: number; day_01: string | null }> } }>("select public.daycare_attendance_grid_data('January','2024-25','Daycare') as data");
    assert.equal(grid.rows[0].data.rows.length, 2);
    assert.equal(grid.rows[0].data.rows.find((row) => row.beneficiary_id === "SYNTH-GRID-2")?.day_01, null);
    const values = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`day_${String(i + 1).padStart(2, "0")}`, i < 4 ? ["P", "A", "H", "NA"][i] : null]));
    await pg.query("select public.save_daycare_attendance_grid('January','2024-25','Daycare',$1::jsonb)", [JSON.stringify([{ beneficiary_id: "SYNTH-GRID-2", source_row: 21, ...values, total_present: 1 }])]);
    await pg.query("select public.save_daycare_attendance_grid('January','2024-25','Daycare',$1::jsonb)", [JSON.stringify([{ beneficiary_id: "SYNTH-GRID-1", source_row: 22, ...values, total_present: 1 }])]);
    const stored = await pg.query<{ source_file: string; source_sheet: string; source_row: number; day_01: string; day_02: string }>("select source_file,source_sheet,source_row,day_01::text,day_02::text from public.daycare_attendance where beneficiary_id='SYNTH-GRID-1'");
    assert.deepEqual(stored.rows[0], { source_file: "original.csv", source_sheet: "source tab", source_row: 11, day_01: "P", day_02: "A" });
    const inserted = await pg.query<{ source_file: string; source_sheet: string; source_row: number }>("select source_file,source_sheet,source_row from public.daycare_attendance where beneficiary_id='SYNTH-GRID-2'");
    assert.deepEqual(inserted.rows[0], { source_file: "Happy Feet Dashboard", source_sheet: "Manual Entry", source_row: 21 });
    const analytics = await pg.query<{ data: { summary: { average_attendance_percent: number } } }>("select public.daycare_attendance_dashboard_data('January','Daycare',null,'2024-25') as data");
    assert.equal(Number(analytics.rows[0].data.summary.average_attendance_percent), 3.4);
    const unique = await pg.query<{ count: number }>("select count(*)::int as count from pg_constraint where conname='daycare_attendance_beneficiary_month_fy_uq'");
    assert.equal(unique.rows[0].count, 1);
  } finally { await pg.close(); }
});

test("attendance migration leaves duplicate keys intact and skips the composite unique constraint", { timeout: 30000 }, async () => {
  const pg = new PGlite();
  try {
    await pg.exec("create role anon; create role authenticated; create role service_role;");
    for (const filename of ["20261001044732_create_happy_feet_schema.sql", "20261001060420_add_name_of_child_to_daycare_attendance.sql", "20261004132727_beneficiaries_test_access.sql", "20261004170000_daycare_attendance_dashboard.sql"]) await pg.exec(await readFile(`supabase/migrations/${filename}`, "utf8"));
    await pg.exec("insert into public.beneficiaries (beneficiary_id,name_of_child,program,source_file,source_sheet,source_row) values ('SYNTH-DUP','Synthetic Duplicate','Daycare','fixture','fixture',1)");
    await pg.exec("insert into public.daycare_attendance (beneficiary_id,month,financial_year,source_file,source_sheet,source_row) values ('SYNTH-DUP','January','2024-25','fixture','one',1),('SYNTH-DUP','January','2024-25','fixture','two',2)");
    await pg.exec(await readFile("supabase/migrations/20261005100000_attendance_grid_assessment_picker.sql", "utf8"));
    const duplicates = await pg.query<{ count: number }>("select count(*)::int as count from public.daycare_attendance where beneficiary_id='SYNTH-DUP'");
    const unique = await pg.query<{ count: number }>("select count(*)::int as count from pg_constraint where conname='daycare_attendance_beneficiary_month_fy_uq'");
    assert.equal(duplicates.rows[0].count, 2);
    assert.equal(unique.rows[0].count, 0);
    const grid = await pg.query<{ data: { rows: Array<{ beneficiary_id: string; duplicate_count: number }> } }>("select public.daycare_attendance_grid_data('January','2024-25','Daycare') as data");
    assert.equal(grid.rows[0].data.rows[0].duplicate_count, 2);
  } finally { await pg.close(); }
});
