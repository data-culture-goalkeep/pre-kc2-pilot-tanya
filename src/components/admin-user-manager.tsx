"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type ManagedUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  providers: string[];
  protectedAdmin: boolean;
};

type UsersResponse = { users?: ManagedUser[]; message?: string };

function isSuspended(user: ManagedUser) {
  return Boolean(user.bannedUntil && Date.parse(user.bannedUntil) > Date.now());
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function AdminUserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");

  const loadUsers = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json() as UsersResponse;
      if (!response.ok) throw new Error(result.message ?? "Could not load users.");
      setUsers(result.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not send the invitation.");
      setMessage(result.message ?? "Invitation sent.");
      setEmail("");
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Could not send the invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateAccess(user: ManagedUser, action: "revoke" | "restore") {
    if (action === "revoke" && !window.confirm(`Suspend dashboard access for ${user.email}? You can restore it later.`)) return;
    setMessage("");
    setError("");
    setPendingUserId(user.id);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not update user access.");
      setMessage(result.message ?? "User access updated.");
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update user access.");
    } finally {
      setPendingUserId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Invite a user</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Supabase will email an invitation link to this address. New public sign-ups stay disabled.
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="invite-email" className="sr-only">Email address</label>
          <input
            id="invite-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-lg bg-brand-pink px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </section>

      {message ? <p role="status" className="rounded-lg border border-brand-light-blue bg-brand-light-blue/40 p-3 text-sm">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Suspend access without deleting the account.</p>
          </div>
          <button
            type="button"
            onClick={() => { setIsLoading(true); void loadUsers(); }}
            disabled={isLoading}
            className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        {isLoading ? <p className="p-5 text-sm text-muted-foreground">Loading accounts…</p> : users.length ? (
          <ul className="divide-y divide-border">
            {users.map((user) => {
              const suspended = isSuspended(user);
              return (
                <li key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.email || "Email unavailable"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.protectedAdmin ? "Admin" : suspended ? "Access suspended" : "Active"}
                      {" · "}Sign-in: {formatDate(user.lastSignInAt)}
                    </p>
                  </div>
                  {user.protectedAdmin ? <span className="text-xs text-muted-foreground">Admin access is configured in Vercel</span> : (
                    <button
                      type="button"
                      disabled={pendingUserId === user.id}
                      onClick={() => void updateAccess(user, suspended ? "restore" : "revoke")}
                      className="min-h-10 shrink-0 rounded-lg border border-border px-3 text-sm font-medium hover:bg-brand-light-blue/30 disabled:opacity-50"
                    >
                      {pendingUserId === user.id ? "Saving…" : suspended ? "Restore access" : "Suspend access"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <p className="p-5 text-sm text-muted-foreground">No accounts found.</p>}
      </section>
    </div>
  );
}
