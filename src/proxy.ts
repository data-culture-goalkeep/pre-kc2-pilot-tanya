import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAllowedLoginEmail, LOGIN_DOMAIN_ERROR } from "@/lib/auth/allowed-login-domain";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const allowedDomain = process.env.ALLOWED_LOGIN_DOMAIN;

  if (!supabaseUrl || !publishableKey || !allowedDomain) {
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
  if (error || !isAllowedLoginEmail(user?.email, allowedDomain)) {
    if (user) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Fail closed even if sign-out cannot reach the Auth service.
      }
    }

    const loginUrl = new URL("/login", request.url);
    if (user) loginUrl.searchParams.set("message", LOGIN_DOMAIN_ERROR);
    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/", "/beneficiaries/:path*", "/attendance/:path*", "/hospital/:path*", "/assessments/:path*"],
};
