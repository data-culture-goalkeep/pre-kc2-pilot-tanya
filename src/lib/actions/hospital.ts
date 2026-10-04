"use server";

import { randomInt } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { HOSPITAL_FILTERS, HOSPITAL_WARDS, MONTHS, type HospitalFilters } from "@/lib/hospital";
import { getHospitalRecords } from "@/lib/queries/hospital";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const MAX_INT = 2_147_483_647;
function sourceRow() { return randomInt(1, MAX_INT); }

export async function saveHospitalSession(formData: FormData): Promise<{ ok: boolean; error?: string; childId?: string }> {
  const mode = String(formData.get("child_mode") ?? "existing");
  const existingChildId = String(formData.get("hospital_child_id") ?? "").trim().slice(0,100);
  const newChildName = String(formData.get("child_name") ?? "").trim().slice(0,150);
  const sessionDate = String(formData.get("session_date") ?? "").trim();
  const hospital = String(formData.get("hospital_name") ?? "");
  const ward = String(formData.get("ward") ?? "");
  if (mode !== "existing" && mode !== "new") return { ok: false, error: "Choose an existing or new child." };
  if (mode === "existing" && !existingChildId) return { ok: false, error: "Enter the existing hospital child ID." };
  if (mode === "new" && !newChildName) return { ok: false, error: "Enter the new hospital child’s name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || !Number.isFinite(Date.parse(sessionDate)) || new Date(sessionDate).toISOString().slice(0,10) !== sessionDate) return { ok: false, error: "Enter a valid session date." };
  if (!HOSPITAL_FILTERS.includes(hospital as typeof HOSPITAL_FILTERS[number])) return { ok: false, error: "Choose a listed hospital." };
  if (ward && !HOSPITAL_WARDS.includes(ward as typeof HOSPITAL_WARDS[number])) return { ok: false, error: "Choose a listed ward." };
  const fields = ["facilitator","diagnosis","ritual","warm_up","core_activity","closure","feeling_on_entry","feeling_during_activity","felt_relaxed","activity_fun","would_attend_again","notes"] as const;
  const session: Record<string,string|null> = { session_date: sessionDate, hospital_name: hospital, ward: ward || null };
  for (const field of fields) { const value=String(formData.get(field) ?? "").trim(); if (value.length > 2000) return { ok:false,error:"Keep each session field under 2,000 characters." }; session[field]=value || null; }
  const client = createServerSupabaseClient();
  const { data, error } = await client.rpc("insert_hospital_session_entry", {
    p_existing_child_id: mode === "existing" ? existingChildId : null,
    p_new_child_name: mode === "new" ? newChildName : null,
    p_child_source_row: sourceRow(),
    p_session_source_row: sourceRow(),
    p_session: session as unknown as Json,
  });
  if (error || !data) {
    if (error?.code === "23503" || error?.message.includes("Hospital child ID was not found")) return { ok:false,error:"That hospital child ID was not found." };
    if (error?.code === "23505") return { ok:false,error:"That child name or entry reference already exists. Check the records and try again." };
    if (error?.code === "42501") return { ok:false,error:"Saving is blocked. Apply the Hospital Sessions test migration first." };
    return { ok:false,error:"Could not save the hospital session. Check the connection and try again." };
  }
  updateTag("hospital-sessions"); revalidatePath("/hospital");
  return { ok:true,childId:data };
}

export async function loadHospitalRecords(filters: Record<string,string>, search:string, page:number) {
  const allowed: HospitalFilters = { month: MONTHS.includes(filters.month as typeof MONTHS[number]) ? filters.month : "", hospital: HOSPITAL_FILTERS.includes(filters.hospital as typeof HOSPITAL_FILTERS[number]) ? filters.hospital : "" };
  return getHospitalRecords(allowed, search.slice(0,100), Math.max(1,page));
}
