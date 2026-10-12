import { NextResponse } from "next/server";
import { ASSESSMENT_PHASES, ASSESSMENT_TESTS, MONTHS, type AssessmentFilters } from "@/lib/assessments";
import { getAllAssessmentRecords } from "@/lib/queries/assessments";
import { toCsv } from "@/lib/csv";
import { isFinancialYear } from "@/lib/financial-year";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const year = params.get("financial_year") ?? "";
  const filters: AssessmentFilters = {
    test: ASSESSMENT_TESTS.includes(params.get("test") as typeof ASSESSMENT_TESTS[number]) ? params.get("test")! : "",
    phase: ASSESSMENT_PHASES.includes(params.get("phase") as typeof ASSESSMENT_PHASES[number]) ? params.get("phase")! : "",
    month: MONTHS.includes(params.get("month") as typeof MONTHS[number]) ? params.get("month")! : "",
    financial_year: isFinancialYear(year) ? year : "",
  };
  try {
    const rows = await getAllAssessmentRecords(filters);
    return new Response(toCsv(rows, ["test_type", "phase", "beneficiary_id", "name_of_child", "assessment_date", "financial_year", "notes"]), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="assessment-records.csv"', "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export records." }, { status: 503 });
  }
}
