"use client";

import { useState } from "react";

export function ExportButton({ url, filename, disabled = false, iconOnly = false, label = "Export CSV" }: { url: string; filename: string; disabled?: boolean; iconOnly?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not export this view. Please try again.");
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl; link.download = filename; document.body.append(link); link.click(); link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not export this view. Please try again.");
    } finally { setBusy(false); }
  }
  return <div className={iconOnly ? "relative" : undefined}><button type="button" disabled={disabled || busy} onClick={download} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined} className={iconOnly ? "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-brand-light-blue/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50" : "min-h-11 rounded-lg border border-border bg-card px-4 font-medium hover:bg-brand-light-blue/30 disabled:cursor-not-allowed disabled:opacity-50"}>{iconOnly ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v4h14v-4" strokeLinecap="round" strokeLinejoin="round" /></svg> : busy ? "Exporting…" : "Export CSV"}</button>{error && <p role="alert" className={iconOnly ? "absolute right-0 top-10 z-10 w-48 rounded-md bg-card p-2 text-xs text-destructive shadow" : "mt-2 max-w-sm text-xs text-destructive"}>{error}</p>}</div>;
}
