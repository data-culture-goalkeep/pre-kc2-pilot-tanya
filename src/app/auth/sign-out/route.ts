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

export async function POST(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.redirect(loginUrl, 303);
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

  try {
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: "local" });
  } catch {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Continue to the login page even if Auth is temporarily unavailable.
    }
  }

  return redirectWithCookies(NextResponse.redirect(loginUrl, 303), cookieResponse);
}
