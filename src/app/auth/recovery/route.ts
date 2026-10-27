import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAllowedLoginEmail, LOGIN_DOMAIN_ERROR } from "@/lib/auth/allowed-login-domain";

function redirectWithCookies(response: NextResponse, cookieResponse: NextResponse) {
  for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

function loginRedirect(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const allowedDomain = process.env.ALLOWED_LOGIN_DOMAIN;
  if (!code || !supabaseUrl || !publishableKey || !allowedDomain) {
    return loginRedirect(request, "callback");
  }

  let cookieResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headersToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        cookieResponse = NextResponse.next({ request });
        for (const cookie of cookiesToSet) cookieResponse.cookies.set(cookie);
        for (const [name, value] of Object.entries(headersToSet ?? {})) cookieResponse.headers.set(name, value);
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return redirectWithCookies(loginRedirect(request, "callback"), cookieResponse);

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isAllowedLoginEmail(user?.email, allowedDomain)) {
    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Protected routes also reject invalid sessions.
      }
    }
    return redirectWithCookies(loginRedirect(request, LOGIN_DOMAIN_ERROR), cookieResponse);
  }

  return redirectWithCookies(NextResponse.redirect(new URL("/reset-password", request.url)), cookieResponse);
}
