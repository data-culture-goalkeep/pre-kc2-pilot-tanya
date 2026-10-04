"use server";

import { randomInt } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { ATTENDANCE_PROGRAMS, MONTHS, type DaycareFilters } from "@/lib/daycare";
import { getDaycareRecords } from "@/lib/queries/daycare";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const SOURCE_FILE = "Happy Feet Dashboard";
const SOURCE_SHEET = "Manual Entry";
const MONTH_DAYS: Record<string, number> = { January: 31, February: 28, March: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31 };

export async function saveDaycareAttendance(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const beneficiaryId = String(formData.get("beneficiary_id") ?? "").trim().slice(0, 100);
  const month = String(formData.get("month") ?? "");
  const financialYear = String(formData.get("financial_year") ?? "").trim().slice(0, 20);
  if (!beneficiaryId || !MONTHS.includes(month as typeof MONTHS[number]) || !/^\d{4}-\d{2}$/.test(financialYear)) return { ok: false, error: "Enter a beneficiary ID, month, and financial year." };
  const record: Record<string, unknown> = { beneficiary_id: beneficiaryId, month, financial_year: financialYear, source_file: SOURCE_FILE, source_sheet: SOURCE_SHEET };
  let present = 0;
  const maxDay = MONTH_DAYS[month] + Number(month === "February" && Number(financialYear.slice(0,4)) % 4 === 0);
  for (let day = 1; day <= 31; day++) {
    const code = String(formData.get(`day_${String(day).padStart(2, "0")}`) ?? "");
    if (day > maxDay || !code) continue;
    if (code !== "P" && code !== "NA") return { ok: false, error: "Attendance entries must be P or NA." };
    record[`day_${String(day).padStart(2, "0")}`] = code;
    if (code === "P") present++;
  }
  if (!Object.keys(record).some((key) => key.startsWith("day_"))) return { ok: false, error: "Mark at least one attendance day." };
  record.total_present = present;
  const client = createServerSupabaseClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const sourceRow = randomInt(1, 2_147_483_647);
    const insert = { ...record, source_row: sourceRow } as unknown as Database["public"]["Tables"]["daycare_attendance"]["Insert"];
    const { error } = await client.from("daycare_attendance").insert(insert);
    if (!error) { updateTag("daycare-attendance"); revalidatePath("/attendance"); return { ok: true }; }
    if (error.code === "23505" && error.message.includes("daycare_attendance_source_row_uq")) continue;
    if (error.code === "23503") return { ok: false, error: "That beneficiary ID was not found. Use an existing beneficiary ID." };
    if (error.code === "42501") return { ok: false, error: "Saving is blocked. Apply the Daycare Attendance test migration first." };
    return { ok: false, error: "Could not save attendance. Check the connection and try again." };
  }
  return { ok: false, error: "Another entry used the same reference. Please try again." };
}

export async function loadDaycareRecords(filters: Record<string, string>, search: string, page: number) {
  const allowed: DaycareFilters = { month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month : "", program: ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number]) ? filters.program : "", beneficiary: (filters.beneficiary ?? "").slice(0, 100) };
  return getDaycareRecords(allowed, search.slice(0, 100), Math.max(1, page));
}
