import { NextResponse } from "next/server";
import { HOSPITALS, PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { CHART_NAMES, getChartRows, type ChartName } from "@/lib/queries/beneficiary-dashboard";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const chart = params.get("chart");
  if (!CHART_NAMES.some((name) => name === chart)) return NextResponse.json({ error: "Choose a valid beneficiary chart." }, { status: 400 });
  const program = params.get("program") ?? "", status = params.get("status") ?? "", hospital = params.get("hospital") ?? "";
  if ((program && !PROGRAMS.includes(program as typeof PROGRAMS[number])) || (status && !STATUSES.includes(status as typeof STATUSES[number])) || (hospital && !HOSPITALS.includes(hospital as typeof HOSPITALS[number]))) return NextResponse.json({ error: "Choose valid chart filters." }, { status: 400 });
  const filters = { program, status, gender: (params.get("gender") ?? "").slice(0, 40), hospital };
  try {
    const rows = (await getChartRows(chart as ChartName, filters)).map((row) => ({ label: row.label ?? "Unknown", value: row.value ?? 0 }));
    return new Response(toCsv(rows, ["label", "value"]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="beneficiaries-${chart}.csv"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export chart data. Please try again." }, { status: 503 });
  }
}
