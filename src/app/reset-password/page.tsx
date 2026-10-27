import { PasswordResetForm } from "./password-reset-form";

export default function ResetPasswordPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Happy Feet Home</p>
      <h1 className="mt-2 text-xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Enter a new password for your invited account.</p>
      <PasswordResetForm />
    </section>
  );
}
