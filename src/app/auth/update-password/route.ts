import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isValidLoginEmail } from "@/lib/auth/allowed-login-domain";

function withCookies(response: NextResponse, cookieResponse: NextResponse) {
  for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { password?: string } | null;
  const password = body?.password ?? "";
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ message: "Sign-in is not configured. Contact the dashboard administrator." }, { status: 503 });
  }
  if (password.length < 8) {
    return NextResponse.json({ message: "Use a password with at least 8 characters." }, { status: 400 });
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return withCookies(NextResponse.json({ message: "Your reset link is no longer valid. Request a new one." }, { status: 401 }), cookieResponse);
  }
  if (!isValidLoginEmail(user.email)) {
    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Protected routes also reject invalid sessions.
      }
    }
    return withCookies(NextResponse.json({ message: "Could not verify your account. Please sign in again." }, { status: 403 }), cookieResponse);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return withCookies(NextResponse.json({ message: "Could not update the password. Please try again." }, { status: 400 }), cookieResponse);
  }
  return withCookies(NextResponse.json({ redirectTo: "/" }), cookieResponse);
}
