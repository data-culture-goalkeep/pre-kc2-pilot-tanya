"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

export type DashboardFilter = { key: string; label: string; value: string; type?: "select" | "text"; options?: readonly string[]; placeholder?: string };
export type DashboardChart = { name: string; title: string; kind: "bar" | "horizontal" | "donut" | "line"; rows: Array<{ label: string; value: number; series?: string }> ; exportUrl: string };
export type DashboardRecord = Record<string, string | number | boolean | null | undefined>;
export type RecordPage = { rows: DashboardRecord[]; total: number; page: number; pageCount: number };
export type LoadRecords = (filters: Record<string, string>, search: string, page: number) => Promise<RecordPage>;

type Props = {
  title: string; description: string; path: string; filters: DashboardFilter[];
  scores: Array<{ label: string; value: string | number; tone: "pink" | "blue" | "purple" }>;
  charts: DashboardChart[]; addLabel: string; addDescription: string; addForm: (close: () => void) => ReactNode;
  recordColumns: Array<{ key: string; label: string }>; recordKey: string;
  recordsExportUrl: string; loadRecords: LoadRecords; recordsError?: string; chartError?: string;
};

const TONES = { pink: "bg-brand-pink text-primary-foreground", blue: "bg-brand-light-blue text-foreground", purple: "bg-brand-purple text-foreground" } as const;

export function DashboardWorkspace(props: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const { loadRecords } = props;
  const queryString = new URLSearchParams(props.filters.filter((filter) => filter.value).map((filter) => [filter.key, filter.value])).toString();
  const filterKey = queryString;
  const query = Object.fromEntries(new URLSearchParams(filterKey).entries());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [recordPage, setRecordPage] = useState<RecordPage>({ rows: [], total: 0, page: 1, pageCount: 1 });
  const [recordsBusy, setRecordsBusy] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  function updateFilter(key: string, value: string) {
    const next = { ...query };
    if (value) next[key] = value; else delete next[key];
    const params = new URLSearchParams(next).toString();
    startTransition(() => router.replace(params ? `${props.path}?${params}` : props.path));
  }

  useEffect(() => {
    if (!recordsOpen) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) { setRecordsBusy(true); setRecordsError(""); }
      return loadRecords(Object.fromEntries(new URLSearchParams(filterKey).entries()), search, page);
    }).then((result) => { if (active) setRecordPage(result); })
      .catch(() => { if (active) setRecordsError("Records could not be loaded. Please try again."); })
      .finally(() => { if (active) setRecordsBusy(false); });
    return () => { active = false; };
  }, [recordsOpen, filterKey, search, page, loadRecords]);

  const columns = props.recordColumns as Array<{ key: keyof DashboardRecord; label: string }>;
  const rowKey = props.recordKey as keyof DashboardRecord;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-semibold">{props.title}</h1><p className="mt-2 text-muted-foreground">{props.description}</p></div>
      <button type="button" onClick={() => { setRecordsOpen(true); setPage(1); }} className="min-h-11 rounded-lg border border-border bg-card px-4 font-medium hover:bg-brand-light-blue/30">View records</button>
    </div>

    <section aria-label={`${props.title} filters`} className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Filters</h2><button type="button" onClick={() => startTransition(() => router.replace(`${props.path}?clear=all`))} disabled={!queryString || isNavigating} className="min-h-9 rounded-lg px-3 text-sm font-medium text-brand-purple underline-offset-4 hover:underline disabled:opacity-40">Clear filters</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {props.filters.map((filter) => <label key={filter.key} className="text-xs font-medium text-muted-foreground">{filter.label}
          {filter.type === "text" ? <input value={filter.value} onChange={(event) => updateFilter(filter.key, event.target.value)} placeholder={filter.placeholder} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground" />
            : <select value={filter.value} onChange={(event) => updateFilter(filter.key, event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground"><option value="">All {filter.label.toLowerCase()}</option>{filter.options?.map((option) => <option key={option}>{option}</option>)}</select>}
        </label>)}
      </div>
    </section>

    <section aria-label={`${props.title} summary`} className="grid gap-3 sm:grid-cols-3">
      {props.scores.map((score) => <div key={score.label} className={`rounded-xl p-5 ${TONES[score.tone]}`}><p className="text-sm font-medium">{score.label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{typeof score.value === "number" ? score.value.toLocaleString("en-IN") : score.value}</p></div>)}
    </section>

    {props.chartError ? <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-4 text-sm text-destructive">Charts could not be loaded: {props.chartError}</div> : <section aria-label={`${props.title} charts`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.charts.map((chart) => <article key={chart.name} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <header className="mb-4 flex min-h-10 items-center justify-between gap-2"><h2 className="text-sm font-semibold">{chart.title}</h2><div className="flex items-center gap-1"><button type="button" onClick={() => setAddOpen(true)} className="min-h-9 rounded-lg px-2 text-sm font-semibold text-brand-pink hover:bg-brand-soft-pink/30">+ {props.addLabel}</button><ExportButton url={`${chart.exportUrl}${queryString ? `&${queryString}` : ""}`} filename={`${props.path.slice(1)}-${chart.name}.csv`} iconOnly label={`Export ${chart.title} data as CSV`} /></div></header>
        <Chart chart={chart} />
      </article>)}
    </section>}

    <Sheet open={addOpen} onOpenChange={setAddOpen}><SheetContent className="sm:max-w-2xl"><div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5"><div><SheetTitle className="text-lg font-semibold">Add {props.addLabel.toLowerCase()}</SheetTitle><SheetDescription className="mt-2 text-sm text-muted-foreground">{props.addDescription}</SheetDescription></div><SheetClose asChild><button type="button" aria-label="Close add form" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-xl">×</button></SheetClose></div>{props.addForm(() => setAddOpen(false))}</SheetContent></Sheet>

    <Sheet open={recordsOpen} onOpenChange={setRecordsOpen}><SheetContent className="sm:max-w-6xl">
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5"><div><SheetTitle className="text-lg font-semibold">{props.title} records</SheetTitle><SheetDescription className="mt-2 text-sm text-muted-foreground">Filtered records are loaded a page at a time.</SheetDescription></div><div className="flex items-center gap-2"><ExportButton url={`${props.recordsExportUrl}${queryString ? `?${queryString}` : ""}`} filename={`${props.path.slice(1)}-records.csv`} /><SheetClose asChild><button type="button" aria-label="Close records" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-xl">×</button></SheetClose></div></div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><label className="text-xs font-medium text-muted-foreground">Search records<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search current records" className="mt-2 min-h-11 w-full rounded-lg border border-input px-3 text-sm text-foreground" /></label><p className="self-end pb-3 text-xs text-muted-foreground">Current filters: {Object.keys(query).length ? Object.entries(query).map(([key, value]) => `${key}: ${value}`).join(" · ") : "none"}</p></div>
        {recordsError ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{recordsError}</p> : <div aria-busy={recordsBusy}><DataTable rows={recordPage.rows} columns={columns} rowKey={rowKey} caption={`${props.title} records`} emptyMessage={recordsBusy ? "Loading records…" : "No records match these filters."} /></div>}
      </div>
      <div className="flex items-center justify-between border-t border-border px-6 py-3"><p className="text-xs text-muted-foreground">{recordPage.total ? `${(recordPage.page - 1) * 20 + 1}–${Math.min(recordPage.page * 20, recordPage.total)} of ${recordPage.total}` : "0 records"}</p><div className="flex items-center gap-3"><button type="button" disabled={recordsBusy || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-10 rounded-lg border border-border px-3 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-muted-foreground">Page {recordPage.page} of {recordPage.pageCount}</span><button type="button" disabled={recordsBusy || page >= recordPage.pageCount} onClick={() => setPage((value) => Math.min(recordPage.pageCount, value + 1))} className="min-h-10 rounded-lg border border-border px-3 text-xs disabled:opacity-40">Next</button></div></div>
    </SheetContent></Sheet>
  </div>;
}

function Chart({ chart }: { chart: DashboardChart }) {
  const rows = chart.rows;
  if (!rows.length) return <p className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">No chart data available.</p>;
  const max = Math.max(1, ...rows.map((row) => row.value));
  const colors = ["#EC4C9B", "#D3E3FD", "#B9A7D9", "#F7B6D2", "#8E6BB7", "#F08ABA", "#A8C7FA"];
  if (chart.kind === "donut") {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return <div className="flex min-h-56 flex-wrap items-center justify-center gap-4"><svg viewBox="0 0 200 200" role="img" aria-label={`${chart.title}, ${total} records`} className="h-44 w-44 -rotate-90"><circle cx="100" cy="100" r="64" fill="none" stroke="#eeeaf1" strokeWidth="25" />{rows.map((row, index) => { const length = total ? row.value / total * 402 : 0; const dashOffset = rows.slice(0, index).reduce((sum, before) => sum + (total ? before.value / total * 402 : 0), 0); return <circle key={row.label} cx="100" cy="100" r="64" fill="none" stroke={colors[index % colors.length]} strokeWidth="25" strokeDasharray={`${length} 402`} strokeDashoffset={-dashOffset} />; })}</svg><ul className="space-y-2 text-xs">{rows.map((row, index) => <li key={row.label} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />{row.label}: {row.value}</li>)}</ul></div>;
  }
  if (chart.kind === "line") return <svg viewBox="0 0 420 230" role="img" aria-label={chart.title} className="h-56 w-full"><line x1="36" y1="190" x2="410" y2="190" stroke="#cbd5e1" />{rows.map((row, index) => { const x = 40 + index * 360 / Math.max(1, rows.length - 1); const y = 182 - row.value / max * 150; const previous = rows[index - 1]; const px = 40 + (index - 1) * 360 / Math.max(1, rows.length - 1); const py = 182 - (previous?.value ?? 0) / max * 150; return <g key={row.label}>{index > 0 ? <line x1={px} y1={py} x2={x} y2={y} stroke={colors[0]} strokeWidth="3" /> : null}<circle cx={x} cy={y} r="4" fill={colors[0]} /><text x={x} y="210" textAnchor="middle" fontSize="9" fill="#605a66">{row.label}</text></g>; })}</svg>;
  return <div className="space-y-3 py-3">{rows.map((row, index) => <div key={`${row.label}-${row.series ?? ""}`} className={chart.kind === "bar" ? "min-w-0" : "grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-2 text-xs"}><div className="flex justify-between gap-2 text-xs"><span className="truncate" title={row.label}>{chart.kind === "bar" ? row.label : `${row.label}${row.series ? ` · ${row.series}` : ""}`}</span>{chart.kind === "bar" ? <span className="tabular-nums">{row.value}</span> : null}</div><div className="mt-1 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(2, row.value / max * 100)}%`, backgroundColor: colors[index % colors.length] }} /></div>{chart.kind !== "bar" ? <span className="tabular-nums">{row.value}</span> : null}</div>)}</div>;
}
