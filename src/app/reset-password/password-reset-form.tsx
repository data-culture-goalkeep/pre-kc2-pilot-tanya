"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = { message?: string; redirectTo?: string };

export function PasswordResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (password !== confirmPassword) {
      setFeedback("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setFeedback(result.message ?? "Could not update the password. Please try again.");
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
    <form onSubmit={submit} className="mt-6 space-y-4">
      {feedback ? <p role="alert" aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{feedback}</p> : null}
      <label className="block text-sm font-medium" htmlFor="new-password">
        New password
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal" />
      </label>
      <label className="block text-sm font-medium" htmlFor="confirm-password">
        Confirm new password
        <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal" />
      </label>
      <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">
        {isSubmitting ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
