"use client";

import { useState } from "react";

export function ExportButton({ url, filename, disabled = false }: { url: string; filename: string; disabled?: boolean }) {
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
  return <div><button type="button" disabled={disabled || busy} onClick={download} className="min-h-11 rounded-lg border border-border bg-card px-4 font-medium hover:bg-brand-light-blue/30 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Exporting…" : "Export CSV"}</button>{error && <p role="alert" className="mt-2 max-w-sm text-xs text-destructive">{error}</p>}</div>;
}
