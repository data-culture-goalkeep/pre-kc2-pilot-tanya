import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DATABASE_BATCH_SIZE, MANUAL_ENTRY, MAX_POSTGRES_INTEGER, MAX_SOURCE_ROW_ATTEMPTS, SOURCE_ROW_CONSTRAINT, type Beneficiary } from "@/lib/beneficiaries";
import type { BeneficiaryInput } from "@/lib/validation/beneficiary";

export async function readAllBeneficiaries(client: SupabaseClient<Database>): Promise<Beneficiary[]> {
  const rows: Beneficiary[] = [];
  for (let offset = 0; ; offset += DATABASE_BATCH_SIZE) {
    const { data, error } = await client.from("beneficiaries").select("*").order("beneficiary_id").range(offset, offset + DATABASE_BATCH_SIZE - 1);
    if (error) throw new Error("Could not load beneficiaries. Confirm the test migration is applied and the Supabase connection is available.");
    if (!data) throw new Error("Supabase returned no beneficiary response. Please try again.");
    rows.push(...data);
    if (data.length < DATABASE_BATCH_SIZE) return rows;
  }
}

export async function insertBeneficiary(client: SupabaseClient<Database>, input: BeneficiaryInput): Promise<void> {
  for (let attempt = 0; attempt < MAX_SOURCE_ROW_ATTEMPTS; attempt++) {
    const latest = await client.from("beneficiaries").select("source_row").eq("source_file", MANUAL_ENTRY.source_file).eq("source_sheet", MANUAL_ENTRY.source_sheet).order("source_row", { ascending: false }).limit(1);
    if (latest.error || !latest.data) throw new Error("Could not generate an entry reference. Check the beneficiaries read policy and try again.");
    const sourceRow = Math.max(0, latest.data[0]?.source_row ?? 0) + 1;
    if (sourceRow > MAX_POSTGRES_INTEGER) throw new Error("Manual entry numbers have reached the database limit.");
    const { error, data } = await client.from("beneficiaries").insert({ ...input, ...MANUAL_ENTRY, source_row: sourceRow }).select("beneficiary_id").single();
    if (!error && data) return;
    // PostgreSQL makes the unique-key check atomic. Re-read after a competing save.
    if (error?.code === "23505" && error.message.includes(SOURCE_ROW_CONSTRAINT)) continue;
    if (error?.code === "23505") throw new Error("That beneficiary ID already exists. Use a different ID.");
    if (error?.code === "42501") throw new Error("Saving is blocked. Apply the beneficiaries test access migration, then try again.");
    throw new Error("Could not save the entry. Check the connection and try again.");
  }
  throw new Error("Other entries are being saved at the same time. Please try again.");
}
