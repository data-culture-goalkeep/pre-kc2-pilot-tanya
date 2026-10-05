"use client";

import { useState, useTransition } from "react";
import { saveHospitalSession } from "@/lib/actions/hospital";
import { HOSPITAL_FILTERS, HOSPITAL_WARDS } from "@/lib/hospital";

const INPUT = "mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const SESSION_FIELDS = [
  ["facilitator", "Facilitator"], ["diagnosis", "Diagnosis"], ["ritual", "Ritual"], ["warm_up", "Warm-up"],
  ["core_activity", "Core activity"], ["closure", "Closure"], ["feeling_on_entry", "Feeling on entry"],
  ["feeling_during_activity", "Feeling during activity"], ["felt_relaxed", "Felt relaxed"], ["activity_fun", "Activity fun"],
  ["would_attend_again", "Would attend again"], ["notes", "Notes"],
] as const;

export function HospitalSessionForm({ close, onBusyChange, onSaved }: { close:()=>void; onBusyChange:(busy:boolean)=>void; onSaved:()=>void }) {
  const [mode,setMode]=useState("existing");
  const [error,setError]=useState("");
  const [pending,startTransition]=useTransition();
  function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(pending) return;
    const data=new FormData(event.currentTarget); onBusyChange(true); setError("");
    startTransition(async()=>{ try { const result=await saveHospitalSession(data); if(!result.ok){setError(result.error??"Could not save this session.");return;} onSaved(); }
      catch {setError("Could not confirm the save. Check the records before trying again.");}
      finally {onBusyChange(false);} });
  }
  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
      <p className="text-xs text-muted-foreground">Hospital children are separate from Beneficiaries. New children receive the next H-ID automatically.</p>
      <fieldset className="flex gap-4 text-sm"><legend className="mb-2 font-medium">Child record</legend><label className="flex items-center gap-2"><input type="radio" name="child_mode" value="existing" checked={mode==="existing"} onChange={()=>setMode("existing")} />Existing child</label><label className="flex items-center gap-2"><input type="radio" name="child_mode" value="new" checked={mode==="new"} onChange={()=>setMode("new")} />New child</label></fieldset>
      {mode==="existing" ? <label className="block text-sm font-medium">Hospital child ID *<input name="hospital_child_id" required maxLength={100} placeholder="For example, H-0001" className={INPUT} /></label> : <label className="block text-sm font-medium">Child’s name *<input name="child_name" required maxLength={150} className={INPUT} /></label>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Session date *<input type="date" name="session_date" required max={TODAY} defaultValue={TODAY} className={INPUT} /></label><label className="text-sm font-medium">Hospital *<select name="hospital_name" required defaultValue="" className={INPUT}><option value="">Choose hospital</option>{HOSPITAL_FILTERS.map((value)=><option key={value}>{value}</option>)}</select></label><label className="text-sm font-medium">Ward / department<select name="ward" defaultValue="" className={INPUT}><option value="">Not specified</option>{HOSPITAL_WARDS.map((value)=><option key={value}>{value}</option>)}</select></label></div>
      <div className="grid gap-4 sm:grid-cols-2">{SESSION_FIELDS.map(([name,label])=><label key={name} className="text-sm font-medium">{label}<textarea name={name} rows={2} maxLength={2000} className={INPUT} /></label>)}</div>
      {error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </div>
    <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-lg border border-border px-4 font-medium">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground">{pending?"Saving…":"Save entry"}</button></div>
  </form>;
}
