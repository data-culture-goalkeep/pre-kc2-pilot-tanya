"use client";
import { useState,useTransition } from "react";
import { saveAssessment } from "@/lib/actions/assessments";
import { ASSESSMENT_TESTS,ASSESSMENT_PHASES } from "@/lib/assessments";
const INPUT="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";
const TODAY=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export function AssessmentForm({close,onBusyChange,onSaved}:{close:()=>void;onBusyChange:(v:boolean)=>void;onSaved:()=>void}){
 const [test,setTest]=useState("Rosenberg");const [error,setError]=useState("");const [pending,start]=useTransition();
 function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);onBusyChange(true);setError("");start(async()=>{try{const result=await saveAssessment(data);if(!result.ok){setError(result.error??"Could not save assessment.");return;}onSaved();}catch{setError("Could not confirm the save. Check records before retrying.");}finally{onBusyChange(false);}});}
 const count=test==="Rosenberg"?10:15;
 return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
  <label className="block text-sm font-medium">Beneficiary ID *<input name="beneficiary_id" required maxLength={100} placeholder="Enter an existing beneficiary ID" className={INPUT}/></label>
  <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Test type *<select name="test_type" value={test} onChange={e=>setTest(e.target.value)} className={INPUT}>{ASSESSMENT_TESTS.map(v=><option key={v}>{v}</option>)}</select></label>
  {test==="Stirling"&&<label className="text-sm font-medium">Pre / Post *<select name="phase" required className={INPUT}>{ASSESSMENT_PHASES.map(v=><option key={v}>{v}</option>)}</select></label>}
  <label className="text-sm font-medium">Assessment date *<input type="date" name="assessment_date" required max={TODAY} defaultValue={TODAY} className={INPUT}/></label></div>
  <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:count},(_,i)=>i+1).map(i=><label key={i} className="text-sm font-medium">Question {i}<select name={`q${i}`} defaultValue="" className={INPUT}><option value="">No response</option>{(test==="Rosenberg"?["SA","A","DA","SD"]:["1","2","3","4","5"]).map(v=><option key={v}>{v}</option>)}</select></label>)}</div>
  <p className="text-xs text-muted-foreground">Responses are saved as entered. Totals are not calculated or changed.</p>{error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
 </div><div className="flex justify-end gap-3 border-t border-border px-6 py-4"><button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-lg border border-border px-4">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground">{pending?"Saving…":"Save entry"}</button></div></form>
}
