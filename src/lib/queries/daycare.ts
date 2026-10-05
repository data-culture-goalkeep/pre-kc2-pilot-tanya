import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DATA_REVALIDATE_SECONDS, TABLE_PAGE_SIZE } from "@/lib/beneficiaries";
import { ATTENDANCE_PROGRAMS, MONTHS, type DaycareFilters } from "@/lib/daycare";
import type { Database } from "@/types/database";

export type DaycareSummary = { average_attendance_percent: number; children_with_data: number; children_below_50: number };
export type DaycareChartRow = { chart_name: string; label: string; value: number; sort_order: number; series: string | null };
export type DaycareData = { summary: DaycareSummary; charts: DaycareChartRow[] };
const TAG = "daycare-attendance";

async function readDaycareData(filters: DaycareFilters): Promise<DaycareData> {
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("daycare_attendance_dashboard_data", {
    p_month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month as Database["public"]["Enums"]["month_enum"] : null,
    p_program: ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number]) ? filters.program as Database["public"]["Enums"]["program_enum"] : null,
    p_beneficiary: filters.beneficiary || null,
    p_financial_year: /^\d{4}-\d{2}$/.test(filters.financial_year) ? filters.financial_year : null,
  });
  if (error || !data) throw new Error("Could not load daycare analytics. Apply the Daycare Attendance migration and verify the test access policy.");
  return data as unknown as DaycareData;
}

const cached = unstable_cache((filters: DaycareFilters) => readDaycareData(filters), ["daycare-dashboard-v1"], { revalidate: DATA_REVALIDATE_SECONDS, tags: [TAG] });
export const getDaycareData = (filters: DaycareFilters) => cached(filters);

export type DaycareGridRow = {
  beneficiary_id: string;
  name_of_child: string | null;
  attendance_id: string | null;
  duplicate_count: number;
} & Record<string, string | number | null>;

export async function getDaycareAttendanceGrid(filters: DaycareFilters): Promise<DaycareGridRow[]> {
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("daycare_attendance_grid_data", {
    p_month: filters.month as Database["public"]["Enums"]["month_enum"],
    p_financial_year: filters.financial_year,
    p_program: filters.program as Database["public"]["Enums"]["program_enum"],
  });
  if (error || !data) throw new Error("Could not load the attendance grid. Review and apply the attendance-grid migration.");
  return (data as unknown as { rows: DaycareGridRow[] }).rows;
}

export async function getDaycareRecords(filters: DaycareFilters, search: string, page: number) {
  const client = createServerSupabaseClient();
  const safe = search.trim().slice(0, 100).replace(/[(),%_"\\]/g, " ");
  const build = (targetPage: number) => {
    let query = client.from("daycare_attendance").select("attendance_id,beneficiary_id,month,financial_year,total_present,beneficiaries!daycare_attendance_beneficiary_id_fkey(name_of_child,program)", { count: "exact" });
    if (MONTHS.includes(filters.month as typeof MONTHS[number])) query = query.eq("month", filters.month as Database["public"]["Enums"]["month_enum"]);
    if (/^\d{4}-\d{2}$/.test(filters.financial_year)) query = query.eq("financial_year", filters.financial_year);
    if (ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number])) query = query.eq("beneficiaries.program", filters.program as Database["public"]["Enums"]["program_enum"]);
    if (filters.beneficiary) query = query.ilike("beneficiary_id", `%${filters.beneficiary}%`);
    if (safe) query = query.or(`beneficiary_id.ilike.%${safe}%,name_of_child.ilike.%${safe}%`);
    return query.order("month").order("beneficiary_id").range((targetPage - 1) * TABLE_PAGE_SIZE, targetPage * TABLE_PAGE_SIZE - 1);
  };
  let result = await build(page);
  if (result.error || !result.data || result.count === null) throw new Error("Could not load attendance records. Check the test-only read policy.");
  const total = result.count;
  const pageCount = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) result = await build(currentPage);
  if (result.error || !result.data) throw new Error("Could not load this attendance page.");
  const rows = result.data.map((row) => ({ attendance_id: row.attendance_id, beneficiary_id: row.beneficiary_id, name: row.beneficiaries?.name_of_child ?? "—", program: row.beneficiaries?.program ?? "—", month: row.month ?? "—", financial_year: row.financial_year ?? "—", total_present: row.total_present ?? "—" }));
  return { rows, total, page: currentPage, pageCount };
}

export async function getAllDaycareRecords(filters: DaycareFilters) {
  const client = createServerSupabaseClient();
  let query = client.from("daycare_attendance").select("attendance_id,beneficiary_id,month,financial_year,total_present,beneficiaries!daycare_attendance_beneficiary_id_fkey(name_of_child,program)");
  if (MONTHS.includes(filters.month as typeof MONTHS[number])) query = query.eq("month", filters.month as Database["public"]["Enums"]["month_enum"]);
  if (/^\d{4}-\d{2}$/.test(filters.financial_year)) query = query.eq("financial_year", filters.financial_year);
  if (ATTENDANCE_PROGRAMS.includes(filters.program as typeof ATTENDANCE_PROGRAMS[number])) query = query.eq("beneficiaries.program", filters.program as Database["public"]["Enums"]["program_enum"]);
  if (filters.beneficiary) query = query.ilike("beneficiary_id", `%${filters.beneficiary}%`);
  const { data, error } = await query.order("month").order("beneficiary_id");
  if (error || !data) throw new Error("Could not export attendance records.");
  return data.map((row) => ({ beneficiary_id: row.beneficiary_id, name: row.beneficiaries?.name_of_child ?? "", program: row.beneficiaries?.program ?? "", month: row.month ?? "", financial_year: row.financial_year ?? "", total_present: row.total_present ?? "" }));
}
