"use server";

import { randomInt } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ASSESSMENT_TESTS, ASSESSMENT_PHASES } from "@/lib/assessments";

export type AssessmentBeneficiary = { beneficiary_id: string; name_of_child: string };

export async function findAssessmentBeneficiaries(search: string): Promise<AssessmentBeneficiary[]> {
  const term = search.trim().slice(0, 80).replace(/[(),%_\\]/g, " ");
  if (term.length < 2) return [];
  const db = createServerSupabaseClient();
  const { data, error } = await db.from("beneficiaries").select("beneficiary_id,name_of_child")
    .or(`beneficiary_id.ilike.%${term}%,name_of_child.ilike.%${term}%`)
    .order("name_of_child").limit(20);
  if (error || !data) return [];
  return data.map((row) => ({ beneficiary_id: row.beneficiary_id, name_of_child: row.name_of_child ?? "" }));
}

export async function saveAssessment(form: FormData): Promise<{ok:boolean;error?:string}> {
  const beneficiary_id=String(form.get("beneficiary_id")??"").trim().slice(0,100);
  const name_of_child=String(form.get("name_of_child")??"").trim().slice(0,200);
  const test=String(form.get("test_type")??"");
  const date=String(form.get("assessment_date")??"");
  if (!beneficiary_id || !name_of_child || !ASSESSMENT_TESTS.includes(test as typeof ASSESSMENT_TESTS[number]) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return {ok:false,error:"Choose a child, test type, and assessment date."};
  const db=createServerSupabaseClient();
  for(let attempt=0;attempt<5;attempt++){
    const source_row=randomInt(1,2_147_483_647);let error;
    if(test==="Rosenberg"){
      const row:Record<string,unknown>={beneficiary_id,name_of_child,assessment_date:date,source_file:"Happy Feet Dashboard",source_sheet:"Manual Entry",source_row};
      for(let i=1;i<=10;i++){
        const raw=String(form.get(`q${i}`)??"");
        if(!["SA","A","DA","SD"].includes(raw))return {ok:false,error:"Answer every Rosenberg question before saving."};
        row[`q${i}_raw`]=raw;
        row[`q${i}_value`] = ({SD:1,DA:2,A:3,SA:4} as Record<string,number>)[raw];
      }
      ({error}=await db.from("rosenberg_assessment_history").insert(row as never));
    }else{
      const phase=String(form.get("phase")??"");
      if(!ASSESSMENT_PHASES.includes(phase as typeof ASSESSMENT_PHASES[number]))return {ok:false,error:"Choose Pre or Post for the Stirling assessment."};
      const row:Record<string,unknown>={beneficiary_id,name_of_child,test_type:phase,assessment_date:date,source_file:"Happy Feet Dashboard",source_sheet:"Manual Entry",source_row};
      for(let i=1;i<=15;i++){
        const score=Number(form.get(`q${i}`));
        if(!Number.isInteger(score)||score<1||score>5)return {ok:false,error:"Answer every Stirling question with a score from 1 to 5."};
        row[`q${i}`]=score;
      }
      ({error}=await db.from("stirling_assessment_history").insert(row as never));
    }
    if(!error){updateTag("assessments");revalidatePath("/assessments");return {ok:true};}
    if(error.code==="23503")return {ok:false,error:"That beneficiary could not be found. Choose a result from the picker."};
    if(error.code==="42501")return {ok:false,error:"Saving is blocked. Apply the Assessments test migration first."};
    if(error.code==="23505"&&error.message.includes("source_row_uq"))continue;
    return {ok:false,error:"Could not save the assessment. Check the connection and try again."};
  }
  return {ok:false,error:"Please retry the save."};
}

export async function loadAssessmentRecords(filters:Record<string,string>,search:string,page:number){
 const {getAssessmentRecords}=await import("@/lib/queries/assessments");
 const {ASSESSMENT_TESTS,ASSESSMENT_PHASES,MONTHS}=await import("@/lib/assessments");
 return getAssessmentRecords({test:ASSESSMENT_TESTS.includes(filters.test as typeof ASSESSMENT_TESTS[number])?filters.test:"",phase:ASSESSMENT_PHASES.includes(filters.phase as typeof ASSESSMENT_PHASES[number])?filters.phase:"",month:MONTHS.includes(filters.month as typeof MONTHS[number])?filters.month:""},search.slice(0,100),Math.max(1,page));
}
