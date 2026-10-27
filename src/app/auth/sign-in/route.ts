import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function redirectWithCookies(response: NextResponse, cookieResponse: NextResponse) {
  for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
  for (const header of ["Cache-Control", "Expires", "Pragma"]) {
    const value = cookieResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  }
  return response;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("message", "config");
    return NextResponse.redirect(loginUrl);
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", request.url).toString(),
    },
  });

  if (error || !data.url) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("message", "start");
    return redirectWithCookies(NextResponse.redirect(loginUrl), cookieResponse);
  }

  return redirectWithCookies(NextResponse.redirect(data.url), cookieResponse);
}
