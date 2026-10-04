import { NextResponse } from "next/server";
import { BENEFICIARY_COLUMNS, filterBeneficiaries, PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { toCsv } from "@/lib/csv";
import { getBeneficiaries } from "@/lib/queries/beneficiaries";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters = { search: params.get("search") ?? "", program: params.get("program") ?? "", status: params.get("status") ?? "" };
  if ((filters.program && !PROGRAMS.some((value) => value === filters.program)) || (filters.status && !STATUSES.some((value) => value === filters.status))) return NextResponse.json({ error: "Choose a valid program and status filter." }, { status: 400 });
  try {
    const rows = filterBeneficiaries(await getBeneficiaries(), filters);
    return new Response(toCsv(rows, BENEFICIARY_COLUMNS), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="beneficiaries.csv"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export beneficiaries. Please try again." }, { status: 503 });
  }
}
