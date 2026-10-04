"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace, type DashboardChart, type DashboardFilter } from "@/components/dashboard-workspace";
import { DaycareAttendanceForm } from "@/components/forms/daycare-attendance-form";
import { SaveToast } from "@/components/save-toast";
import { loadDaycareRecords } from "@/lib/actions/daycare";
import { ATTENDANCE_PROGRAMS, MONTHS, type DaycareFilters } from "@/lib/daycare";
import type { DaycareChartRow, DaycareSummary } from "@/lib/queries/daycare";

const CHARTS: Array<{ name: string; title: string; kind: DashboardChart["kind"] }> = [
  { name: "monthly_attendance", title: "Monthly attendance %", kind: "line" },
  { name: "program", title: "By program", kind: "bar" },
  { name: "attendance_band", title: "Attendance bands", kind: "bar" },
  { name: "quarterly", title: "Quarterly inputs and outputs", kind: "bar" },
];
const COLUMNS = [
  { key: "beneficiary_id", label: "Beneficiary ID" }, { key: "name", label: "Name" },
  { key: "program", label: "Program" }, { key: "month", label: "Month" },
  { key: "financial_year", label: "Financial year" }, { key: "total_present", label: "Days present" },
];

export function DaycareAttendanceView({ filters, summary, charts, chartError }: { filters: DaycareFilters; summary: DaycareSummary | null; charts: DaycareChartRow[]; chartError?: string }) {
  const router = useRouter();
  const [, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const chartData = CHARTS.map((chart) => ({ ...chart, rows: charts.filter((row) => row.chart_name === chart.name).map((row) => ({ label: row.label, value: Number(row.value), series: row.series ?? undefined })), exportUrl: `/attendance/charts/export?chart=${chart.name}` }));
  const filterItems: DashboardFilter[] = [
    { key: "month", label: "Month", value: filters.month, options: MONTHS },
    { key: "program", label: "Program", value: filters.program, options: ATTENDANCE_PROGRAMS },
    { key: "beneficiary", label: "Beneficiary", value: filters.beneficiary, type: "text", placeholder: "ID or name" },
  ];
  return <>
    <DashboardWorkspace title="Daycare Attendance" description="Monthly attendance and quarterly support, summarized from source records." path="/attendance" filters={filterItems}
      scores={[
        { label: `Average attendance (${filters.month || "all months"})`, value: summary ? `${Number(summary.average_attendance_percent).toFixed(1)}%` : "—", tone: "pink" },
        { label: "Children with data this month", value: summary?.children_with_data ?? "—", tone: "blue" },
        { label: "Children below 50%", value: summary?.children_below_50 ?? "—", tone: "purple" },
      ]}
      charts={chartData} addLabel="Attendance row" addDescription="Enter one monthly attendance row for an existing beneficiary."
      addForm={(close) => <DaycareAttendanceForm close={close} onBusyChange={setBusy} onSaved={() => { close(); setSavedAt(Date.now()); router.refresh(); }} />}
      recordColumns={COLUMNS} recordKey="attendance_id" recordsExportUrl="/attendance/export" loadRecords={loadDaycareRecords} chartError={chartError} />
    <SaveToast savedAt={savedAt} />
  </>;
}
