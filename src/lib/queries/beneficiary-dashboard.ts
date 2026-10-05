import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DATA_REVALIDATE_SECONDS, TABLE_PAGE_SIZE, type BeneficiaryFilters } from "@/lib/beneficiaries";
import type { Database } from "@/types/database";

export const BENEFICIARY_DASHBOARD_CACHE_TAG = "beneficiaries";
export const CHART_NAMES = ["program", "status", "gender", "age_group", "primary_diagnosis", "hospital"] as const;
export type ChartName = (typeof CHART_NAMES)[number];
export type BeneficiaryChartRow = { chart_name: string; label: string; value: number; sort_order: number };
export type BeneficiaryDashboardSummary = { total_count: number; active_count: number; exited_count: number };
export type BeneficiaryDashboardResult = { summary: BeneficiaryDashboardSummary; charts: BeneficiaryChartRow[] };

async function readDashboardData(filters: Omit<BeneficiaryFilters, "search"> = { program: "", status: "", gender: "", hospital: "" }): Promise<BeneficiaryDashboardResult> {
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("beneficiary_dashboard_data", {
    p_program: filters.program ? filters.program as Database["public"]["Enums"]["program_enum"] : null,
    p_status: filters.status ? filters.status as Database["public"]["Enums"]["status_enum"] : null,
    p_gender: filters.gender || null,
    p_hospital: filters.hospital ? filters.hospital as Database["public"]["Enums"]["hospital_enum"] : null,
  });
  if (error || !data) {
    throw new Error("Could not load beneficiary chart data. Apply the dashboard aggregation migration and check the Supabase connection.");
  }
  return data as unknown as BeneficiaryDashboardResult;
}

const getCachedDashboardData = unstable_cache(
  (filters: Omit<BeneficiaryFilters, "search">) => readDashboardData(filters),
  ["beneficiary-dashboard-aggregates-v2"],
  { revalidate: DATA_REVALIDATE_SECONDS, tags: [BENEFICIARY_DASHBOARD_CACHE_TAG] },
);

export function getBeneficiaryDashboardData(filters?: Omit<BeneficiaryFilters, "search">) {
  return getCachedDashboardData(filters ?? { program: "", status: "", gender: "", hospital: "" });
}

async function readBeneficiaryPage(page: number, filters: BeneficiaryFilters) {
  const client = createServerSupabaseClient();
  const safeSearch = filters.search.trim().slice(0, 100).replace(/[(),%_"\\]/g, " ");
  const select = "beneficiary_id,name_of_child,program,date_of_birth,status,primary_mobile_no,location,gender,hospital";
  const buildQuery = (requestedPage: number) => {
    let query = client.from("beneficiaries").select(select, { count: "exact" });
    if (filters.program) query = query.eq("program", filters.program as Database["public"]["Enums"]["program_enum"]);
    if (filters.status) query = query.eq("status", filters.status as Database["public"]["Enums"]["status_enum"]);
    if (filters.gender) query = query.ilike("gender", filters.gender);
    if (filters.hospital) query = query.eq("hospital", filters.hospital as Database["public"]["Enums"]["hospital_enum"]);
    if (safeSearch) {
      const pattern = `%${safeSearch}%`;
      query = query.or(["beneficiary_id", "name_of_child", "location", "primary_mobile_no"].map((field) => `${field}.ilike.${pattern}`).join(","));
    }
    const start = (requestedPage - 1) * TABLE_PAGE_SIZE;
    return query.order("beneficiary_id").range(start, start + TABLE_PAGE_SIZE - 1);
  };
  const initial = await buildQuery(page);
  let { data, error } = initial;
  const count = initial.count;
  if (error || !data || count === null) throw new Error("Could not load the beneficiary table. Check the Supabase connection and read policy.");
  const pageCount = Math.max(1, Math.ceil(count / TABLE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) {
    ({ data, error } = await buildQuery(currentPage));
    if (error || !data) throw new Error("Could not load this page of beneficiaries. Please try again.");
  }
  return { rows: data, total: count, page: currentPage, pageCount };
}

export const getBeneficiaryPage = unstable_cache(
  readBeneficiaryPage,
  ["beneficiary-server-table-page-v1"],
  { revalidate: DATA_REVALIDATE_SECONDS, tags: [BENEFICIARY_DASHBOARD_CACHE_TAG] },
);

export async function getChartRows(chartName: ChartName, filters?: Omit<BeneficiaryFilters, "search">) {
  const { charts } = await getBeneficiaryDashboardData(filters);
  return charts.filter((row) => row.chart_name === chartName).sort((left, right) => {
    if (chartName === "age_group") return (left.sort_order ?? 0) - (right.sort_order ?? 0);
    if (chartName === "primary_diagnosis") return (right.value ?? 0) - (left.value ?? 0) || (left.label ?? "").localeCompare(right.label ?? "");
    return (left.label ?? "").localeCompare(right.label ?? "");
  });
}
