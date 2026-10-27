import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isValidLoginEmail } from "@/lib/auth/allowed-login-domain";

type EmailAction = "sign-in" | "reset-password";

function withCookies(response: NextResponse, cookieResponse: NextResponse) {
  for (const cookie of cookieResponse.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { action?: EmailAction; email?: string; password?: string } | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ message: "Sign-in is not configured. Contact the dashboard administrator." }, { status: 503 });
  }
  if (!isValidLoginEmail(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  if (body?.action === "sign-in" && !password) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }
  if (body?.action !== "sign-in" && body?.action !== "reset-password") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
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

  if (body.action === "reset-password") {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/auth/recovery", request.url).toString(),
    });
    if (error) {
      return withCookies(NextResponse.json({ message: "Could not send a password reset email. Please try again." }, { status: 400 }), cookieResponse);
    }
    return withCookies(NextResponse.json({ message: "If the address is eligible, a password reset email has been sent." }), cookieResponse);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return withCookies(NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 }), cookieResponse);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !isValidLoginEmail(user?.email)) {
    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The protected routes still reject this session if local cleanup fails.
      }
    }
    return withCookies(NextResponse.json({ message: "Could not verify your sign-in. Please try again." }, { status: 403 }), cookieResponse);
  }

  return withCookies(NextResponse.json({ redirectTo: "/" }), cookieResponse);
}
