import { NextResponse } from "next/server";
import { HOSPITAL_FILTERS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import { getAllHospitalRecords } from "@/lib/queries/hospital";
import { toCsv } from "@/lib/csv";

export async function GET(request:Request){const params=new URL(request.url).searchParams;const filters:HospitalFilters={month:MONTHS.includes(params.get("month") as typeof MONTHS[number])?params.get("month")!:"",hospital:HOSPITAL_FILTERS.includes(params.get("hospital") as typeof HOSPITAL_FILTERS[number])?params.get("hospital")!:""};try{const rows=await getAllHospitalRecords(filters);return new Response(toCsv(rows,["hospital_child_id","child_name","session_date","hospital_name","ward"]),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="hospital-sessions.csv"',"Cache-Control":"no-store"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not export hospital sessions."},{status:503});}}
