export type FinancialYearRange = { start: string; end: string };

export function financialYearDateRange(value: string): FinancialYearRange | null {
  if (!/^\\d{4}-\\d{2}$/.test(value)) return null;
  const startYear = Number(value.slice(0, 4));
  const expectedEnd = String((startYear + 1) % 100).padStart(2, "0");
  if (value.slice(5) !== expectedEnd) return null;
  return { start: `${startYear}-04-01`, end: `${startYear + 1}-04-01` };
}

export function isFinancialYear(value: string): boolean {
  return financialYearDateRange(value) !== null;
}

export function financialYearForDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.getUTCMonth() + 1;
  const startYear = date.getUTCFullYear() - (month < 4 ? 1 : 0);
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
