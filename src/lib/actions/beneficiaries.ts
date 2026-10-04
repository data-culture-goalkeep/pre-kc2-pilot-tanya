"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { BENEFICIARIES_PATH, type BeneficiaryFilters } from "@/lib/beneficiaries";
import { insertBeneficiary } from "@/lib/beneficiaries-store";
import { BENEFICIARIES_CACHE_TAG } from "@/lib/queries/beneficiaries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBeneficiaryPage } from "@/lib/queries/beneficiary-dashboard";
import { validateBeneficiary, type BeneficiarySaveResult } from "@/lib/validation/beneficiary";

export async function saveBeneficiary(formData: FormData): Promise<BeneficiarySaveResult> {
  const { input, errors } = validateBeneficiary(Object.fromEntries(formData));
  if (Object.keys(errors).length) return { ok: false, error: "Check the highlighted fields.", fieldErrors: errors };
  try {
    await insertBeneficiary(createServerSupabaseClient(), { ...input, beneficiary_id: input.beneficiary_id || `B-${randomUUID()}` });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save the entry. Please try again." };
  }
  // Invalidate the data and route caches after the database confirms the insert.
  updateTag(BENEFICIARIES_CACHE_TAG);
  revalidatePath(BENEFICIARIES_PATH);
  return { ok: true };
}

export async function loadBeneficiaryRecords(filters: Record<string, string>, search: string, page: number) {
  const allowed: BeneficiaryFilters = {
    search: search.slice(0, 100),
    program: filters.program ?? "",
    status: filters.status ?? "",
    gender: filters.gender ?? "",
    hospital: filters.hospital ?? "",
  };
  return getBeneficiaryPage(Math.max(1, page), allowed);
}
