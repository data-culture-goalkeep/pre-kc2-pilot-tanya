import type { ReactNode } from "react";

export type TableColumn<T> = { key: keyof T; label: string; render?: (row: T) => ReactNode };

export function DataTable<T extends object>({ rows, columns, rowKey, caption, emptyMessage }: { rows: T[]; columns: TableColumn<T>[]; rowKey: keyof T; caption: string; emptyMessage: string }) {
  return (
    <div className="overflow-x-auto rounded-t-lg border-b border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60"><tr>{columns.map((column) => <th key={String(column.key)} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground">{column.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{rows.length ? rows.map((row) => <tr key={String(row[rowKey])} className="hover:bg-brand-light-blue/10">{columns.map((column) => <td key={String(column.key)} className="whitespace-nowrap px-4 py-4">{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
  );
}
