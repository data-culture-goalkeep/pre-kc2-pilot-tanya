import { NextResponse } from "next/server";
import { CHART_NAMES, getChartRows, type ChartName } from "@/lib/queries/beneficiary-dashboard";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const chart = new URL(request.url).searchParams.get("chart");
  if (!CHART_NAMES.some((name) => name === chart)) return NextResponse.json({ error: "Choose a valid beneficiary chart." }, { status: 400 });
  try {
    const rows = (await getChartRows(chart as ChartName)).map((row) => ({ label: row.label ?? "Unknown", value: row.value ?? 0 }));
    return new Response(toCsv(rows, ["label", "value"]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="beneficiaries-${chart}.csv"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export chart data. Please try again." }, { status: 503 });
  }
}
