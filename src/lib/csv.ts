export function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution when exporting user-entered text.
  if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv<T extends object>(rows: T[], columns: readonly (keyof T)[]): string {
  const header = columns.map(csvCell).join(",");
  return "\uFEFF" + [header, ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\r\n");
}
