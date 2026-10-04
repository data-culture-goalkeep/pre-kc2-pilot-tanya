import { NextResponse } from "next/server";
import { HOSPITAL_FILTERS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import { getHospitalDashboardData } from "@/lib/queries/hospital";
import { toCsv } from "@/lib/csv";

const CHARTS=["monthly","hospital","top_children"] as const;
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const chart=params.get("chart")??"";
 if(!CHARTS.some((value)=>value===chart))return NextResponse.json({error:"Choose a valid hospital chart."},{status:400});
 const filters:HospitalFilters={month:MONTHS.includes(params.get("month") as typeof MONTHS[number])?params.get("month")!:"",hospital:HOSPITAL_FILTERS.includes(params.get("hospital") as typeof HOSPITAL_FILTERS[number])?params.get("hospital")!:""};
 try{const data=await getHospitalDashboardData(filters);const rows=data.charts.filter((row)=>row.chart_name===chart).map((row)=>({label:row.label,value:row.value}));return new Response(toCsv(rows,["label","value"]),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="hospital-${chart}.csv"`,"Cache-Control":"no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not export this chart."},{status:503});}
}
