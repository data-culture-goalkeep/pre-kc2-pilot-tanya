import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isValidLoginEmail } from "@/lib/auth/allowed-login-domain";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("message", "config");
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headersToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const cookie of cookiesToSet) response.cookies.set(cookie);
        for (const [name, value] of Object.entries(headersToSet ?? {})) response.headers.set(name, value);
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !isValidLoginEmail(user.email)) {
    if (user) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Fail closed even if sign-out cannot reach the Auth service.
      }
    }

    const loginUrl = new URL("/login", request.url);
    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/", "/beneficiaries/:path*", "/attendance/:path*", "/hospital/:path*", "/assessments/:path*"],
};
