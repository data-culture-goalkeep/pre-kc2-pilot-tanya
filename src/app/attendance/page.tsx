import type { Metadata } from "next";
import { DaycareAttendanceView } from "@/components/daycare-attendance-view";
import { ATTENDANCE_PROGRAMS, currentIndiaFinancialYear, currentIndiaMonth, MONTHS, type DaycareFilters } from "@/lib/daycare";
import { getDaycareAttendanceGrid, getDaycareData } from "@/lib/queries/daycare";

export const metadata: Metadata = { title: "Daycare Attendance" };
export const revalidate = 60;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const monthValue = value("month");
  const yearValue = value("financial_year");
  const filters: DaycareFilters = {
    month: MONTHS.includes(monthValue as typeof MONTHS[number]) ? monthValue : currentIndiaMonth(),
    financial_year: /^\d{4}-\d{2}$/.test(yearValue) ? yearValue : currentIndiaFinancialYear(),
    program: ATTENDANCE_PROGRAMS.includes(value("program") as typeof ATTENDANCE_PROGRAMS[number]) ? value("program") : "Daycare",
    beneficiary: "",
  };
  const [analyticsResult, gridResult] = await Promise.allSettled([getDaycareData(filters), getDaycareAttendanceGrid(filters)]);
  const analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const grid = gridResult.status === "fulfilled" ? gridResult.value : [];
  const chartError = analyticsResult.status === "rejected" ? analyticsResult.reason instanceof Error ? analyticsResult.reason.message : "Could not load daycare analytics." : undefined;
  const gridError = gridResult.status === "rejected" ? gridResult.reason instanceof Error ? gridResult.reason.message : "Could not load the attendance grid." : undefined;
  return <DaycareAttendanceView key={JSON.stringify(filters)} filters={filters} summary={analytics?.summary ?? null} charts={analytics?.charts ?? []} gridRows={grid} gridError={gridError} chartError={chartError} />;
}
