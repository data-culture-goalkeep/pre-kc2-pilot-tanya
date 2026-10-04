import type { Metadata } from "next";
import { DaycareAttendanceView } from "@/components/daycare-attendance-view";
import { ATTENDANCE_PROGRAMS, currentIndiaMonth, MONTHS, type DaycareFilters } from "@/lib/daycare";
import { getDaycareData } from "@/lib/queries/daycare";

export const metadata: Metadata = { title: "Daycare Attendance" };
export const revalidate = 60;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const monthValue = value("month");
  const filters: DaycareFilters = {
    month: params.clear === "all" ? "" : MONTHS.includes(monthValue as typeof MONTHS[number]) ? monthValue : currentIndiaMonth(),
    program: ATTENDANCE_PROGRAMS.includes(value("program") as typeof ATTENDANCE_PROGRAMS[number]) ? value("program") : "",
    beneficiary: value("beneficiary").slice(0, 100),
  };
  const result = await Promise.allSettled([getDaycareData(filters)]);
  const analytics = result[0].status === "fulfilled" ? result[0].value : null;
  const chartError = result[0].status === "rejected" ? result[0].reason instanceof Error ? result[0].reason.message : "Could not load daycare analytics." : undefined;
  return <DaycareAttendanceView key={JSON.stringify(filters)} filters={filters} summary={analytics?.summary ?? null} charts={analytics?.charts ?? []} chartError={chartError} />;
}
