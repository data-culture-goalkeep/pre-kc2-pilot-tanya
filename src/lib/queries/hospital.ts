import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DATA_REVALIDATE_SECONDS, TABLE_PAGE_SIZE } from "@/lib/beneficiaries";
import { HOSPITAL_FILTERS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import type { Database } from "@/types/database";

export type HospitalSummary = { total_children: number; total_sessions: number; sessions_this_month: number };
export type HospitalChartRow = { chart_name: string; label: string; value: number; sort_order: number; series: string | null };
export type HospitalDashboardData = { summary: HospitalSummary; charts: HospitalChartRow[] };
const TAG = "hospital-sessions";

async function readData(filters: HospitalFilters): Promise<HospitalDashboardData> {
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("hospital_sessions_dashboard_data", {
    p_month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month as Database["public"]["Enums"]["month_enum"] : null,
    p_hospital: HOSPITAL_FILTERS.includes(filters.hospital as typeof HOSPITAL_FILTERS[number]) ? filters.hospital as Database["public"]["Enums"]["hospital_enum"] : null,
  });
  if (error || !data) throw new Error("Could not load Hospital Sessions analytics. Apply the Hospital Sessions migration and verify the test access policy.");
  return data as unknown as HospitalDashboardData;
}

const cached = unstable_cache((filters: HospitalFilters) => readData(filters), ["hospital-dashboard-v1"], { revalidate: DATA_REVALIDATE_SECONDS, tags: [TAG] });
export const getHospitalDashboardData = (filters: HospitalFilters) => cached(filters);

export async function getHospitalRecords(filters: HospitalFilters, search: string, page: number) {
  const client = createServerSupabaseClient();
  const safe = search.trim().slice(0,100).replace(/[(),%_"\\]/g," ");
  const build = (targetPage: number) => {
    let query = client.from("hospital_sessions_records").select("hospital_session_feedback_id,hospital_child_id,child_name,session_date,hospital_name,ward", { count: "exact" });
    if (MONTHS.includes(filters.month as typeof MONTHS[number])) query = query.eq("month", filters.month);
    if (HOSPITAL_FILTERS.includes(filters.hospital as typeof HOSPITAL_FILTERS[number])) query = query.eq("hospital_name", filters.hospital as Database["public"]["Enums"]["hospital_enum"]);
    if (safe) query = query.or(`hospital_child_id.ilike.%${safe}%,child_name.ilike.%${safe}%`);
    return query.order("session_date", { ascending: false }).order("hospital_child_id").range((targetPage-1)*TABLE_PAGE_SIZE,targetPage*TABLE_PAGE_SIZE-1);
  };
  let result = await build(page);
  if (result.error || !result.data || result.count === null) throw new Error("Could not load hospital session records. Check the test-only read policy.");
  const total = result.count;
  const pageCount = Math.max(1,Math.ceil(total/TABLE_PAGE_SIZE));
  const currentPage = Math.min(page,pageCount);
  if (currentPage !== page) result = await build(currentPage);
  if (result.error || !result.data) throw new Error("Could not load this hospital session page.");
  return { rows: result.data.map((row) => ({ hospital_session_feedback_id: row.hospital_session_feedback_id ?? "", hospital_child_id: row.hospital_child_id ?? "—", child_name: row.child_name ?? "—", session_date: row.session_date ?? "—", hospital_name: row.hospital_name ?? "—", ward: row.ward ?? "—" })), total, page: currentPage, pageCount };
}

export async function getAllHospitalRecords(filters: HospitalFilters) {
  const client = createServerSupabaseClient();
  let query = client.from("hospital_sessions_records").select("hospital_child_id,child_name,session_date,hospital_name,ward");
  if (MONTHS.includes(filters.month as typeof MONTHS[number])) query = query.eq("month", filters.month);
  if (HOSPITAL_FILTERS.includes(filters.hospital as typeof HOSPITAL_FILTERS[number])) query = query.eq("hospital_name", filters.hospital as Database["public"]["Enums"]["hospital_enum"]);
  const { data, error } = await query.order("session_date", { ascending: false });
  if (error || !data) throw new Error("Could not export hospital session records.");
  return data.map((row) => ({ hospital_child_id: row.hospital_child_id ?? "", child_name: row.child_name ?? "", session_date: row.session_date ?? "", hospital_name: row.hospital_name ?? "", ward: row.ward ?? "" }));
}
