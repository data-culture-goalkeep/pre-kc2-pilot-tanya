"use client";

import type { BeneficiaryChartRow, ChartName } from "@/lib/queries/beneficiary-dashboard";
import { ExportButton } from "@/components/export-button";

const COLORS = ["#EC4C9B", "#D3E3FD", "#B9A7D9", "#F7B6D2", "#8E6BB7", "#F08ABA", "#A8C7FA", "#D9C9E8"] as const;
const CHARTS: readonly { name: ChartName; title: string; kind: "bar" | "donut" | "horizontal" }[] = [
  { name: "program", title: "By program", kind: "bar" },
  { name: "status", title: "By status", kind: "donut" },
  { name: "gender", title: "By gender", kind: "donut" },
  { name: "age_group", title: "By age group", kind: "bar" },
  { name: "primary_diagnosis", title: "Top primary diagnoses", kind: "horizontal" },
  { name: "hospital", title: "By hospital", kind: "bar" },
];

export function BeneficiaryCharts({ data, onAdd }: { data: BeneficiaryChartRow[]; onAdd: () => void }) {
  return <section aria-label="Beneficiary charts" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {CHARTS.map((chart) => {
      const rows = data.filter((item) => item.chart_name === chart.name).map((item) => ({ label: item.label ?? "Unknown", value: item.value ?? 0 }));
      return <article key={chart.name} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
        <header className="mb-4 flex min-h-10 items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{chart.title}</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onAdd} aria-label={`Add beneficiary from ${chart.title}`} title="Add beneficiary" className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-brand-pink hover:bg-brand-soft-pink/30 focus-visible:outline-2 focus-visible:outline-ring">+</button>
            <ExportButton url={`/beneficiaries/charts/export?chart=${chart.name}`} filename={`beneficiaries-${chart.name}.csv`} iconOnly label={`Export ${chart.title} chart data as CSV`} />
          </div>
        </header>
        <div className="min-h-56">
          {rows.length === 0 ? <p className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">No chart data available.</p>
            : chart.kind === "donut" ? <DonutChart rows={rows} />
              : chart.kind === "horizontal" ? <HorizontalBars rows={rows} />
                : <VerticalBars rows={rows} />}
        </div>
      </article>;
    })}
  </section>;
}

type ChartValue = { label: string; value: number };

function DonutChart({ rows }: { rows: ChartValue[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const circumference = 2 * Math.PI * 66;
  const segmentLengths = rows.map((row) => total ? row.value / total * circumference : 0);
  const segmentOffsets = segmentLengths.map((_, index) => segmentLengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  return <div className="flex min-h-56 flex-wrap items-center justify-center gap-4">
    <svg viewBox="0 0 200 200" role="img" aria-label={`Donut chart showing ${total.toLocaleString()} records`} className="h-44 w-44 shrink-0 -rotate-90">
      <circle cx="100" cy="100" r="66" fill="none" stroke="#F0EEF3" strokeWidth="24" />
      {rows.map((row, index) => <circle key={`${row.label}-${index}`} cx="100" cy="100" r="66" fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="24" strokeDasharray={`${segmentLengths[index]} ${circumference - segmentLengths[index]}`} strokeDashoffset={-segmentOffsets[index]}><title>{row.label}: {row.value}</title></circle>)}
      <text x="100" y="105" textAnchor="middle" className="fill-foreground text-[16px] font-semibold [transform:rotate(90deg)] [transform-origin:100px_100px]">{total.toLocaleString("en-IN")}</text>
      <text x="100" y="124" textAnchor="middle" className="fill-muted-foreground text-[9px] [transform:rotate(90deg)] [transform-origin:100px_100px]">beneficiaries</text>
    </svg>
    <ul className="max-h-48 min-w-28 flex-1 space-y-2 overflow-y-auto">
      {rows.map((row, index) => <li key={`${row.label}-${index}`} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="truncate">{row.label}</span></span><span className="tabular-nums text-muted-foreground">{row.value.toLocaleString("en-IN")}</span></li>)}
    </ul>
  </div>;
}

function VerticalBars({ rows }: { rows: ChartValue[] }) {
  const width = Math.max(300, rows.length * 68);
  const height = 220, top = 14, base = 178, chartHeight = base - top;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="overflow-x-auto">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart" className="h-56 min-w-full">
      <line x1="16" y1={base} x2={width - 8} y2={base} stroke="#E5E0E9" />
      {rows.map((row, index) => {
        const slot = (width - 32) / rows.length, barWidth = Math.min(38, slot * 0.62), barHeight = row.value / max * chartHeight;
        const x = 16 + slot * index + (slot - barWidth) / 2, y = base - barHeight;
        return <g key={`${row.label}-${index}`}><rect x={x} y={y} width={barWidth} height={barHeight} rx="5" fill={COLORS[index % COLORS.length]}><title>{row.label}: {row.value}</title></rect><text x={x + barWidth / 2} y={Math.max(11, y - 5)} textAnchor="middle" className="fill-muted-foreground text-[10px]">{row.value}</text><text x={x + barWidth / 2} y="197" textAnchor="middle" className="fill-muted-foreground text-[10px]">{shortLabel(row.label)}</text></g>;
      })}
    </svg>
  </div>;
}

function HorizontalBars({ rows }: { rows: ChartValue[] }) {
  const width = 430, rowHeight = 28, labelWidth = 160, barWidth = width - labelWidth - 52;
  const height = Math.max(224, rows.length * rowHeight + 12);
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="max-h-56 overflow-auto">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Horizontal bar chart" className="w-full">
      {rows.map((row, index) => { const y = index * rowHeight + 6, length = row.value / max * barWidth; return <g key={`${row.label}-${index}`}><text x="0" y={y + 15} className="fill-foreground text-[10px]">{shortLabel(row.label, 25)}</text><rect x={labelWidth} y={y} width={Math.max(2, length)} height="18" rx="4" fill={COLORS[index % COLORS.length]}><title>{row.label}: {row.value}</title></rect><text x={labelWidth + length + 6} y={y + 14} className="fill-muted-foreground text-[10px]">{row.value}</text></g>; })}
    </svg>
  </div>;
}

function shortLabel(label: string, max = 12) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
