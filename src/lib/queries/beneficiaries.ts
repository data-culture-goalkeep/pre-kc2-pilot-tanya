import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readAllBeneficiaries } from "@/lib/beneficiaries-store";
import { DATA_REVALIDATE_SECONDS } from "@/lib/beneficiaries";

export const BENEFICIARIES_CACHE_TAG = "beneficiaries";
export const getBeneficiaries = unstable_cache(
  async () => readAllBeneficiaries(createServerSupabaseClient()),
  ["beneficiaries-v1"],
  { revalidate: DATA_REVALIDATE_SECONDS, tags: [BENEFICIARIES_CACHE_TAG] },
);
