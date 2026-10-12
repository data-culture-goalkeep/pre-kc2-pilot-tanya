export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
export type Month = (typeof MONTHS)[number];
export const ATTENDANCE_PROGRAMS = ["Daycare", "Homecare"] as const;
export type DaycareFilters = { month: string; financial_year: string; program: string; beneficiary: string };
export const ATTENDANCE_CODES = ["P", "A", "H", "NA"] as const;
export function currentIndiaMonth() {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long" }).format(new Date());
}
export function currentIndiaFinancialYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}
export function financialYearOptions(current = currentIndiaFinancialYear()) {
  const start = Number(current.slice(0, 4));
  return Array.from({ length: 6 }, (_, offset) => `${start - offset}-${String((start - offset + 1) % 100).padStart(2, "0")}`);
}
export function monthIndex(month: string) { return MONTHS.indexOf(month as Month); }
