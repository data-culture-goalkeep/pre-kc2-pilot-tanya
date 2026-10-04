import Link from "next/link";
import { NAVIGATION } from "@/lib/navigation";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-brand-soft-pink bg-brand-soft-pink/30 p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Happy Feet Home</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Welcome to your program dashboard</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">A shared view of the children we support and the programs they take part in.</p>
      </section>
      <section aria-labelledby="programs-heading">
        <h2 id="programs-heading" className="mb-4 text-base font-semibold">Explore programs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {NAVIGATION.map(({ href, label, description }) => (
            <Link key={href} href={href} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-brand-purple hover:bg-brand-light-blue/20 motion-reduce:transition-none">
              <span className="flex items-center justify-between gap-3 text-base font-semibold">{label}<span aria-hidden="true" className="text-muted-foreground">→</span></span>
              <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
              <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Coming soon</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
