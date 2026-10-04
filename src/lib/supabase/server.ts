import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SUPABASE_REQUEST_TIMEOUT_MS = 10000;

export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel environment variables, then redeploy.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS) }) },
  });
}
