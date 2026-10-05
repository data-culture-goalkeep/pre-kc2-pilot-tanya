"use server";

import { randomInt } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ATTENDANCE_CODES, ATTENDANCE_PROGRAMS, MONTHS, type DaycareFilters } from "@/lib/daycare";
import type { Database } from "@/types/database";

type Day = `day_${string}`;
const DAY_KEYS = Array.from({ length: 31 }, (_, i) => `day_${String(i + 1).padStart(2, "0")}` as Day);
const fiscalYearOk = (value: string) => /^\d{4}-\d{2}$/.test(value);

export async function saveDaycareAttendanceGrid(filters: DaycareFilters, changes: Array<{ beneficiary_id: string; values: Record<string, string> }>): Promise<{ ok: boolean; error?: string }> {
  if (!MONTHS.includes(filters.month as typeof MONTHS[number]) || !fiscalYearOk(filters.financial_year) || !ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number])) return { ok: false, error: "Choose a valid month, financial year, and program." };
  if (!Array.isArray(changes) || changes.length > 2000) return { ok: false, error: "Too many changed rows to save at once." };
  const seen = new Set<string>();
  const daysInMonth = new Date(Number(filters.financial_year.slice(0, 4)) + (MONTHS.indexOf(filters.month as typeof MONTHS[number]) < 3 ? 1 : 0), MONTHS.indexOf(filters.month as typeof MONTHS[number]) + 1, 0).getDate();
  const rows = changes.map(({ beneficiary_id, values }) => {
    const id = String(beneficiary_id ?? "").trim().slice(0, 100);
    if (!id || seen.has(id)) throw new Error("Each changed beneficiary must appear only once.");
    seen.add(id);
    const row: Record<string, string | number | null> = { beneficiary_id: id, source_row: randomInt(1, 2_147_483_647) };
    let present = 0;
    for (const [index, key] of DAY_KEYS.entries()) {
      const value = index + 1 > daysInMonth ? "" : String(values?.[key] ?? "");
      if (value && !ATTENDANCE_CODES.includes(value as typeof ATTENDANCE_CODES[number])) throw new Error(`Invalid attendance code for day ${index + 1}.`);
      row[key] = value || null;
      if (value === "P") present++;
    }
    row.total_present = present;
    return row;
  });
  if (!rows.length) return { ok: false, error: "No attendance changes to save." };
  try {
    const db = createServerSupabaseClient();
    const { error } = await db.rpc("save_daycare_attendance_grid", {
      p_month: filters.month as Database["public"]["Enums"]["month_enum"], p_financial_year: filters.financial_year,
      p_program: filters.program as Database["public"]["Enums"]["program_enum"], p_rows: rows as never,
    });
    if (error) {
      const duplicate = error.message.toLowerCase().includes("duplicate records");
      return { ok: false, error: duplicate ? "This child has duplicate attendance rows for the selected month. Ask an administrator to reconcile them before saving." : "Could not save attendance. Check the connection and try again." };
    }
    updateTag("daycare-attendance"); revalidatePath("/attendance");
    return { ok: true };
  } catch { return { ok: false, error: "Could not save attendance. Check the connection and try again." }; }
}

// Kept for the chart's + Add form, which enters one new row.
export async function saveDaycareAttendance(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const values: Record<string, string> = {};
  for (const key of DAY_KEYS) values[key] = String(form.get(key) ?? "");
  const result = await saveDaycareAttendanceGrid({
    month: String(form.get("month") ?? ""), financial_year: String(form.get("financial_year") ?? ""),
    program: String(form.get("program") ?? "Daycare"), beneficiary: "",
  }, [{ beneficiary_id: String(form.get("beneficiary_id") ?? ""), values }]);
  return result;
}

export async function loadDaycareRecords(filters: Record<string, string>, search: string, page: number) {
  const { getDaycareRecords } = await import("@/lib/queries/daycare");
  const valid: DaycareFilters = {
    month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month : "",
    financial_year: fiscalYearOk(filters.financial_year ?? "") ? filters.financial_year : "",
    program: ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number]) ? filters.program : "",
    beneficiary: (filters.beneficiary ?? "").slice(0, 100),
  };
  return getDaycareRecords(valid, search.slice(0, 100), Math.max(1, page));
}
