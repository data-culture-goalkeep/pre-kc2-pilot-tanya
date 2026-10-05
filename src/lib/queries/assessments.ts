import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DATA_REVALIDATE_SECONDS, TABLE_PAGE_SIZE } from "@/lib/beneficiaries";
import { ASSESSMENT_PHASES, ASSESSMENT_TESTS, MONTHS, type AssessmentFilters } from "@/lib/assessments";
import type { Database } from "@/types/database";

export type AssessmentSummary = { assessments_recorded: number; children_assessed: number; pre_post_pairs: number };
export type AssessmentChartRow = { chart_name: string; label: string; value: number; series: string; detail: string };
export type AssessmentDashboardData = { summary: AssessmentSummary; charts: AssessmentChartRow[] };
async function read(filters: AssessmentFilters): Promise<AssessmentDashboardData> {
  const db = createServerSupabaseClient();
  const { data, error } = await db.rpc("assessments_dashboard_data", {
    p_test: ASSESSMENT_TESTS.includes(filters.test as typeof ASSESSMENT_TESTS[number]) ? filters.test : null,
    p_phase: ASSESSMENT_PHASES.includes(filters.phase as typeof ASSESSMENT_PHASES[number]) ? filters.phase : null,
    p_month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month as Database["public"]["Enums"]["month_enum"] : null,
  });
  if (error || !data) throw new Error("Could not load assessment analytics. Apply the Assessments test migration.");
  return data as unknown as AssessmentDashboardData;
}
const cached = unstable_cache((filters: AssessmentFilters) => read(filters), ["assessment-dashboard-v1"], { revalidate: DATA_REVALIDATE_SECONDS, tags: ["assessments"] });
export const getAssessmentDashboardData = (filters: AssessmentFilters) => cached(filters);

function filtered(db: ReturnType<typeof createServerSupabaseClient>, filters: AssessmentFilters) {
  let q = db.from("assessments_records").select("test_type,phase,record_id,beneficiary_id,name_of_child,assessment_date,month,notes", { count: "exact" });
  if (ASSESSMENT_TESTS.includes(filters.test as typeof ASSESSMENT_TESTS[number])) q = q.eq("test_type", filters.test);
  if (filters.phase && ASSESSMENT_PHASES.includes(filters.phase as typeof ASSESSMENT_PHASES[number])) q = q.eq("phase", filters.phase);
  if (MONTHS.includes(filters.month as typeof MONTHS[number])) q = q.eq("month", filters.month);
  return q;
}
export async function getAssessmentRecords(filters: AssessmentFilters, search: string, page: number) {
  const db = createServerSupabaseClient(); const safe = search.trim().slice(0,100).replace(/[(),%_"\\]/g," ");
  const build = (p: number) => {
    let q = filtered(db, filters);
    if (safe) q = q.or(`beneficiary_id.ilike.%${safe}%,name_of_child.ilike.%${safe}%`);
    return q.order("assessment_date", { ascending:false }).range((p-1)*TABLE_PAGE_SIZE,p*TABLE_PAGE_SIZE-1);
  };
  let result=await build(page); if(result.error||!result.data||result.count===null) throw new Error("Could not load assessment records.");
  const total=result.count;const pageCount=Math.max(1,Math.ceil(total/TABLE_PAGE_SIZE));const currentPage=Math.min(page,pageCount);if(currentPage!==page)result=await build(currentPage);
  if(result.error||!result.data)throw new Error("Could not load this assessment page.");
  return {rows:result.data.map((r)=>({record_id:r.record_id??"",test_type:r.test_type??"",phase:r.phase??"—",beneficiary_id:r.beneficiary_id??"",name_of_child:r.name_of_child??"—",assessment_date:r.assessment_date??"—"})),total,page:currentPage,pageCount};
}
export async function getAllAssessmentRecords(filters: AssessmentFilters) {
 const db=createServerSupabaseClient();const q=filtered(db,filters);
 const {data,error}=await q.order("assessment_date",{ascending:false});if(error||!data)throw new Error("Could not export assessment records.");return data.map(r=>({test_type:r.test_type??"",phase:r.phase??"",beneficiary_id:r.beneficiary_id??"",name_of_child:r.name_of_child??"",assessment_date:r.assessment_date??"",notes:r.notes??""}));
}
