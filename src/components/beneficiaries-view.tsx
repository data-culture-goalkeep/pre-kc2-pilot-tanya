"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardWorkspace, type DashboardChart, type DashboardFilter } from "@/components/dashboard-workspace";
import { BeneficiaryForm } from "@/components/forms/beneficiary-form";
import { SaveToast } from "@/components/save-toast";
import { HOSPITALS, PROGRAMS, STATUSES, type BeneficiaryFilters } from "@/lib/beneficiaries";
import { loadBeneficiaryRecords } from "@/lib/actions/beneficiaries";
import type { BeneficiaryChartRow, BeneficiaryDashboardSummary } from "@/lib/queries/beneficiary-dashboard";

const CHARTS: Array<{ name: string; title: string; kind: DashboardChart["kind"] }> = [
  { name: "program", title: "By program", kind: "bar" },
  { name: "status", title: "By status", kind: "donut" },
  { name: "gender", title: "By gender", kind: "donut" },
  { name: "age_group", title: "By age group", kind: "bar" },
  { name: "primary_diagnosis", title: "Top primary diagnoses", kind: "horizontal" },
  { name: "hospital", title: "By hospital", kind: "bar" },
];
const RECORD_COLUMNS = [
  { key: "beneficiary_id", label: "Beneficiary ID" }, { key: "name_of_child", label: "Name" },
  { key: "program", label: "Program" }, { key: "date_of_birth", label: "Date of birth" },
  { key: "status", label: "Status" }, { key: "primary_mobile_no", label: "Primary phone" },
  { key: "location", label: "Location" },
];

export function BeneficiariesView({ filters, summary, charts, chartError }: { filters: BeneficiaryFilters; summary: BeneficiaryDashboardSummary | null; charts: BeneficiaryChartRow[]; chartError?: string }) {
  const router = useRouter();
  const [, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const filterItems: DashboardFilter[] = [
    { key: "program", label: "Program", value: filters.program, options: PROGRAMS },
    { key: "status", label: "Status", value: filters.status, options: STATUSES },
    { key: "gender", label: "Gender", value: filters.gender, type: "text", placeholder: "Any gender value" },
    { key: "hospital", label: "Hospital", value: filters.hospital, options: HOSPITALS },
  ];
  const chartData = CHARTS.map((chart) => ({
    ...chart,
    rows: charts.filter((item) => item.chart_name === chart.name).map((item) => ({ label: item.label ?? "Unknown", value: item.value ?? 0 })),
    exportUrl: `/beneficiaries/charts/export?chart=${chart.name}`,
  }));
  return <>
    <DashboardWorkspace
      title="Beneficiaries"
      description="Registered children and their program details."
      path="/beneficiaries"
      filters={filterItems}
      scores={[
        { label: "Total beneficiaries", value: summary?.total_count ?? "—", tone: "pink" },
        { label: "Active", value: summary?.active_count ?? "—", tone: "blue" },
        { label: "Exited / inactive", value: summary?.exited_count ?? "—", tone: "purple" },
      ]}
      charts={chartData}
      addLabel="Beneficiary"
      addDescription="Enter a child’s details to register a beneficiary."
      addForm={(close) => <BeneficiaryForm onBusyChange={setSaving} onCancel={close} onSaved={() => { close(); setSavedAt(Date.now()); router.refresh(); }} />}
      recordColumns={RECORD_COLUMNS}
      recordKey="beneficiary_id"
      recordsExportUrl="/beneficiaries/export"
      loadRecords={loadBeneficiaryRecords}
      chartError={chartError}
    />
    <SaveToast savedAt={savedAt} />
  </>;
}
