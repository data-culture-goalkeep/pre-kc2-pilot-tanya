import type {Metadata} from "next";
import {AssessmentsView} from "@/components/assessments-view";
import {ASSESSMENT_PHASES,ASSESSMENT_TESTS,MONTHS,type AssessmentFilters} from "@/lib/assessments";
import {getAssessmentDashboardData} from "@/lib/queries/assessments";
export const metadata:Metadata={title:"Assessments"};export const revalidate=60;
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const value=(k:string)=>typeof params[k]==="string"?params[k] as string:"";
 const filters:AssessmentFilters={test:ASSESSMENT_TESTS.includes(value("test") as typeof ASSESSMENT_TESTS[number])?value("test"):"",phase:ASSESSMENT_PHASES.includes(value("phase") as typeof ASSESSMENT_PHASES[number])?value("phase"):"",month:MONTHS.includes(value("month") as typeof MONTHS[number])?value("month"):""};
 const result=await Promise.allSettled([getAssessmentDashboardData(filters)]);const data=result[0].status==="fulfilled"?result[0].value:null;const chartError=result[0].status==="rejected"?result[0].reason instanceof Error?result[0].reason.message:"Could not load assessment analytics.":undefined;
 return <AssessmentsView key={JSON.stringify(filters)} filters={filters} summary={data?.summary??null} charts={data?.charts??[]} chartError={chartError}/>;
}
