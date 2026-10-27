import { NextRequest, NextResponse } from "next/server";
import {
  AdminAccessError,
  createSupabaseAdminClient,
  isConfiguredAdminEmail,
  requireAdmin,
} from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function accessErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    const message = error.status === 401
      ? "Sign in to manage users."
      : error.status === 403
        ? "You do not have access to user management."
        : "Admin user management is not configured.";
    return NextResponse.json({ message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    { message: "The user request could not be completed. Please try again." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return accessErrorResponse(error);

    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      bannedUntil: user.banned_until ?? null,
      providers: Array.isArray(user.app_metadata?.providers)
        ? user.app_metadata.providers.filter((provider): provider is string => typeof provider === "string")
        : [],
      protectedAdmin: isConfiguredAdminEmail(user.email),
    }));

    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "This request could not be verified." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    action?: unknown;
    email?: unknown;
    userId?: unknown;
  } | null;

  try {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();

    if (body?.action === "invite") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
      }

      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: new URL("/auth/callback", request.url).toString(),
      });
      if (error) {
        return NextResponse.json(
          { message: "The invitation could not be sent. Check whether this email already has an account and try again." },
          { status: 400 },
        );
      }
      return NextResponse.json({ message: `Invitation sent to ${email}.` }, { status: 200 });
    }

    if (body?.action !== "revoke" && body?.action !== "restore") {
      return NextResponse.json({ message: "Choose a valid user action." }, { status: 400 });
    }
    if (typeof body.userId !== "string" || !body.userId) {
      return NextResponse.json({ message: "Choose a user first." }, { status: 400 });
    }

    const { data, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return accessErrorResponse(listError);
    const target = data.users.find((user) => user.id === body.userId);
    if (!target) return NextResponse.json({ message: "That account was not found." }, { status: 404 });
    if (isConfiguredAdminEmail(target.email)) {
      return NextResponse.json({ message: "Admin accounts cannot be changed from this page." }, { status: 400 });
    }

    const banDuration = body.action === "revoke" ? "876000h" : "none";
    const { error } = await supabase.auth.admin.updateUserById(target.id, { ban_duration: banDuration });
    if (error) return accessErrorResponse(error);

    return NextResponse.json({
      message: body.action === "revoke" ? "Access suspended." : "Access restored.",
    });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
