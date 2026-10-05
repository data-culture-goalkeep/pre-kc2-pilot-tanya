"use client";

import { useState, useTransition } from "react";
import { saveDaycareAttendance } from "@/lib/actions/daycare";
import { MONTHS, currentIndiaMonth } from "@/lib/daycare";

const daysByMonth: Record<string, number> = { January: 31, February: 28, March: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31 };
const currentYear = Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(new Date()));
const currentMonth = currentIndiaMonth();
const defaultFinancialYear = `${currentMonth === "January" || currentMonth === "February" || currentMonth === "March" ? currentYear - 1 : currentYear}-${String((currentMonth === "January" || currentMonth === "February" || currentMonth === "March" ? currentYear : currentYear + 1) % 100).padStart(2,"0")}`;
const INPUT = "mt-2 min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm";

export function DaycareAttendanceForm({ close, onBusyChange, onSaved }: { close: () => void; onBusyChange: (busy: boolean) => void; onSaved: () => void }) {
  const [month, setMonth] = useState(currentMonth);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget);
    onBusyChange(true); setError("");
    startTransition(async () => {
      try { const result = await saveDaycareAttendance(data); if (!result.ok) { setError(result.error ?? "Could not save this entry."); return; } onSaved(); }
      catch { setError("Could not confirm the save. Check the records before trying again."); }
      finally { onBusyChange(false); }
    });
  }
  const year = Number(String(defaultFinancialYear).slice(0,4));
  const maxDays = daysByMonth[month] + Number(month === "February" && year % 4 === 0);
  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
      <p className="text-xs text-muted-foreground">One row records one beneficiary’s attendance for a month. Choose P (present), NA (not applicable), or leave a day blank.</p>
      <label className="block text-sm font-medium">Beneficiary ID *<input name="beneficiary_id" required maxLength={100} placeholder="Enter an existing beneficiary ID" className={INPUT} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Month *<select name="month" value={month} onChange={(event) => setMonth(event.target.value)} className={INPUT}>{MONTHS.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-medium">Financial year *<input name="financial_year" required pattern="\d{4}-\d{2}" defaultValue={defaultFinancialYear} className={INPUT} /></label></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <label key={day} className="text-xs font-medium">Day {String(day).padStart(2,"0")}<select name={`day_${String(day).padStart(2,"0")}`} disabled={pending || day > maxDays} defaultValue="" className={INPUT}><option value="">—</option><option value="P">P</option><option value="NA">NA</option></select></label>)}</div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </div>
    <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-lg border border-border px-4 font-medium">Cancel</button><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-brand-pink px-4 font-semibold text-primary-foreground">{pending ? "Saving…" : "Save entry"}</button></div>
  </form>;
}
