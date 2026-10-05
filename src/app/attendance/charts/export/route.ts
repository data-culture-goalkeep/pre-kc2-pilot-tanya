import { NextResponse } from "next/server";
import { MONTHS, ATTENDANCE_PROGRAMS, type DaycareFilters } from "@/lib/daycare";
import { getDaycareData } from "@/lib/queries/daycare";
import { toCsv } from "@/lib/csv";

const CHARTS = ["monthly_attendance", "program", "attendance_band", "quarterly"] as const;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const chart = params.get("chart") ?? "";
  if (!CHARTS.some((value) => value === chart)) return NextResponse.json({ error: "Choose a valid attendance chart." }, { status: 400 });
  const filters: DaycareFilters = { month: MONTHS.includes(params.get("month") as typeof MONTHS[number]) ? params.get("month")! : "", program: ATTENDANCE_PROGRAMS.includes(params.get("program") as typeof ATTENDANCE_PROGRAMS[number]) ? params.get("program")! : "", beneficiary: (params.get("beneficiary") ?? "").slice(0,100) };
  try {
    const { charts } = await getDaycareData(filters);
    const rows = charts.filter((row) => row.chart_name === chart).map((row) => ({ label: row.label, value: row.value, series: row.series ?? "" }));
    return new Response(toCsv(rows, ["label", "value", "series"]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="daycare-attendance-${chart}.csv"`, "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export this chart." }, { status: 503 }); }
}
