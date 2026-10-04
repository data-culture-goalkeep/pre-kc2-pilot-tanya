"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-lg border border-border bg-card p-6"><h1 className="text-lg font-semibold">The beneficiaries page could not be displayed</h1><p className="mt-2 text-muted-foreground">Please try again.</p><button type="button" onClick={reset} className="mt-4 min-h-11 rounded-lg border border-border px-4 font-medium">Try again</button></div>;
}
