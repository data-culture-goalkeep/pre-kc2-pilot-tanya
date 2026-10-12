import type { Metadata } from "next";
import { BeneficiariesView } from "@/components/beneficiaries-view";
import { HOSPITALS, PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { getBeneficiaryDashboardData } from "@/lib/queries/beneficiary-dashboard";
import { isFinancialYear } from "@/lib/financial-year";

export const metadata: Metadata = { title: "Beneficiaries" };
export const revalidate = 60;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const getParam = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const rawProgram = getParam("program"), rawStatus = getParam("status"), rawHospital = getParam("hospital"), rawFinancialYear = getParam("financial_year");
  const filters = {
    search: "",
    program: PROGRAMS.some((value) => value === rawProgram) ? rawProgram : "",
    status: STATUSES.some((value) => value === rawStatus) ? rawStatus : "",
    gender: getParam("gender").slice(0, 40),
    hospital: HOSPITALS.some((value) => value === rawHospital) ? rawHospital : "",
    financial_year: isFinancialYear(rawFinancialYear) ? rawFinancialYear : "",
  };
  const [analyticsResult] = await Promise.allSettled([getBeneficiaryDashboardData(filters)]);
  const analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const chartError = analyticsResult.status === "rejected"
    ? analyticsResult.reason instanceof Error ? analyticsResult.reason.message : "Could not load beneficiary chart data. Please try again."
    : undefined;
  return (
    <BeneficiariesView
      key={`${filters.program}|${filters.status}|${filters.gender}|${filters.hospital}|${filters.financial_year}`}
      filters={filters}
      summary={analytics?.summary ?? null}
      charts={analytics?.charts ?? []}
      financialYears={analytics?.financial_years ?? []}
      chartError={chartError}
    />
  );
}
