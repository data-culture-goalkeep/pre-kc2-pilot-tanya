import { NextResponse } from "next/server";
import { BENEFICIARY_COLUMNS, filterBeneficiaries, HOSPITALS, PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { toCsv } from "@/lib/csv";
import { getBeneficiaries } from "@/lib/queries/beneficiaries";
import { isFinancialYear } from "@/lib/financial-year";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters = { search: "", program: params.get("program") ?? "", status: params.get("status") ?? "", gender: params.get("gender") ?? "", hospital: params.get("hospital") ?? "", financial_year: params.get("financial_year") ?? "" };
  if ((filters.program && !PROGRAMS.some((value) => value === filters.program)) || (filters.status && !STATUSES.some((value) => value === filters.status)) || (filters.hospital && !HOSPITALS.some((value) => value === filters.hospital)) || (filters.financial_year && !isFinancialYear(filters.financial_year))) return NextResponse.json({ error: "Choose valid beneficiary filters." }, { status: 400 });
  try {
    const rows = filterBeneficiaries(await getBeneficiaries(), filters);
    return new Response(toCsv(rows, BENEFICIARY_COLUMNS), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="beneficiaries.csv"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not export beneficiaries. Please try again." }, { status: 503 });
  }
}
