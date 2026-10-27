import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isValidLoginEmail } from "@/lib/auth/allowed-login-domain";

function redirectWithCookies(response: NextResponse, cookieResponse: NextResponse) {
  for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

function loginRedirect(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("message", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!code || !supabaseUrl || !publishableKey) {
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
  if (exchangeError) {
    return redirectWithCookies(loginRedirect(request, "callback"), cookieResponse);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !isValidLoginEmail(user?.email)) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Still redirect away from protected pages if the Auth service is unavailable.
    }
    return redirectWithCookies(loginRedirect(request, "callback"), cookieResponse);
  }

  return redirectWithCookies(NextResponse.redirect(new URL("/", request.url)), cookieResponse);
}
