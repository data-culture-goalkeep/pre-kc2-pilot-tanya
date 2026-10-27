"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthResponse = { message?: string; redirectTo?: string };

export function LoginForm({ message }: { message: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "reset">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(message);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "sign-in"
          ? { action: "sign-in", email, password }
          : { action: "reset-password", email }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setFeedback(result.message ?? "Sign-in could not be completed. Please try again.");
        return;
      }
      if (mode === "reset") {
        setFeedback(result.message ?? "If the address is eligible, a password reset email has been sent.");
        return;
      }
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    } catch {
      setFeedback("The request could not be completed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <a href="/auth/sign-in" className="flex min-h-12 items-center justify-center rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground hover:opacity-90">
        Continue with Google
      </a>
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" /><span>or</span><span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-sm font-semibold">{mode === "sign-in" ? "Sign in with email" : "Reset your password"}</h2>
        {feedback ? <p role="alert" aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{feedback}</p> : null}
        <label className="block text-sm font-medium" htmlFor="login-email">
          Email
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
          />
        </label>
        {mode === "sign-in" ? (
          <label className="block text-sm font-medium" htmlFor="login-password">
            Password
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
            />
          </label>
        ) : null}
        <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg border border-brand-purple bg-card px-4 font-semibold hover:bg-brand-light-blue/20 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Send reset email"}
        </button>
        {mode === "sign-in" ? (
          <button type="button" onClick={() => { setFeedback(null); setMode("reset"); }} className="text-sm font-medium text-brand-purple underline underline-offset-4">
            Forgot password?
          </button>
        ) : (
          <button type="button" onClick={() => { setFeedback(null); setMode("sign-in"); }} className="text-sm font-medium text-brand-purple underline underline-offset-4">
            Back to sign in
          </button>
        )}
      </form>
      <p className="text-xs leading-relaxed text-muted-foreground">Accounts are created by invitation. Contact your administrator if you need access.</p>
    </div>
  );
}
