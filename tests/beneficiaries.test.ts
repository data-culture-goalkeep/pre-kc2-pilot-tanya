import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { BENEFICIARY_COLUMNS, DATABASE_BATCH_SIZE, filterBeneficiaries, MANUAL_ENTRY, MAX_SOURCE_ROW_ATTEMPTS, type Beneficiary } from "../src/lib/beneficiaries";
import { insertBeneficiary, readAllBeneficiaries } from "../src/lib/beneficiaries-store";
import { csvCell, toCsv } from "../src/lib/csv";
import { validateBeneficiary } from "../src/lib/validation/beneficiary";
import type { Database } from "../src/types/database";

const valid = { beneficiary_id: "TEST-001", name_of_child: "Synthetic Child", program: "Daycare", date_of_birth: "2010-01-01", status: "Active", primary_mobile_no: "+91 00000 00000", location: "Test location" };
const input = validateBeneficiary(valid).input;
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
function client(fetcher: typeof fetch) { return createClient<Database>("http://127.0.0.1:54321", "synthetic-test-key", { auth: { persistSession: false }, global: { fetch: fetcher } }); }

test("required fields, enums, impossible and future dates are rejected", () => {
  assert.equal(Object.keys(validateBeneficiary(valid, "2026-10-04").errors).length, 0);
  const missing = validateBeneficiary({}).errors;
  for (const field of ["beneficiary_id", "name_of_child", "program", "status"] as const) assert.ok(missing[field]);
  assert.ok(validateBeneficiary({ ...valid, date_of_birth: "2026-02-30" }).errors.date_of_birth);
  assert.ok(validateBeneficiary({ ...valid, date_of_birth: "2099-01-01" }).errors.date_of_birth);
  assert.ok(validateBeneficiary({ ...valid, primary_mobile_no: "letters" }).errors.primary_mobile_no);
  assert.ok(validateBeneficiary({ ...valid, program: "Other" }).errors.program);
  assert.equal(validateBeneficiary({ ...valid, beneficiary_id: " TEST-001 " }).input.beneficiary_id, "TEST-001");
});

test("filters combine search, program, and status consistently", () => {
  const rows = [{ ...input, primary_mobile_no: null, location: "Mumbai" }, { ...input, beneficiary_id: "TEST-002", program: "Homecare" as const }];
  assert.equal(filterBeneficiaries(rows, { search: " mUmBaI ", program: "Daycare", status: "Active" }).length, 1);
  assert.equal(filterBeneficiaries(rows, { search: "", program: "Homecare", status: "Deceased" }).length, 0);
});

test("CSV includes all columns, handles commas, quotes, newlines, and blocks formulas", () => {
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
  assert.equal(csvCell("=HYPERLINK(1)"), '"\'=HYPERLINK(1)"');
  assert.equal(csvCell(-42), '"-42"');
  assert.equal(csvCell(null), '""');
  assert.equal(toCsv<Beneficiary>([], BENEFICIARY_COLUMNS).split(",").length, BENEFICIARY_COLUMNS.length);
  const row = Object.fromEntries(BENEFICIARY_COLUMNS.map(key => [key, null])) as unknown as Beneficiary;
  row.beneficiary_id = "TEST-CSV"; row.notes = "=SUM(1,2)";
  const csv = toCsv([row], BENEFICIARY_COLUMNS);
  assert.ok(csv.includes('"notes"')); assert.ok(csv.includes("'=SUM(1,2)")); assert.ok(csv.startsWith("\uFEFF"));
});

test("all database pages are read instead of stopping at the API row limit", async () => {
  const offsets: number[] = [];
  const db = client(async (url) => {
    const parsed = new URL(String(url)); const offset = Number(parsed.searchParams.get("offset")); offsets.push(offset);
    return response(Array.from({ length: offset === 0 ? DATABASE_BATCH_SIZE : 1 }, (_, i) => ({ beneficiary_id: `TEST-${offset + i}` })));
  });
  const rows = await readAllBeneficiaries(db);
  assert.equal(rows.length, DATABASE_BATCH_SIZE + 1); assert.deepEqual(offsets, [0, DATABASE_BATCH_SIZE]);
});

test("a denied read is a visible error, never an empty successful result", async () => {
  await assert.rejects(() => readAllBeneficiaries(client(async () => response({ code: "42501", message: "permission denied" }, 403))), /Could not load/);
});

test("manual numbering scopes the max query and retries a unique-key collision", async () => {
  const inserted: Record<string, unknown>[] = []; let reads = 0;
  const db = client(async (url, init) => {
    if (init?.method !== "POST") {
      const params = new URL(String(url)).searchParams;
      assert.equal(params.get("source_file"), "eq.Happy Feet Dashboard");
      assert.equal(params.get("source_sheet"), "eq.Manual Entry");
      reads++; return response([{ source_row: reads === 1 ? 4 : 5 }]);
    }
    inserted.push(JSON.parse(String(init.body)));
    return inserted.length === 1 ? response({ code: "23505", message: 'duplicate key violates unique constraint "beneficiaries_source_row_uq"' }, 409) : response({ beneficiary_id: input.beneficiary_id });
  });
  await insertBeneficiary(db, input);
  assert.deepEqual(inserted.map(row => row.source_row), [5, 6]);
  assert.equal(inserted[1].source_file, MANUAL_ENTRY.source_file); assert.equal(inserted[1].source_sheet, MANUAL_ENTRY.source_sheet);
});

test("first manual row is 1; duplicate beneficiary IDs are not retried", async () => {
  let posts = 0;
  const db = client(async (_url, init) => {
    if (init?.method !== "POST") return response([]);
    posts++; assert.equal(JSON.parse(String(init.body)).source_row, 1);
    return response({ code: "23505", message: 'duplicate key violates unique constraint "beneficiaries_pkey"' }, 409);
  });
  await assert.rejects(() => insertBeneficiary(db, input), /ID already exists/); assert.equal(posts, 1);
});

test("continuous concurrent collisions stop with a recoverable error", async () => {
  let posts = 0;
  const db = client(async (_url, init) => {
    if (init?.method !== "POST") return response([]);
    posts++; return response({ code: "23505", message: 'duplicate key violates unique constraint "beneficiaries_source_row_uq"' }, 409);
  });
  await assert.rejects(() => insertBeneficiary(db, input), /same time/); assert.equal(posts, MAX_SOURCE_ROW_ATTEMPTS);
});
