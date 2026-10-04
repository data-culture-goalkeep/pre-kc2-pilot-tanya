import type { Metadata } from "next";
import { BeneficiariesView } from "@/components/beneficiaries-view";
import { PROGRAMS, STATUSES } from "@/lib/beneficiaries";
import { getBeneficiaryDashboardData, getBeneficiaryPage } from "@/lib/queries/beneficiary-dashboard";

export const metadata: Metadata = { title: "Beneficiaries" };
export const revalidate = 60;

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const getParam = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const rawProgram = getParam("program"), rawStatus = getParam("status");
  const filters = {
    search: getParam("search").slice(0, 100),
    program: PROGRAMS.some((value) => value === rawProgram) ? rawProgram : "",
    status: STATUSES.some((value) => value === rawStatus) ? rawStatus : "",
  };
  const pageValue = Number.parseInt(getParam("page") || "1", 10);
  const requestedPage = Number.isFinite(pageValue) ? Math.max(1, Math.min(pageValue, 100000)) : 1;
  const [tableResult, analyticsResult] = await Promise.allSettled([
    getBeneficiaryPage(requestedPage, filters),
    getBeneficiaryDashboardData(),
  ]);
  const table = tableResult.status === "fulfilled" ? tableResult.value : { rows: [], total: 0, page: 1, pageCount: 1 };
  const analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const tableError = tableResult.status === "rejected"
    ? tableResult.reason instanceof Error ? tableResult.reason.message : "Could not load beneficiaries. Please try again."
    : undefined;
  const chartError = analyticsResult.status === "rejected"
    ? analyticsResult.reason instanceof Error ? analyticsResult.reason.message : "Could not load beneficiary chart data. Please try again."
    : undefined;
  return (
    <BeneficiariesView
      key={`${filters.search}|${filters.program}|${filters.status}`}
      rows={table.rows}
      total={table.total}
      page={table.page}
      pageCount={table.pageCount}
      filters={filters}
      summary={analytics?.summary ?? null}
      charts={analytics?.charts ?? []}
      tableError={tableError}
      chartError={chartError}
    />
  );
}
