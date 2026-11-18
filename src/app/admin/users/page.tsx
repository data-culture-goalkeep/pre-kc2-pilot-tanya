import { notFound } from "next/navigation";
import { AdminUserManager } from "@/components/admin-user-manager";
import { isCurrentUserAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (!await isCurrentUserAdmin()) notFound();

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple">Happy Feet Home</p>
        <h1 className="mt-2 text-2xl font-semibold">User access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite people by email and suspend or restore access for existing accounts.
        </p>
      </div>
      <AdminUserManager />
    </section>
  );
}
