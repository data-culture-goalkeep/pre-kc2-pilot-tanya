import { NextResponse } from "next/server";
import { ASSESSMENT_PHASES, ASSESSMENT_TESTS, MONTHS, type AssessmentFilters } from "@/lib/assessments";
import { getAssessmentDashboardData } from "@/lib/queries/assessments";
import { toCsv } from "@/lib/csv";
import { isFinancialYear } from "@/lib/financial-year";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const chart = params.get("chart") ?? "";
  if (!ASSESSMENT_TESTS.includes(chart as typeof ASSESSMENT_TESTS[number])) return NextResponse.json({ error: "Choose a valid assessment chart." }, { status: 400 });
  const year = params.get("financial_year") ?? "";
  const filters: AssessmentFilters = {
    test: ASSESSMENT_TESTS.includes(params.get("test") as typeof ASSESSMENT_TESTS[number]) ? params.get("test")! : "",
    phase: ASSESSMENT_PHASES.includes(params.get("phase") as typeof ASSESSMENT_PHASES[number]) ? params.get("phase")! : "",
    month: MONTHS.includes(params.get("month") as typeof MONTHS[number]) ? params.get("month")! : "",
    financial_year: isFinancialYear(year) ? year : "",
  };
  try {
    const data = await getAssessmentDashboardData(filters);
    const rows = data.charts.filter((row) => row.chart_name === chart).map((row) => ({ question_or_score: row.label, response: row.detail, series: row.series, count: row.value }));
    return new Response(toCsv(rows, ["question_or_score", "response", "series", "count"]), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="assessments-${chart.toLowerCase()}.csv"`, "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export chart." }, { status: 503 });
  }
}
