"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type TableColumn } from "@/components/data-table";
import { ExportButton } from "@/components/export-button";
import { BeneficiaryCharts } from "@/components/charts/beneficiary-charts";
import { BeneficiaryForm } from "@/components/forms/beneficiary-form";
import { SaveToast } from "@/components/save-toast";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PROGRAMS, STATUSES, TABLE_PAGE_SIZE, type BeneficiaryFilters, type BeneficiarySummary } from "@/lib/beneficiaries";
import type { BeneficiaryChartRow, BeneficiaryDashboardSummary } from "@/lib/queries/beneficiary-dashboard";

const COLUMNS: TableColumn<BeneficiarySummary>[] = [
  { key: "beneficiary_id", label: "Beneficiary ID" },
  { key: "name_of_child", label: "Name" },
  { key: "program", label: "Program" },
  { key: "date_of_birth", label: "Date of birth", render: (row) => row.date_of_birth ? <time dateTime={row.date_of_birth}>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${row.date_of_birth}T00:00:00Z`))}</time> : "—" },
  { key: "status", label: "Status", render: (row) => row.status ? <span className="rounded-full bg-brand-light-blue px-3 py-1 text-xs">{row.status}</span> : "—" },
  { key: "primary_mobile_no", label: "Primary phone" },
  { key: "location", label: "Location" },
];

type Props = {
  rows: BeneficiarySummary[];
  total: number;
  page: number;
  pageCount: number;
  filters: BeneficiaryFilters;
  summary: BeneficiaryDashboardSummary | null;
  charts: BeneficiaryChartRow[];
  tableError?: string;
  chartError?: string;
};

export function BeneficiariesView({ rows, total, page, pageCount, filters: initialFilters, summary, charts, tableError, chartError }: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [navigating, startTransition] = useTransition();

  function navigate(nextFilters: BeneficiaryFilters, nextPage = 1) {
    const params = new URLSearchParams();
    if (nextFilters.search) params.set("search", nextFilters.search);
    if (nextFilters.program) params.set("program", nextFilters.program);
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    startTransition(() => router.replace(query ? `/beneficiaries?${query}` : "/beneficiaries"));
  }

  function changeFilter(field: keyof BeneficiaryFilters, value: string) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    navigate(next);
  }

  const totalValue = summary?.total_count ?? null;
  const activeValue = summary?.active_count ?? null;
  const exitedValue = summary?.exited_count ?? null;
  const query = new URLSearchParams(filters).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-xl font-semibold">Beneficiaries</h1><p className="mt-2 text-muted-foreground">Registered children and their program details.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportButton url={`/beneficiaries/export?${query}`} filename="beneficiaries.csv" disabled={!!tableError} />
          <Sheet open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
            <SheetTrigger asChild><button type="button" disabled={!!tableError} aria-label="Add beneficiary" className="flex min-h-11 items-center gap-2 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground disabled:opacity-50"><span aria-hidden="true" className="text-xl leading-none">+</span> Add beneficiary</button></SheetTrigger>
            <SheetContent>
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div><SheetTitle className="text-lg font-semibold">Add beneficiary</SheetTitle><SheetDescription className="mt-2 text-sm text-muted-foreground">Enter the child’s details to register a beneficiary.</SheetDescription></div>
                <SheetClose asChild><button type="button" disabled={saving} aria-label="Close add form" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-xl disabled:opacity-50">×</button></SheetClose>
              </div>
              <BeneficiaryForm onBusyChange={setSaving} onCancel={() => setOpen(false)} onSaved={() => { setOpen(false); setSavedAt(Date.now()); router.refresh(); }} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <section aria-label="Beneficiary totals" className="grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Total beneficiaries" value={totalValue} className="bg-brand-pink text-primary-foreground" />
        <ScoreCard label="Active" value={activeValue} className="bg-brand-light-blue text-foreground" />
        <ScoreCard label="Exited / inactive" value={exitedValue} className="bg-brand-purple text-foreground" />
      </section>

      {chartError ? <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-4"><p className="font-medium text-destructive">Beneficiary charts could not be loaded</p><p className="mt-1 text-sm text-muted-foreground">{chartError}</p></div> : <BeneficiaryCharts data={charts} onAdd={() => setOpen(true)} />}

      {tableError ? <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-5"><p className="font-medium text-destructive">Beneficiaries could not be loaded</p><p className="mt-2 text-muted-foreground">{tableError}</p><button type="button" onClick={() => router.refresh()} className="mt-4 min-h-11 rounded-lg border border-border px-4 font-medium">Try again</button></div> : <section aria-label="Beneficiary records" className="rounded-lg border border-border bg-card">
        <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div><label htmlFor="beneficiary-search" className="text-xs font-medium text-muted-foreground">Search</label><input id="beneficiary-search" type="search" value={filters.search} onChange={(event) => changeFilter("search", event.target.value)} placeholder="Search name, ID, phone, or location" className="mt-2 min-h-11 w-full rounded-lg border border-input px-3" /></div>
          <div><label htmlFor="program-filter" className="text-xs font-medium text-muted-foreground">Program</label><select id="program-filter" value={filters.program} onChange={(event) => changeFilter("program", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3"><option value="">All programs</option>{PROGRAMS.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div><label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">Status</label><select id="status-filter" value={filters.status} onChange={(event) => changeFilter("status", event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3"><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></div>
        </div>
        <div aria-live="polite" aria-busy={navigating}>
          {navigating ? <p className="px-4 py-3 text-xs text-muted-foreground">Updating table…</p> : null}
          <DataTable rows={rows} columns={COLUMNS} rowKey="beneficiary_id" caption="Beneficiaries in the current filtered view" emptyMessage={total ? "No beneficiaries match these filters." : "No beneficiaries yet. Add the first entry to get started."} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs text-muted-foreground">{total ? `${(page - 1) * TABLE_PAGE_SIZE + 1}–${Math.min(page * TABLE_PAGE_SIZE, total)} of ${total}` : "0 records"}</p>
          <div className="flex items-center gap-3"><button type="button" disabled={page === 1 || navigating} onClick={() => navigate(filters, page - 1)} className="min-h-11 rounded-lg border border-border px-3 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-muted-foreground">Page {page} of {pageCount}</span><button type="button" disabled={page === pageCount || navigating} onClick={() => navigate(filters, page + 1)} className="min-h-11 rounded-lg border border-border px-3 text-xs disabled:opacity-40">Next</button></div>
        </div>
      </section>}
      <SaveToast savedAt={savedAt} />
    </div>
  );
}

function ScoreCard({ label, value, className }: { label: string; value: number | null; className: string }) {
  return <div className={`rounded-xl p-5 ${className}`}><p className="text-sm font-medium">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{value === null ? "—" : value.toLocaleString("en-IN")}</p></div>;
}
