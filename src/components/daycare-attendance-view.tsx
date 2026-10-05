"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace, type DashboardChart, type DashboardFilter } from "@/components/dashboard-workspace";
import { DaycareAttendanceForm } from "@/components/forms/daycare-attendance-form";
import { SaveToast } from "@/components/save-toast";
import { loadDaycareRecords, saveDaycareAttendanceGrid } from "@/lib/actions/daycare";
import { ATTENDANCE_CODES, ATTENDANCE_PROGRAMS, financialYearOptions, MONTHS, type DaycareFilters } from "@/lib/daycare";
import type { DaycareChartRow, DaycareGridRow, DaycareSummary } from "@/lib/queries/daycare";

const CHARTS: Array<{ name: string; title: string; kind: DashboardChart["kind"] }> = [
  { name: "monthly_attendance", title: "Monthly attendance %", kind: "line" },
  { name: "program", title: "By program", kind: "bar" },
  { name: "attendance_band", title: "Attendance bands", kind: "bar" },
  { name: "quarterly", title: "Quarterly inputs and outputs", kind: "bar" },
];
const COLUMNS = [{ key: "beneficiary_id", label: "Beneficiary ID" }, { key: "name", label: "Name" }, { key: "program", label: "Program" }, { key: "month", label: "Month" }, { key: "financial_year", label: "Financial year" }, { key: "total_present", label: "Days present" }];
const dayKey = (day: number) => `day_${String(day).padStart(2, "0")}`;

export function DaycareAttendanceView({ filters, summary, charts, gridRows, gridError, chartError }: { filters: DaycareFilters; summary: DaycareSummary | null; charts: DaycareChartRow[]; gridRows: DaycareGridRow[]; gridError?: string; chartError?: string }) {
  const router = useRouter();
  const [, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const chartData = CHARTS.map((chart) => ({ ...chart, rows: charts.filter((row) => row.chart_name === chart.name).map((row) => ({ label: row.label, value: Number(row.value), series: row.series ?? undefined })), exportUrl: "" }));
  const filterItems: DashboardFilter[] = [
    { key: "month", label: "Month", value: filters.month, options: MONTHS, allowAll: false },
    { key: "financial_year", label: "Financial year", value: filters.financial_year, options: financialYearOptions(filters.financial_year), allowAll: false },
    { key: "program", label: "Program", value: filters.program, options: ATTENDANCE_PROGRAMS, allowAll: false },
  ];
  return <>
    <DashboardWorkspace title="Daycare Attendance" description="Monthly attendance and quarterly support, summarized from source records." path="/attendance" filters={filterItems}
      scores={[
        { label: `Average attendance (${filters.month})`, value: summary ? `${Number(summary.average_attendance_percent).toFixed(1)}%` : "—", tone: "pink" },
        { label: "Children with data this month", value: summary?.children_with_data ?? "—", tone: "blue" },
        { label: "Children below 50%", value: summary?.children_below_50 ?? "—", tone: "purple" },
      ]}
      charts={chartData} addLabel="Attendance row" addDescription="Enter one monthly attendance row for an existing beneficiary."
      addForm={(close) => <DaycareAttendanceForm close={close} onBusyChange={setBusy} onSaved={() => { close(); setSavedAt(Date.now()); router.refresh(); }} />}
      recordColumns={COLUMNS} recordKey="attendance_id" recordsExportUrl="/attendance/export" loadRecords={loadDaycareRecords} chartError={chartError}
      afterCharts={<AttendanceGrid filters={filters} rows={gridRows} error={gridError} onSaved={() => { setSavedAt(Date.now()); router.refresh(); }} />} />
    <SaveToast savedAt={savedAt} />
  </>;
}

function AttendanceGrid({ filters, rows, error, onSaved }: { filters: DaycareFilters; rows: DaycareGridRow[]; error?: string; onSaved: () => void }) {
  const initial = useMemo(() => Object.fromEntries(rows.map((row) => [row.beneficiary_id, Object.fromEntries(Array.from({ length: 31 }, (_, index) => [dayKey(index + 1), String(row[dayKey(index + 1)] ?? "")]))])), [rows]);
  const [values, setValues] = useState<Record<string, Record<string, string>>>(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [errorText, setErrorText] = useState(error ?? "");
  const [pending, startTransition] = useTransition();
  const calendarYear = Number(filters.financial_year.slice(0, 4)) + (MONTHS.indexOf(filters.month as typeof MONTHS[number]) < 3 ? 1 : 0);
  const daysInMonth = new Date(calendarYear, MONTHS.indexOf(filters.month as typeof MONTHS[number]) + 1, 0).getDate();

  function change(id: string, day: string, value: string) {
    setValues((previous) => ({ ...previous, [id]: { ...previous[id], [day]: value } }));
    setDirty((previous) => new Set(previous).add(id));
  }
  function save() {
    if (pending || dirty.size === 0) return;
    const changes = [...dirty].map((beneficiary_id) => ({ beneficiary_id, values: values[beneficiary_id] ?? {} }));
    setErrorText("");
    startTransition(async () => {
      const result = await saveDaycareAttendanceGrid(filters, changes);
      if (!result.ok) { setErrorText(result.error ?? "Could not save attendance."); return; }
      setDirty(new Set());
      onSaved();
    });
  }
  return <section aria-label="Editable monthly attendance" className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Monthly attendance grid</h2><p className="mt-1 text-xs text-muted-foreground">Choose P, A, H, NA, or blank. Days outside this month are disabled.</p></div><button type="button" onClick={save} disabled={pending || dirty.size === 0 || Boolean(error)} className="min-h-10 rounded-lg bg-brand-pink px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : `Save${dirty.size ? ` (${dirty.size})` : ""}`}</button></div>
    {errorText ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorText}</p> : null}
    <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
      <table className="min-w-max border-separate border-spacing-0 text-xs"><thead className="sticky top-0 z-20 bg-muted"><tr><th className="sticky left-0 z-30 min-w-32 border-b border-r bg-muted px-3 py-3 text-left">Beneficiary ID</th><th className="sticky left-32 z-30 min-w-48 border-b border-r bg-muted px-3 py-3 text-left">Beneficiary name</th>{Array.from({ length: 31 }, (_, i) => <th key={i} className="min-w-16 border-b px-2 py-3 text-center">{i + 1}</th>)}</tr></thead>
        <tbody>{rows.map((row) => { const duplicate = row.duplicate_count > 1; return <tr key={row.beneficiary_id} className="odd:bg-card even:bg-muted/30"><th scope="row" className="sticky left-0 z-10 border-r border-b bg-inherit px-3 py-2 text-left font-medium">{row.beneficiary_id}{duplicate ? <span className="ml-1 text-destructive" title="Duplicate source rows; editing is disabled">!</span> : null}</th><td className="sticky left-32 z-10 border-r border-b bg-inherit px-3 py-2">{row.name_of_child || "—"}</td>{Array.from({ length: 31 }, (_, i) => { const key = dayKey(i + 1); const outside = i + 1 > daysInMonth; return <td key={key} className={`border-b px-1 py-1 ${outside ? "bg-muted/80" : ""}`}><select aria-label={`${row.beneficiary_id} day ${i + 1}`} value={values[row.beneficiary_id]?.[key] ?? ""} disabled={outside || duplicate || pending || Boolean(error)} onChange={(event) => change(row.beneficiary_id, key, event.target.value)} className="min-h-9 w-14 rounded border border-input bg-card px-1 text-center disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"><option value="">—</option>{ATTENDANCE_CODES.map((code) => <option key={code}>{code}</option>)}</select></td>; })}</tr>; })}</tbody>
      </table>
      {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">No beneficiaries match this program.</p>}
    </div>
    {rows.some((row) => row.duplicate_count > 1) ? <p className="text-xs text-destructive">Some rows have duplicate attendance records for this month. They are read-only until the duplicate source rows are reconciled.</p> : null}
  </section>;
}
