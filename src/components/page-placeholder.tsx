import type { NavigationItem } from "@/lib/navigation";

export function PagePlaceholder({ page }: { page: NavigationItem }) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{page.label}</h1>
        <p className="mt-2 text-muted-foreground">{page.description}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <span className="inline-block rounded-full bg-brand-light-blue px-3 py-1 text-xs font-medium">Coming soon</span>
        <p className="mt-4 leading-relaxed text-muted-foreground">This page will be added in an upcoming feature. There are no program records to display here yet.</p>
      </div>
    </section>
  );
}
