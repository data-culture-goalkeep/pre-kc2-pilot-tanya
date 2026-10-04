import type { Metadata } from "next";
import { HospitalSessionsView } from "@/components/hospital-sessions-view";
import { currentIndiaMonth, HOSPITAL_FILTERS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import { getHospitalDashboardData } from "@/lib/queries/hospital";

export const metadata:Metadata={title:"Hospital Sessions"};
export const revalidate=60;
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams; const value=(key:string)=>typeof params[key]==="string"?params[key] as string:"";
  const monthValue=value("month");
  const filters:HospitalFilters={month:params.clear==="all"?"":MONTHS.includes(monthValue as typeof MONTHS[number])?monthValue:currentIndiaMonth(),hospital:HOSPITAL_FILTERS.includes(value("hospital") as typeof HOSPITAL_FILTERS[number])?value("hospital"):""};
  const result=await Promise.allSettled([getHospitalDashboardData(filters)]);const data=result[0].status==="fulfilled"?result[0].value:null;
  const chartError=result[0].status==="rejected"?result[0].reason instanceof Error?result[0].reason.message:"Could not load hospital analytics.":undefined;
  return <HospitalSessionsView key={JSON.stringify(filters)} filters={filters} summary={data?.summary??null} charts={data?.charts??[]} chartError={chartError}/>;
}
