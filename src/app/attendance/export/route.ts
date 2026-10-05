import { NextResponse } from "next/server";
import { ATTENDANCE_PROGRAMS, MONTHS, type DaycareFilters } from "@/lib/daycare";
import { getAllDaycareRecords } from "@/lib/queries/daycare";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters: DaycareFilters = { month: MONTHS.includes(params.get("month") as typeof MONTHS[number]) ? params.get("month")! : "", financial_year: /^\d{4}-\d{2}$/.test(params.get("financial_year") ?? "") ? params.get("financial_year")! : "", program: ATTENDANCE_PROGRAMS.includes(params.get("program") as typeof ATTENDANCE_PROGRAMS[number]) ? params.get("program")! : "", beneficiary: (params.get("beneficiary") ?? "").slice(0,100) };
  try {
    const rows = await getAllDaycareRecords(filters);
    return new Response(toCsv(rows, ["beneficiary_id","name","program","month","financial_year","total_present"]), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="daycare-attendance-records.csv"', "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export attendance records." }, { status: 503 }); }
}
