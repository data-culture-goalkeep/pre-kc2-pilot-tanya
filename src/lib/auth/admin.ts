import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "tanya@goalkeep.net";

export class AdminAccessError extends Error {
  constructor(readonly status: 401 | 403 | 503) {
    super("Admin access is unavailable.");
    this.name = "AdminAccessError";
  }
}

export function isAdminEmail(email: string | undefined | null) {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
}

async function getAuthenticatedUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies; route handlers can.
        }
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function isCurrentUserAdmin() {
  const user = await getAuthenticatedUser();
  return isAdminEmail(user?.email);
}

export async function requireAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    throw new AdminAccessError(503);
  }
  const user = await getAuthenticatedUser();
  if (!user) throw new AdminAccessError(401);
  if (!isAdminEmail(user.email)) throw new AdminAccessError(403);
  return user;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) throw new AdminAccessError(503);

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function isConfiguredAdminEmail(email: string | undefined | null) {
  return isAdminEmail(email);
}
