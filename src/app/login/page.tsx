import Link from "next/link";
import { LOGIN_DOMAIN_ERROR } from "@/lib/auth/allowed-login-domain";

type LoginSearchParams = Promise<{ message?: string | string[] }>;

const LOGIN_MESSAGES: Record<string, string> = {
  domain: LOGIN_DOMAIN_ERROR,
  start: "Google sign-in could not be started. Please try again.",
  callback: "Sign-in could not be completed. Please try again.",
  config: "Google sign-in is not configured. Contact the dashboard administrator.",
};

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;
  const rawMessage = Array.isArray(params.message) ? params.message[0] : params.message;
  const message = rawMessage ? LOGIN_MESSAGES[rawMessage] ?? rawMessage : null;

  return (
    <section className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Happy Feet Home</p>
      <h1 className="mt-2 text-xl font-semibold">Sign in to your dashboard</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Use your Goalkeep Google account to continue.
      </p>
      {message ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</p> : null}
      <Link href="/auth/sign-in" className="mt-6 flex min-h-12 items-center justify-center rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground hover:opacity-90">
        Continue with Google
      </Link>
    </section>
  );
}
